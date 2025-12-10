from langchain.tools import tool
from sqlalchemy.orm import Session
from models import engine, Drug, InventoryBatch, HistoricalSale
from sqlalchemy import func
import datetime
import random
import re
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import numpy as np

# Database Helper
def get_db():
    return Session(engine)

@tool
def check_low_stock(query: str = "") -> str:
    """
    Checks for drugs that are below their reorder level.
    Useful when the user asks to 'reorder' or check 'low stock'.
    """
    session = get_db()
    try:
        # Find drugs where total quantity < reorder_level
        low_stock_items = []
        drugs = session.query(Drug).all()
        
        for drug in drugs:
            total_quantity = session.query(func.sum(InventoryBatch.quantity))\
                .filter(InventoryBatch.drug_id == drug.drug_id).scalar() or 0
            
            if total_quantity < drug.reorder_level:
                low_stock_items.append({
                    "name": drug.brand_name,
                    "current": total_quantity,
                    "reorder_level": drug.reorder_level,
                    "generic": drug.generic_name
                })
        
        if not low_stock_items:
            return "Stock levels are healthy. No items need reordering."
            
        response = "⚠️ Low Stock Alert:\n"
        for item in low_stock_items:
            # Mock Price Search
            prices = mock_price_search(item['generic'])
            best_price = min(prices, key=lambda x: x['price'])
            
            response += f"- {item['name']} (Current: {item['current']}, Reorder Level: {item['reorder_level']})\n"
            response += f"  Found best prices for {item['generic']}:\n"
            for p in prices:
                response += f"  - {p['source']}: ₹{p['price']}\n"
            response += f"  Recommendation: Buy from {best_price['source']} at ₹{best_price['price']}.\n"
            
        return response
    finally:
        session.close()

def mock_price_search(drug_name: str):
    """Simulates searching for drug prices online."""
    sources = ["1mg", "Apollo", "Pharmeasy"]
    base_price = random.uniform(10, 100)
    results = []
    for source in sources:
        price = round(base_price * random.uniform(0.9, 1.1), 2)
        results.append({"source": source, "price": price})
    return results

@tool
def forecast_demand(query: str = "") -> str:
    """
    Uses a Random Forest Machine Learning model to predict future demand based on historical sales data.
    """
    session = get_db()
    try:
        # 1. Fetch Historical Data
        query = session.query(HistoricalSale)
        df = pd.read_sql(query.statement, session.bind)
        
        if df.empty:
            return "⚠️ No historical data found. Please run 'python seed.py' to generate training data."

        # 2. Feature Engineering
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['day_of_year'] = df['date'].dt.dayofyear
        
        # Encode Categories (Text -> Numbers)
        le = LabelEncoder()
        df['category_encoded'] = le.fit_transform(df['category_sold'])
        
        # 3. Train Random Forest Model
        # Features: Month, Category
        # Target: Quantity Sold
        X = df[['month', 'category_encoded']]
        y = df['quantity_sold']
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # 4. Predict for Next Month
        next_month = (datetime.datetime.now().month % 12) + 1
        next_month_name = datetime.date(1900, next_month, 1).strftime('%B')
        
        response = f"### 🧠 AI Demand Forecast (Random Forest Model)\n"
        response += f"**Prediction Target:** {next_month_name} (Month {next_month})\n\n"
        
        categories = df['category_sold'].unique()
        recommendations = []
        
        for category in categories:
            cat_code = le.transform([category])[0]
            # Predict average daily demand for next month
            predicted_daily_demand = model.predict([[next_month, cat_code]])[0]
            monthly_forecast = int(predicted_daily_demand * 30) # Scale to 30 days
            
            # Dynamic Thresholding
            if monthly_forecast > 300:
                trend = "🔥 High Demand"
            elif monthly_forecast > 150:
                trend = "📈 Moderate Demand"
            else:
                trend = "📉 Low Demand"

            recommendations.append({
                "category": category,
                "forecast": monthly_forecast,
                "trend": trend
            })

        # Sort by highest forecast
        recommendations.sort(key=lambda x: x['forecast'], reverse=True)
        
        response += "| Category | Predicted Monthly Sales | Trend |\n"
        response += "| :--- | :--- | :--- |\n"
        for rec in recommendations:
            response += f"| {rec['category']} | **{rec['forecast']} units** | {rec['trend']} |\n"
            
        response += "\n**💡 AI Insights:**\n"
        if recommendations:
            top_cat = recommendations[0]['category']
            response += f"- The model predicts a surge in **{top_cat}** next month.\n"
            response += "- **Recommendation:** Increase stock levels for this category immediately.\n"

        return response
    except Exception as e:
        return f"Error in forecasting: {str(e)}"
    finally:
        session.close()

