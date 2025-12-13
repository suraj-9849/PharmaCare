"""
Agent Tools for PharmaCare Pharmacy Management
Uses Neon PostgreSQL database
"""

from langchain.tools import tool
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from datetime import datetime, timedelta
import random
import re
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


@tool
def check_low_stock(query: str = "") -> str:
    """
    Checks for drugs that are below their reorder level.
    Use when user asks about 'low stock', 'reorder', or 'what needs restocking'.
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            # Query to find drugs with total inventory below reorder level
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

            # Show prices for top 3 low stock items
            for row in rows[:3]:
                prices = mock_price_search(row.generic_name)
                response += f"**{row.brand_name}** ({row.generic_name}):\n"
                for p in prices:
                    response += f"- {p['source']}: ₹{p['price']:.2f}\n"
                response += f"- 🏆 Best: **{prices[0]['source']}** at ₹{prices[0]['price']:.2f}\n\n"

            return response

    except Exception as e:
        return f"❌ Error checking stock: {str(e)}"


@tool
def check_expiring_stock(days: str = "30") -> str:
    """
    Checks for medicine batches expiring soon.
    Use when user asks about 'expiring', 'expiry', or 'expires soon'.
    Input: number of days to check (default 30).
    """
    try:
        num_days = int(days) if days.isdigit() else 30
    except (ValueError, AttributeError):
        num_days = 30

    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            sql = text(
                """
                SELECT
                    d.brand_name,
                    d.generic_name,
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
            result = conn.execute(sql, {"days_interval": timedelta(days=num_days)})
            rows = result.fetchall()

            if not rows:
                return f"✅ **No items expiring in the next {num_days} days!**"

            response = f"## ⏰ Items Expiring in Next {num_days} Days\n\n"
            response += "| Drug | Batch | Qty | Expiry Date | Days Left | Location |\n"
            response += "|------|-------|-----|-------------|-----------|----------|\n"

            total_qty = 0
            for row in rows:
                days_left = int(row.days_until_expiry)
                urgency = "🔴" if days_left <= 7 else "🟡" if days_left <= 14 else "🟢"
                response += f"| {urgency} **{row.brand_name}** | {row.batch_number} | {row.quantity} | {row.expiry_date.strftime('%Y-%m-%d')} | {days_left} | {row.location or 'N/A'} |\n"
                total_qty += row.quantity

            response += f"\n**Total units expiring:** {total_qty}\n"
            response += "\n### 💡 Recommendations\n"
            response += "- Consider running promotions on items expiring within 14 days\n"
            response += (
                "- Items expiring within 7 days should be prioritized for sale or disposal\n"
            )

            return response

    except Exception as e:
        return f"❌ Error checking expiry: {str(e)}"


@tool
def get_inventory_summary(query: str = "") -> str:
    """
    Gets a summary of current inventory status.
    Use when user asks for 'inventory summary', 'stock overview', or 'inventory status'.
    """
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            # Total drugs and batches
            stats_sql = text(
                """
                SELECT
                    (SELECT COUNT(*) FROM drugs) as total_drugs,
                    (SELECT COUNT(*) FROM inventory_batches WHERE quantity > 0) as active_batches,
                    (SELECT COALESCE(SUM(quantity), 0) FROM inventory_batches) as total_units,
                    (SELECT COUNT(*) FROM suppliers) as total_suppliers
            """
            )
            stats = conn.execute(stats_sql).fetchone()

            # Category breakdown
            category_sql = text(
                """
                SELECT
                    d.category,
                    COUNT(DISTINCT d.id) as drug_count,
                    COALESCE(SUM(ib.quantity), 0) as total_stock
                FROM drugs d
                LEFT JOIN inventory_batches ib ON d.id = ib.drug_id
                GROUP BY d.category
                ORDER BY total_stock DESC
            """
            )
            categories = conn.execute(category_sql).fetchall()

            # Low stock count
            low_stock_sql = text(
                """
                SELECT COUNT(*) as low_stock_count
                FROM (
                    SELECT d.id
                    FROM drugs d
                    LEFT JOIN inventory_batches ib ON d.id = ib.drug_id
                    GROUP BY d.id, d.reorder_level
                    HAVING COALESCE(SUM(ib.quantity), 0) < d.reorder_level
                ) subq
            """
            )
            low_stock = conn.execute(low_stock_sql).fetchone()

            response = "## 📊 Inventory Summary\n\n"
            response += "### Overview\n"
            response += f"- **Total Drugs:** {stats.total_drugs}\n"
            response += f"- **Active Batches:** {stats.active_batches}\n"
            response += f"- **Total Units in Stock:** {stats.total_units:,}\n"
            response += f"- **Total Suppliers:** {stats.total_suppliers}\n"
            response += f"- **Low Stock Items:** {low_stock.low_stock_count} ⚠️\n\n"

            response += "### Stock by Category\n\n"
            response += "| Category | Drugs | Total Stock |\n"
            response += "|----------|-------|-------------|\n"
            for cat in categories:
                response += f"| {cat.category} | {cat.drug_count} | {cat.total_stock:,} |\n"

            return response

    except Exception as e:
        return f"❌ Error getting summary: {str(e)}"


