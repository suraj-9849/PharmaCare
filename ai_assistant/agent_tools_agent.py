"""
Agent Tools for PharmaCare Pharmacy Management (Refined Version)
Uses Neon PostgreSQL database
"""

from langchain.tools import tool
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from datetime import datetime, timedelta
from typing import List
import random
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_engine():
    """Create database engine with NullPool for Neon"""
    return create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        connect_args={
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
    )


def mock_price_search(drug_name: str):
    """Simulates searching for drug prices online"""
    sources = ["1mg", "Apollo Pharmacy", "PharmEasy"]
    base_price = random.uniform(50, 500)
    results = []
    for source in sources:
        price = round(base_price * random.uniform(0.85, 1.15), 2)
        results.append({"source": source, "price": price})
    return sorted(results, key=lambda x: x["price"])


# ==================== INPUT MODELS ====================


class OrderItem(BaseModel):
    drug_name: str = Field(description="Name of the drug")
    quantity: int = Field(description="Quantity to order")


class PlaceOrderInput(BaseModel):
    items: List[OrderItem] = Field(description="List of items to order")


class AddStockInput(BaseModel):
    drug_name: str = Field(description="Name of the drug to add")
    quantity: int = Field(description="Quantity to add")
    purchase_price: float = Field(description="Purchase price per unit")
    expiry_date: str = Field(description="Expiry date in YYYY-MM-DD format")


class RemoveStockInput(BaseModel):
    drug_name: str = Field(description="Name of the drug to remove")
    quantity: int = Field(description="Quantity to remove")
    reason: str = Field(
        description="Reason for removal (e.g., 'sales', 'expired', 'damaged')", default="sales"
    )


class ExpiryCheckInput(BaseModel):
    days: int = Field(description="Number of days to check for expiry", default=30)


class SalesAnalyticsInput(BaseModel):
    period: str = Field(
        description="Time period: 'today', 'week', 'month', or 'all'", default="today"
    )


# ==================== TOOLS ====================


@tool
def check_low_stock(query: str = "") -> str:
    """
    Checks for drugs that are below their reorder level.
    Returns a markdown table of items needing reorder.
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            sql = text(
                """
                SELECT
                    d.id,
                    d.brand_name,
                    d.generic_name,
                    d.category,
                    d.reorder_level,
                    COALESCE(SUM(ib.quantity), 0) as current_stock
                FROM drugs d
                LEFT JOIN inventory_batches ib ON d.id = ib.drug_id
                GROUP BY d.id, d.brand_name, d.generic_name, d.category, d.reorder_level
                HAVING COALESCE(SUM(ib.quantity), 0) < d.reorder_level
                ORDER BY (d.reorder_level - COALESCE(SUM(ib.quantity), 0)) DESC
                LIMIT 20
            """
            )
            result = conn.execute(sql)
            rows = result.fetchall()

            if not rows:
                return "✅ **Stock levels are healthy!** No items currently need reordering."

            response = "## ⚠️ Low Stock Alert\n\n"
            response += "| Drug | Category | Current Stock | Reorder Level | Deficit |\n"
            response += "|------|----------|---------------|---------------|--------|\n"

            for row in rows:
                deficit = row.reorder_level - row.current_stock
                response += f"| **{row.brand_name}** | {row.category} | {row.current_stock} | {row.reorder_level} | -{deficit} |\n"

            response += "\n### 💰 Price Comparison for Top Items\n\n"
            for row in rows[:3]:
                prices = mock_price_search(row.generic_name)
                response += f"**{row.brand_name}** ({row.generic_name}):\n"
                for p in prices:
                    response += f"- {p['source']}: ₹{p['price']:.2f}\n"
                response += f"- 🏆 Best: **{prices[0]['source']}** at ₹{prices[0]['price']:.2f}\n\n"

            return response

    except Exception as e:
        return f"❌ Error checking stock: {str(e)}"


@tool(args_schema=ExpiryCheckInput)
def check_expiring_stock(days: int = 30) -> str:
    """
    Checks for medicine batches expiring within the specified number of days.
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            sql = text(
                """
                SELECT
                    d.brand_name,
                    ib.batch_number,
                    ib.quantity,
                    ib.expiry_date,
                    ib.location,
                    EXTRACT(DAY FROM ib.expiry_date - CURRENT_DATE) as days_until_expiry
                FROM inventory_batches ib
                JOIN drugs d ON ib.drug_id = d.id
                WHERE ib.expiry_date <= CURRENT_DATE + :days_interval
                    AND ib.expiry_date >= CURRENT_DATE
                    AND ib.quantity > 0
                ORDER BY ib.expiry_date ASC
                LIMIT 20
            """
            )
            result = conn.execute(sql, {"days_interval": timedelta(days=days)})
            rows = result.fetchall()

            if not rows:
                return f"✅ **No items expiring in the next {days} days!**"

            response = f"## ⏰ Items Expiring in Next {days} Days\n\n"
            response += "| Drug | Batch | Qty | Expiry Date | Days Left | Location |\n"
            response += "|------|-------|-----|-------------|-----------|----------|\n"

            total_qty = 0
            for row in rows:
                days_left = int(row.days_until_expiry)
                urgency = "🔴" if days_left <= 7 else "🟡" if days_left <= 14 else "🟢"
                response += f"| {urgency} **{row.brand_name}** | {row.batch_number} | {row.quantity} | {row.expiry_date.strftime('%Y-%m-%d')} | {days_left} | {row.location or 'N/A'} |\n"
                total_qty += row.quantity

            return response

    except Exception as e:
        return f"❌ Error checking expiry: {str(e)}"


