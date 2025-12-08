import json
import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from models import engine, init_db, Drug, Supplier, InventoryBatch, HistoricalSale

def generate_synthetic_history(session):
    """Generates 365 days of realistic sales data for ML training."""
    print("🤖 Generating synthetic AI training data (365 days)...")
    
    # Clear existing history
    session.query(HistoricalSale).delete()
    
    categories = ["Antibiotic", "Antipyretic", "Antihistamine", "Pain Relief", "Rehydration"]
    start_date = date.today() - timedelta(days=365)
    
    for i in range(365):
        current_date = start_date + timedelta(days=i)
        month = current_date.month
        
        # Determine Season
        if 6 <= month <= 9: season = "Monsoon"
        elif 11 <= month <= 2: season = "Winter"
        else: season = "Summer"
        
        for cat in categories:
            # Base demand
            base_qty = random.randint(5, 20)
            
            # Apply Seasonal Trends (The "Patterns" the AI will learn)
            if season == "Monsoon" and cat == "Antibiotic": base_qty *= random.uniform(2.0, 3.0)
            if season == "Winter" and cat == "Antipyretic": base_qty *= random.uniform(1.5, 2.5)
            if season == "Summer" and cat == "Rehydration": base_qty *= random.uniform(2.5, 4.0)
            if cat == "Pain Relief": base_qty *= 1.2 # Constant demand
            
            # Add Random Noise
            final_qty = int(base_qty * random.uniform(0.8, 1.2))
            
            sale = HistoricalSale(
                date=current_date,
                season=season,
                category_sold=cat,
                quantity_sold=final_qty,
                weather_condition="Rainy" if season == "Monsoon" else "Sunny"
            )
            session.add(sale)
    
    session.commit()
    print("✅ AI Training Data Generated.")

def load_seed_data():
    init_db()
    session = Session(engine)
    
    try:
        with open('seed_data.json', 'r') as f:
            data = json.load(f)
            
        # 1. Load Drugs
        print("Seeding Drugs...")
        for item in data['drugs']:
            drug = Drug(
                drug_id=item['drug_id'],
                brand_name=item['brand_name'],
                generic_name=item['generic_name'],
                category=item['category'],
                manufacturer=item['manufacturer'],
                requires_prescription=item['requires_prescription'],
                reorder_level=item['reorder_level'],
                sku=item['sku']
            )
            session.merge(drug) # merge handles updates if exists
            
        # 2. Load Suppliers
        print("Seeding Suppliers...")
        for item in data['suppliers']:
            supplier = Supplier(
                supplier_id=item['supplier_id'],
                supplier_name=item['supplier_name'],
                contact_number=item['contact_number'],
                email=item['email'],
                address=item['address']
            )
            session.merge(supplier)
            
        # 3. Load Inventory Batches
        print("Seeding Inventory Batches...")
        for item in data['inventory_batches']:
            batch = InventoryBatch(
                batch_id=item['batch_id'],
                drug_id=item['drug_id'],
                batch_number=item['batch_number'],
                quantity=item['quantity'],
                purchase_price=item['purchase_price'],
                sell_price=item['sell_price'],
                expiry_date=datetime.strptime(item['expiry_date'], '%Y-%m-%d').date(),
                supplier_id=item['supplier_id'],
                location=item['location']
            )
            session.merge(batch)

        # 4. Generate ML Data
        generate_synthetic_history(session)
            
        session.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    load_seed_data()