@tool
def place_order(order_details: str) -> str:
    """
    Creates a purchase order for drugs with price comparisons.
    Input should be like '50 Paracetamol and 30 Amoxicillin' or 'order 100 Dolo 650'.
    """
    # Parse items from text
    pattern = r"(\d+)\s+(?:units?\s+(?:of\s+)?)?([a-zA-Z0-9\s\-]+?)(?:,|\s+and\s+|$)"
    matches = re.findall(pattern, order_details, re.IGNORECASE)

    if not matches:
        # Try simpler pattern
        pattern = r"(\d+)\s+([a-zA-Z0-9\s\-]+)"
        matches = re.findall(pattern, order_details, re.IGNORECASE)

    items = [(int(qty), name.strip()) for qty, name in matches if name.strip()]

    if not items:
        return "Please specify quantity and drug name (e.g., '50 Paracetamol and 30 Dolo 650')."

    response = "## 🛒 Purchase Order\n\n"
    response += "| Item | Qty | 1mg | PharmEasy | Apollo | Best Price |\n"
    response += "|------|-----|-----|-----------|--------|------------|\n"

    totals = {"1mg": 0, "PharmEasy": 0, "Apollo Pharmacy": 0}

    for qty, drug_name in items:
        prices = mock_price_search(drug_name)
        price_map = {p["source"]: p["price"] for p in prices}

        best_source = min(price_map, key=price_map.get)
        best_price = price_map[best_source]

        row = f"| **{drug_name}** | {qty} |"
        for source in ["1mg", "PharmEasy", "Apollo Pharmacy"]:
            unit_price = price_map.get(source, 0)
            total = unit_price * qty
            totals[source] += total
            row += f" ₹{total:.0f} |"
        row += f" ₹{best_price * qty:.0f} ({best_source[:6]}) |"
        response += row + "\n"

    response += "\n### 💰 Cart Totals\n"
    for source, total in sorted(totals.items(), key=lambda x: x[1]):
        marker = "🏆 " if total == min(totals.values()) else ""
        response += f"- {marker}**{source}:** ₹{total:.2f}\n"

    best_total_source = min(totals, key=totals.get)
    response += f"\n**Recommendation:** Order from **{best_total_source}** to save ₹{max(totals.values()) - min(totals.values()):.2f}\n\n"

    response += "### 🔗 Quick Links\n"
    for qty, drug_name in items[:5]:
        encoded_name = drug_name.replace(" ", "%20")
        response += f"- [{drug_name}](https://www.1mg.com/search/all?name={encoded_name})\n"

    response += "\n---\n**To confirm purchase:** Type `Confirmed payment for " + order_details + "`"

    return response