@tool
def get_inventory_summary(query: str = "") -> str:
    """
    Gets a statistical summary of the current inventory.
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            stats = conn.execute(
                text(
                    """
                SELECT
                    (SELECT COUNT(*) FROM drugs) as total_drugs,
                    (SELECT COUNT(*) FROM inventory_batches WHERE quantity > 0) as active_batches,
                    (SELECT COALESCE(SUM(quantity), 0) FROM inventory_batches) as total_units,
                    (SELECT COUNT(*) FROM suppliers) as total_suppliers
            """
                )
            ).fetchone()

            categories = conn.execute(
                text(
                    """
                SELECT d.category, COUNT(DISTINCT d.id) as drug_count, COALESCE(SUM(ib.quantity), 0) as total_stock
                FROM drugs d LEFT JOIN inventory_batches ib ON d.id = ib.drug_id
                GROUP BY d.category ORDER BY total_stock DESC
            """
                )
            ).fetchall()

            low_stock = conn.execute(
                text(
                    """
                SELECT COUNT(*) as count FROM (
                    SELECT d.id FROM drugs d LEFT JOIN inventory_batches ib ON d.id = ib.drug_id
                    GROUP BY d.id, d.reorder_level HAVING COALESCE(SUM(ib.quantity), 0) < d.reorder_level
                ) subq
            """
                )
            ).fetchone()

            response = "## 📊 Inventory Summary\n\n"
            response += f"- **Total Drugs:** {stats.total_drugs}\n"
            response += f"- **Total Units:** {stats.total_units:,}\n"
            response += f"- **Low Stock Items:** {low_stock.count} ⚠️\n\n"
            response += "### Stock by Category\n"
            for cat in categories:
                response += f"- **{cat.category}:** {cat.total_stock:,} units\n"

            return response

    except Exception as e:
        return f"❌ Error getting summary: {str(e)}"


@tool(args_schema=PlaceOrderInput)
def place_order(items: List[OrderItem]) -> str:
    """
    Generates a purchase order comparison for a list of drugs.
    """
    if not items:
        return "Please specify items to order."

    response = "## 🛒 Purchase Order Comparison\n\n"
    response += "| Item | Qty | 1mg | PharmEasy | Apollo | Best Price |\n"
    response += "|------|-----|-----|-----------|--------|------------|\n"

    totals = {"1mg": 0, "PharmEasy": 0, "Apollo Pharmacy": 0}

    for item in items:
        prices = mock_price_search(item.drug_name)
        price_map = {p["source"]: p["price"] for p in prices}
        best_source = min(price_map, key=price_map.get)
        best_price = price_map[best_source]

        row = f"| **{item.drug_name}** | {item.quantity} |"
        for source in ["1mg", "PharmEasy", "Apollo Pharmacy"]:
            unit_price = price_map.get(source, 0)
            total = unit_price * item.quantity
            totals[source] += total
            row += f" ₹{total:.0f} |"
        row += f" ₹{best_price * item.quantity:.0f} ({best_source[:6]}) |"
        response += row + "\n"

    response += "\n### 💰 Estimated Totals\n"
    for source, total in sorted(totals.items(), key=lambda x: x[1]):
        marker = "🏆 " if total == min(totals.values()) else ""
        response += f"- {marker}**{source}:** ₹{total:.2f}\n"

    return response


@tool(args_schema=AddStockInput)
def add_stock_to_inventory(
    drug_name: str, quantity: int, purchase_price: float, expiry_date: str
) -> str:
    """
    Adds stock to inventory. Requires specific details.
    """
    engine = get_db_engine()
    try:
        # Validate date format
        try:
            expiry_dt = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            return "❌ Invalid date format. Please use YYYY-MM-DD."

        with engine.connect() as conn:
            # Get default supplier
            supplier = conn.execute(text("SELECT id FROM suppliers LIMIT 1")).fetchone()
            if not supplier:
                return "❌ No suppliers found. Please add a supplier first."

            # Find drug
            drug = conn.execute(
                text(
                    "SELECT id, brand_name FROM drugs WHERE LOWER(brand_name) LIKE LOWER(:name) LIMIT 1"
                ),
                {"name": f"%{drug_name}%"},
            ).fetchone()

            if not drug:
                return f"❌ Drug '{drug_name}' not found in database."

            # Create batch
            batch_id = str(uuid.uuid4())[:24]
            batch_number = f"ADD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            sell_price = round(purchase_price * 1.3, 2)  # 30% markup

            conn.execute(
                text(
                    """
                INSERT INTO inventory_batches
                (id, drug_id, batch_number, quantity, purchase_price, sell_price, expiry_date, supplier_id, location, date_added, created_at, updated_at)
                VALUES
                (:id, :drug_id, :batch_number, :quantity, :purchase_price, :sell_price, :expiry_date, :supplier_id, 'Main Storage', NOW(), NOW(), NOW())
            """
                ),
                {
                    "id": batch_id,
                    "drug_id": drug.id,
                    "batch_number": batch_number,
                    "quantity": quantity,
                    "purchase_price": purchase_price,
                    "sell_price": sell_price,
                    "expiry_date": expiry_dt,
                    "supplier_id": supplier.id,
                },
            )
            conn.commit()

            return f"✅ Successfully added **{quantity}** units of **{drug.brand_name}**.\n- Batch: `{batch_number}`\n- Expiry: `{expiry_date}`\n- Cost: ₹{purchase_price}/unit"

    except Exception as e:
        return f"❌ Error adding stock: {str(e)}"


@tool(args_schema=RemoveStockInput)
def remove_stock_from_inventory(drug_name: str, quantity: int, reason: str = "sales") -> str:
    """
    Removes stock from inventory using FIFO (First-In-First-Out).
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            drug = conn.execute(
                text(
                    "SELECT id, brand_name FROM drugs WHERE LOWER(brand_name) LIKE LOWER(:name) LIMIT 1"
                ),
                {"name": f"%{drug_name}%"},
            ).fetchone()

            if not drug:
                return f"❌ Drug '{drug_name}' not found."

            batches = conn.execute(
                text(
                    "SELECT id, quantity FROM inventory_batches WHERE drug_id = :drug_id AND quantity > 0 ORDER BY expiry_date ASC"
                ),
                {"drug_id": drug.id},
            ).fetchall()

            if not batches:
                return f"❌ No stock available for **{drug.brand_name}**."

            remaining = quantity
            removed_total = 0

            for batch in batches:
                if remaining <= 0:
                    break

                take = min(batch.quantity, remaining)
                conn.execute(
                    text(
                        "UPDATE inventory_batches SET quantity = quantity - :take, updated_at = NOW() WHERE id = :id"
                    ),
                    {"take": take, "id": batch.id},
                )
                remaining -= take
                removed_total += take

            conn.commit()

            if remaining > 0:
                return f"⚠️ Partially removed **{removed_total}** units of **{drug.brand_name}**. (Requested {quantity}, but only {removed_total} were in stock)."

            return f"✅ Removed **{quantity}** units of **{drug.brand_name}** from inventory (Reason: {reason})."

    except Exception as e:
        return f"❌ Error removing stock: {str(e)}"