def parse_items(text: str):
    """Helper to parse quantity and drug name from text."""
    pattern = r'(\d+)\s+(?:units|strips|boxes|bottles|packs)?\s*(?:of)?\s*([a-zA-Z0-9\s\(\)\-]+?)(?:,|$|\s+and\s+)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    parsed = []
    for qty_str, drug_raw in matches:
        quantity = int(qty_str)
        drug_name = drug_raw.strip()
        if drug_name.lower() not in ["confirmed", "payment", "for", "order", "of"]:
            parsed.append((quantity, drug_name))
    return parsed

@tool
def place_order(order_details: str) -> str:
    """
    Initiates an order for specific drugs.
    Input should be something like '10 strips of Dolo and 5 Azithromycin'.
    """
    items = parse_items(order_details)
    
    if not items:
        # Fallback for simple single item queries without quantity
        return f"Please specify the quantity for your order (e.g., 'Order 10 Dolo')."

    response = f"### 🛒 Cart Summary\n\n"
    response += "| Item | Quantity | 1mg Price | Pharmeasy Price | Apollo Price |\n"
    response += "|---|---|---|---|---|\n"

    totals = {"1mg": 0, "Pharmeasy": 0, "Apollo": 0}
    
    for qty, drug_name in items:
        prices = mock_price_search(drug_name)
        # Convert list to dict for easy lookup
        price_map = {p['source']: p['price'] for p in prices}
        
        row = f"| {drug_name} | {qty} |"
        for source in ["1mg", "Pharmeasy", "Apollo"]:
            unit_price = price_map.get(source, 0)
            total_item_price = unit_price * qty
            totals[source] += total_item_price
            row += f" ₹{total_item_price:.2f} |"
        response += row + "\n"

    response += "\n**💰 Total Cart Value:**\n"
    for source, total in totals.items():
        response += f"- **{source}:** ₹{total:.2f}\n"

    best_source = min(totals, key=totals.get)
    response += f"\n🏆 **Best Deal:** {best_source} at ₹{totals[best_source]:.2f}\n\n"

    response += "### 🛍️ Checkout Links\n"
    response += "Click the buttons below to view items on your preferred store:\n\n"
    
    # Generate "Button-like" links
    for source in ["1mg", "Pharmeasy", "Apollo"]:
        response += f"**{source} Cart (Total: ₹{totals[source]:.2f})**\n"
        for qty, drug_name in items:
            # Search link for each item
            if source == "1mg":
                link = f"https://www.1mg.com/search/all?name={drug_name.replace(' ', '%20')}"
            elif source == "Pharmeasy":
                link = f"https://pharmeasy.in/search/all?name={drug_name.replace(' ', '%20')}"
            else:
                link = f"https://www.apollopharmacy.in/search-medicines/{drug_name.replace(' ', '%20')}"
            
            response += f"- [Buy {qty} {drug_name} on {source}]({link})\n"
        response += "\n"

    response += f"**IMPORTANT:** Once you have purchased the items, please type **'Confirmed payment for {order_details}'** so I can update the inventory."
    return response