@tool
def add_stock_to_inventory(confirmation_details: str) -> str:
    """
    Adds stock to inventory after payment confirmation.
    Use when user confirms payment like 'Confirmed payment for 50 Paracetamol'.
    """
    # Parse items
    pattern = r"(\d+)\s+(?:units?\s+(?:of\s+)?)?([a-zA-Z0-9\s\-]+?)(?:,|\s+and\s+|$)"
    matches = re.findall(pattern, confirmation_details, re.IGNORECASE)

    if not matches:
        pattern = r"(\d+)\s+([a-zA-Z0-9\s\-]+)"
        matches = re.findall(pattern, confirmation_details, re.IGNORECASE)

    items = [
        (int(qty), name.strip())
        for qty, name in matches
        if name.strip() and name.strip().lower() not in ["confirmed", "payment", "for"]
    ]

    if not items:
        return "❌ Could not parse items. Please try: 'Confirmed payment for 50 Dolo 650'"

    engine = get_db_engine()
    results = []

    try:
        with engine.connect() as conn:
            # Get default supplier
            supplier_sql = text("SELECT id FROM suppliers LIMIT 1")
            supplier = conn.execute(supplier_sql).fetchone()
            supplier_id = supplier.id if supplier else None

            if not supplier_id:
                return "❌ No suppliers found in database. Please add a supplier first."

            for qty, drug_name in items:
                # Find drug (case-insensitive partial match)
                drug_sql = text(
                    """
                    SELECT id, brand_name FROM drugs
                    WHERE LOWER(brand_name) LIKE LOWER(:name)
                    LIMIT 1
                """
                )
                drug = conn.execute(drug_sql, {"name": f"%{drug_name}%"}).fetchone()

                if not drug:
                    results.append(f"⚠️ Drug '{drug_name}' not found - skipped")
                    continue

                # Create new batch
                batch_id = str(uuid.uuid4())[:24]  # cuid-like
                batch_number = (
                    f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                )
                purchase_price = round(random.uniform(20, 200), 2)
                sell_price = round(purchase_price * 1.3, 2)  # 30% markup
                expiry_date = datetime.now() + timedelta(days=365 + random.randint(0, 365))

                insert_sql = text(
                    """
                    INSERT INTO inventory_batches
                    (id, drug_id, batch_number, quantity, purchase_price, sell_price, expiry_date, supplier_id, location, date_added, created_at, updated_at)
                    VALUES
                    (:id, :drug_id, :batch_number, :quantity, :purchase_price, :sell_price, :expiry_date, :supplier_id, :location, NOW(), NOW(), NOW())
                """
                )

                conn.execute(
                    insert_sql,
                    {
                        "id": batch_id,
                        "drug_id": drug.id,
                        "batch_number": batch_number,
                        "quantity": qty,
                        "purchase_price": purchase_price,
                        "sell_price": sell_price,
                        "expiry_date": expiry_date,
                        "supplier_id": supplier_id,
                        "location": "Main Storage",
                    },
                )

                results.append(
                    f"✅ Added **{qty}** units of **{drug.brand_name}** (Batch: {batch_number})"
                )

            conn.commit()

        if not results:
            return "❌ No items were added to inventory."

        return "## 🎉 Inventory Updated!\n\n" + "\n".join(results)

    except Exception as e:
        return f"❌ Error updating inventory: {str(e)}"


@tool
def remove_stock_from_inventory(removal_details: str) -> str:
    """
    Removes stock from inventory (for sales, expiry, damage).
    Use when user says 'remove 10 Dolo' or 'discard expired Paracetamol'.
    Uses FIFO - removes from oldest batches first.
    """
    pattern = r"(\d+)\s+(?:units?\s+(?:of\s+)?)?([a-zA-Z0-9\s\-]+?)(?:,|\s+and\s+|$)"
    matches = re.findall(pattern, removal_details, re.IGNORECASE)

    if not matches:
        pattern = r"(\d+)\s+([a-zA-Z0-9\s\-]+)"
        matches = re.findall(pattern, removal_details, re.IGNORECASE)

    items = [
        (int(qty), name.strip())
        for qty, name in matches
        if name.strip() and name.strip().lower() not in ["remove", "delete", "discard"]
    ]

    if not items:
        return "❌ Could not parse items. Please try: 'Remove 10 Dolo 650'"

    engine = get_db_engine()
    results = []

    try:
        with engine.connect() as conn:
            for qty_to_remove, drug_name in items:
                # Find drug
                drug_sql = text(
                    """
                    SELECT id, brand_name FROM drugs
                    WHERE LOWER(brand_name) LIKE LOWER(:name)
                    LIMIT 1
                """
                )
                drug = conn.execute(drug_sql, {"name": f"%{drug_name}%"}).fetchone()

                if not drug:
                    results.append(f"❌ Drug '{drug_name}' not found")
                    continue

                # Get batches with stock, ordered by expiry (FIFO)
                batches_sql = text(
                    """
                    SELECT id, batch_number, quantity, expiry_date
                    FROM inventory_batches
                    WHERE drug_id = :drug_id AND quantity > 0
                    ORDER BY expiry_date ASC
                """
                )
                batches = conn.execute(batches_sql, {"drug_id": drug.id}).fetchall()

                if not batches:
                    results.append(f"❌ No stock available for **{drug.brand_name}**")
                    continue

                remaining = qty_to_remove
                removed = 0

                for batch in batches:
                    if remaining <= 0:
                        break

                    if batch.quantity >= remaining:
                        # Partial removal from this batch
                        update_sql = text(
                            """
                            UPDATE inventory_batches
                            SET quantity = quantity - :qty, updated_at = NOW()
                            WHERE id = :id
                        """
                        )
                        conn.execute(update_sql, {"qty": remaining, "id": batch.id})
                        removed += remaining
                        remaining = 0
                    else:
                        # Remove entire batch quantity
                        update_sql = text(
                            """
                            UPDATE inventory_batches
                            SET quantity = 0, updated_at = NOW()
                            WHERE id = :id
                        """
                        )
                        conn.execute(update_sql, {"id": batch.id})
                        removed += batch.quantity
                        remaining -= batch.quantity

                if remaining > 0:
                    results.append(
                        f"⚠️ Removed **{removed}** of **{drug.brand_name}** (requested {qty_to_remove}, only {removed} available)"
                    )
                else:
                    results.append(f"✅ Removed **{removed}** units of **{drug.brand_name}**")

            conn.commit()

        return "## 🗑️ Stock Removal Complete\n\n" + "\n".join(results)

    except Exception as e:
        return f"❌ Error removing stock: {str(e)}"