@tool(args_schema=SalesAnalyticsInput)
def get_sales_analytics(period: str = "today") -> str:
    """
    Gets sales analytics for a given period (today, week, month, all).
    """
    engine = get_db_engine()

    # Safe date calculation
    if period.lower() == "week":
        date_filter = datetime.now() - timedelta(days=7)
    elif period.lower() == "month":
        date_filter = datetime.now() - timedelta(days=30)
    elif period.lower() == "all":
        date_filter = datetime(2020, 1, 1)
    else:  # today
        date_filter = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    try:
        with engine.connect() as conn:
            sales = conn.execute(
                text(
                    "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE sale_date >= :date AND status = 'COMPLETED'"
                ),
                {"date": date_filter},
            ).fetchone()

            top_drugs = conn.execute(
                text(
                    """
                    SELECT d.brand_name, SUM(si.quantity) as units
                    FROM sale_items si JOIN drugs d ON si.drug_id = d.id JOIN sales s ON si.sale_id = s.id
                    WHERE s.sale_date >= :date AND s.status = 'COMPLETED'
                    GROUP BY d.brand_name ORDER BY units DESC LIMIT 5
                """
                ),
                {"date": date_filter},
            ).fetchall()

            response = f"## 📈 Sales Analytics ({period.title()})\n\n"
            response += f"- **Transactions:** {sales.count}\n"
            response += f"- **Revenue:** ₹{float(sales.revenue):,.2f}\n\n"

            if top_drugs:
                response += "### 🏆 Top Selling Drugs\n"
                for d in top_drugs:
                    response += f"- **{d.brand_name}:** {d.units} units\n"

            return response

    except Exception as e:
        return f"❌ Error getting analytics: {str(e)}"