@tool
def add_stock_to_inventory(confirmation_details: str) -> str:
    """
    Adds stock to the database AFTER the user confirms payment.
    Input should be the confirmation message containing drug name and quantity.
    Example input: "Confirmed payment for 50 Azithromycin" or "Confirmed 100 Dolo and 50 Saridon"
    """
    session = get_db()
    try:
        matches = parse_items(confirmation_details)
        
        if not matches:
             return "❌ Could not parse any items. Please try again (e.g., 'Confirmed 50 Dolo')."

        results = []
        
        for quantity, drug_name in matches:
            # Find or Create Drug (Exact match first to prevent duplicates)
            drug = session.query(Drug).filter(func.lower(Drug.brand_name) == drug_name.lower()).first()
            
            if not drug:
                # Try fuzzy match if exact match fails
                drug = session.query(Drug).filter(Drug.brand_name.ilike(f"%{drug_name}%")).first()
            if not drug:
                # Create new drug if not exists
                drug = Drug(
                    brand_name=drug_name,
                    generic_name=drug_name, # Fallback
                    category="General",
                    reorder_level=10,
                    sku=f"NEW-{random.randint(1000,9999)}"
                )
                session.add(drug)
                session.flush() # Get ID
            
            # Create Inventory Batch
            new_batch = InventoryBatch(
                batch_id=f"B{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(10,99)}",
                drug_id=drug.drug_id,
                batch_number=f"ORD-{random.randint(10000,99999)}",
                quantity=quantity,
                purchase_price=random.uniform(10, 100), # Mock
                sell_price=random.uniform(120, 200),   # Mock
                expiry_date=datetime.date.today() + datetime.timedelta(days=365),
                supplier_id=101, # Default Supplier
                location="Reception"
            )
            
            session.add(new_batch)
            results.append(f"✅ Added **{quantity}** units of **{drug.brand_name}**")
        
        session.commit()
        
        if not results:
             return "❌ Could not parse any items. Please try again."

        return "🎉 **Inventory Updated Successfully!**\n" + "\n".join(results)
               
    except Exception as e:
        session.rollback()
        return f"❌ Error updating database: {str(e)}"
    finally:
        session.close()

@tool
def remove_stock_from_inventory(removal_details: str) -> str:
    """
    Removes stock from the database.
    Useful when items are sold, expired, or damaged.
    Input should be the details containing drug name and quantity.
    Example input: "Remove 10 Dolo" or "Delete 5 Azithromycin due to expiry"
    """
    session = get_db()
    try:
        matches = parse_items(removal_details)
        
        if not matches:
             return "❌ Could not parse any items to remove. Please try again (e.g., 'Remove 10 Dolo')."

        results = []
        
        for quantity, drug_name in matches:
            # Find Drug
            drug = session.query(Drug).filter(Drug.brand_name.ilike(f"%{drug_name}%")).first()
            
            if not drug:
                results.append(f"❌ Drug **{drug_name}** not found in inventory.")
                continue
            
            # Find Batches with stock, ordered by expiry (remove oldest first)
            batches = session.query(InventoryBatch)\
                .filter(InventoryBatch.drug_id == drug.drug_id, InventoryBatch.quantity > 0)\
                .order_by(InventoryBatch.expiry_date.asc())\
                .all()
            
            if not batches:
                results.append(f"❌ No stock available for **{drug.brand_name}**.")
                continue
            
            remaining_to_remove = quantity
            removed_count = 0
            
            for batch in batches:
                if remaining_to_remove <= 0:
                    break
                
                if batch.quantity >= remaining_to_remove:
                    batch.quantity -= remaining_to_remove
                    removed_count += remaining_to_remove
                    remaining_to_remove = 0
                else:
                    # Consume this batch entirely
                    removed_count += batch.quantity
                    remaining_to_remove -= batch.quantity
                    batch.quantity = 0
            
            if remaining_to_remove > 0:
                results.append(f"⚠️ Removed **{removed_count}** units of **{drug.brand_name}**. (Requested {quantity}, but only {removed_count} were available).")
            else:
                results.append(f"✅ Removed **{quantity}** units of **{drug.brand_name}**.")
        
        session.commit()
        
        if not results:
             return "❌ Could not process removal."

        return "🗑️ **Inventory Updated (Removal):**\n" + "\n".join(results)
               
    except Exception as e:
        session.rollback()
        return f"❌ Error updating database: {str(e)}"
    finally:
        session.close()