@tool
def get_sales_analytics(period: str = "today") -> str:
    """
    Gets sales analytics for a given period.
    Use when user asks about 'sales', 'revenue', 'today's sales', 'this week', etc.
    Input: 'today', 'week', 'month', or 'all'
    """
    engine = get_db_engine()

    period_map = {
        "today": "CURRENT_DATE",
        "week": "CURRENT_DATE - INTERVAL '7 days'",
        "month": "CURRENT_DATE - INTERVAL '30 days'",
        "all": "DATE '2020-01-01'",
    }

    date_filter = period_map.get(period.lower(), period_map["today"])

    try:
        with engine.connect() as conn:
            # Total sales
            sales_sql = text(
                f"""
                SELECT
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(AVG(total_amount), 0) as avg_transaction
                FROM sales
                WHERE sale_date >= {date_filter}
                    AND status = 'COMPLETED'
            """
            )
            sales = conn.execute(sales_sql).fetchone()

            # Top selling drugs
            top_drugs_sql = text(
                f"""
                SELECT
                    d.brand_name,
                    SUM(si.quantity) as units_sold,
                    SUM(si.subtotal) as revenue
                FROM sale_items si
                JOIN drugs d ON si.drug_id = d.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.sale_date >= {date_filter}
                    AND s.status = 'COMPLETED'
                GROUP BY d.id, d.brand_name
                ORDER BY units_sold DESC
                LIMIT 5
            """
            )
            top_drugs = conn.execute(top_drugs_sql).fetchall()

            # Payment method breakdown
            payment_sql = text(
                f"""
                SELECT
                    payment_method,
                    COUNT(*) as count,
                    SUM(total_amount) as total
                FROM sales
                WHERE sale_date >= {date_filter}
                    AND status = 'COMPLETED'
                GROUP BY payment_method
                ORDER BY total DESC
            """
            )
            payments = conn.execute(payment_sql).fetchall()

            response = f"## 📈 Sales Analytics ({period.title()})\n\n"
            response += "### Overview\n"
            response += f"- **Total Transactions:** {sales.total_transactions}\n"
            response += f"- **Total Revenue:** ₹{float(sales.total_revenue):,.2f}\n"
            response += f"- **Average Transaction:** ₹{float(sales.avg_transaction):,.2f}\n\n"

            if top_drugs:
                response += "### 🏆 Top Selling Drugs\n\n"
                response += "| Drug | Units Sold | Revenue |\n"
                response += "|------|------------|--------|\n"
                for drug in top_drugs:
                    response += (
                        f"| {drug.brand_name} | {drug.units_sold} | ₹{float(drug.revenue):,.2f} |\n"
                    )
                response += "\n"

            if payments:
                response += "### 💳 Payment Methods\n\n"
                for pay in payments:
                    response += f"- **{pay.payment_method}:** {pay.count} transactions (₹{float(pay.total):,.2f})\n"

            return response

    except Exception as e:
        return f"❌ Error getting analytics: {str(e)}"