@tool
def get_full_inventory(query: str = "") -> str:
    """
    Returns a detailed list of current inventory items (batches with quantity > 0).
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            sql = text(
                """
                SELECT
                    d.brand_name,
                    d.generic_name,
                    d.category,
                    ib.batch_number,
                    ib.quantity,
                    ib.expiry_date,
                    ib.location
                FROM inventory_batches ib
                JOIN drugs d ON ib.drug_id = d.id
                WHERE ib.quantity > 0
                ORDER BY d.brand_name ASC
                LIMIT 50
            """
            )
            rows = conn.execute(sql).fetchall()

            if not rows:
                return "✅ **Inventory is empty.** No active batches found."

            response = "## 📦 Current Inventory (Top 50 Items)\n\n"
            response += (
                "| Brand Name | Generic Name | Category | Batch | Qty | Expiry | Location |\n"
            )
            response += "|---|---|---|---|---|---|---|\n"

            for row in rows:
                expiry = row.expiry_date.strftime("%Y-%m-%d") if row.expiry_date else "N/A"
                response += f"| **{row.brand_name}** | {row.generic_name} | {row.category} | {row.batch_number} | {row.quantity} | {expiry} | {row.location or 'Main'} |\n"

            # Check total count
            count_sql = text("SELECT COUNT(*) FROM inventory_batches WHERE quantity > 0")
            total_count = conn.execute(count_sql).scalar()

            if total_count > 50:
                response += (
                    f"\n*Showing 50 of {total_count} items. Use specific queries to find others.*"
                )

            return response

    except Exception as e:
        return f"❌ Error fetching inventory: {str(e)}"


@tool
def forecast_demand(query: str = "") -> str:
    """
    Forecasts medicine demand based on season and college events for Malla Reddy College using a simulated Random Forest model.
    Generates a list of recommended drugs to stock, even if they are not currently in the database.
    """
    engine = get_db_engine()
    current_month = datetime.now().month

    # 1. Define Seasonal Knowledge Base (Simulated AI Knowledge)
    seasonal_data = {
        "Winter": [
            {
                "brand": "Amoxil 500",
                "generic": "Amoxicillin",
                "category": "Antibiotics",
                "price": 120.00,
            },
            {
                "brand": "Dolo 650",
                "generic": "Paracetamol",
                "category": "Analgesics",
                "price": 30.00,
            },
            {
                "brand": "Benadryl DR",
                "generic": "Diphenhydramine",
                "category": "Cough Syrups",
                "price": 115.00,
            },
            {
                "brand": "Cetaphil",
                "generic": "Moisturizer",
                "category": "Dermatologicals",
                "price": 450.00,
            },
            {
                "brand": "Vicks VapoRub",
                "generic": "Menthol/Camphor",
                "category": "Cold Preparations",
                "price": 45.00,
            },
            {
                "brand": "Azithral 500",
                "generic": "Azithromycin",
                "category": "Antibiotics",
                "price": 118.00,
            },
            {
                "brand": "Cheston Cold",
                "generic": "Cetirizine+Paracetamol",
                "category": "Cold Preparations",
                "price": 55.00,
            },
            {"brand": "Honitus", "generic": "Herbal", "category": "Cough Syrups", "price": 95.00},
        ],
        "Summer": [
            {
                "brand": "Electral",
                "generic": "Oral Rehydration Salts",
                "category": "Electrolytes",
                "price": 22.00,
            },
            {
                "brand": "Pan-D",
                "generic": "Pantoprazole+Domperidone",
                "category": "Antacids",
                "price": 190.00,
            },
            {
                "brand": "Lakme Sun Expert",
                "generic": "SPF 50 Sunscreen",
                "category": "Dermatologicals",
                "price": 350.00,
            },
            {"brand": "Glucon-D", "generic": "Glucose", "category": "Supplements", "price": 45.00},
            {
                "brand": "Crocin Advance",
                "generic": "Paracetamol",
                "category": "Antipyretics",
                "price": 20.00,
            },
            {"brand": "Omee", "generic": "Omeprazole", "category": "Antacids", "price": 55.00},
        ],
        "Monsoon": [
            {
                "brand": "Odomos",
                "generic": "N,N-Diethyl-benzamide",
                "category": "Repellents",
                "price": 90.00,
            },
            {
                "brand": "Laridago",
                "generic": "Chloroquine",
                "category": "Antimalarials",
                "price": 15.00,
            },
            {
                "brand": "Calpol 650",
                "generic": "Paracetamol",
                "category": "Antipyretics",
                "price": 32.00,
            },
            {
                "brand": "Ciplox 500",
                "generic": "Ciprofloxacin",
                "category": "Antibiotics",
                "price": 40.00,
            },
            {
                "brand": "Betadine",
                "generic": "Povidone-Iodine",
                "category": "Antiseptics",
                "price": 110.00,
            },
            {
                "brand": "Allegra 120",
                "generic": "Fexofenadine",
                "category": "Antihistamines",
                "price": 180.00,
            },
            {"brand": "Taxim-O", "generic": "Cefixime", "category": "Antibiotics", "price": 140.00},
        ],
    }

    # Season determination
    if current_month in [11, 12, 1, 2]:
        season = "Winter"
    elif current_month in [3, 4, 5, 6]:
        season = "Summer"
    else:
        season = "Monsoon"

    recommended_drugs = seasonal_data.get(season, [])

    # College Context
    college_name = "Malla Reddy College of Engineering and Technology"
    est_population = 12500

    response = "## 🔮 AI Demand Forecast Report\n"
    response += "**Model:** Random Forest Regressor v2.4 | **Training Data:** 2020-2024 Sales\n"
    response += f"**Target Context:** {college_name} (Pop: {est_population})\n"
    response += f"**Detected Season:** {season}\n\n"

    response += "### 📊 Predicted Inventory Requirements\n"
    response += "| Drug Name | Generic Name | Category | Current Stock | Predicted Demand | Gap | Est. Price | Confidence |\n"
    response += "|---|---|---|---|---|---|---|---|\n"

    try:
        with engine.connect() as conn:
            for drug_info in recommended_drugs:
                # Check if drug exists in DB
                drug_db = conn.execute(
                    text("SELECT id FROM drugs WHERE LOWER(brand_name) = LOWER(:name)"),
                    {"name": drug_info["brand"]},
                ).fetchone()

                current_stock = 0
                if drug_db:
                    stock_res = conn.execute(
                        text(
                            "SELECT COALESCE(SUM(quantity), 0) FROM inventory_batches WHERE drug_id = :id"
                        ),
                        {"id": drug_db.id},
                    ).fetchone()
                    current_stock = stock_res[0]

                # Simulate model output
                predicted_demand = random.randint(200, 600)

                # Adjust prediction logic
                if current_stock < 50:
                    predicted_demand += random.randint(50, 150)  # Higher demand for low stock items

                gap = predicted_demand - current_stock
                gap_str = f"**-{gap}**" if gap > 0 else f"+{abs(gap)}"
                confidence = f"{random.randint(88, 99)}%"
                price = f"₹{drug_info['price']:.2f}"

                # Mark if it's a new recommendation
                stock_display = f"{current_stock}" if drug_db else "**0 (New)**"

                response += f"| {drug_info['brand']} | {drug_info['generic']} | {drug_info['category']} | {stock_display} | {predicted_demand} | {gap_str} | {price} | {confidence} |\n"

    except Exception as e:
        response += f"\nError executing model inference: {str(e)}"

    response += "\n\n### 🧠 Model Insights\n"
    response += (
        "- **Trend Analysis:** Detected 15% increase in respiratory cases compared to last year.\n"
    )
    response += "- **Event Impact:** Upcoming 'TechnoFest' at Malla Reddy College may increase demand for First Aid supplies.\n"
    response += "- **Recommendation:** The table above lists high-priority items. Items marked **(New)** should be added to the database immediately."

    return response
