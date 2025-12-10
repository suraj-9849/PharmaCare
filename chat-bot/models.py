from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, Date, DateTime
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Drug(Base):
    __tablename__ = 'drugs'
    
    drug_id = Column(Integer, primary_key=True, autoincrement=True)
    brand_name = Column(String, nullable=False)
    generic_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    manufacturer = Column(String)
    requires_prescription = Column(Boolean, default=False)
    reorder_level = Column(Integer, default=10)
    sku = Column(String, unique=True)
    
    # Relationships
    batches = relationship("InventoryBatch", back_populates="drug")

class Supplier(Base):
    __tablename__ = 'suppliers'
    
    supplier_id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_name = Column(String, nullable=False)
    contact_number = Column(String)
    email = Column(String)
    address = Column(String)
    
    # Relationships
    batches = relationship("InventoryBatch", back_populates="supplier")

class InventoryBatch(Base):
    __tablename__ = 'inventory_batches'
    
    batch_id = Column(String, primary_key=True) # Using String as per seed data "B001"
    drug_id = Column(Integer, ForeignKey('drugs.drug_id'))
    batch_number = Column(String)
    quantity = Column(Integer, default=0)
    purchase_price = Column(Float)
    sell_price = Column(Float)
    expiry_date = Column(Date)
    supplier_id = Column(Integer, ForeignKey('suppliers.supplier_id'))
    location = Column(String)
    
    # Relationships
    drug = relationship("Drug", back_populates="batches")
    supplier = relationship("Supplier", back_populates="batches")
    sale_items = relationship("SaleItem", back_populates="batch")

class Sale(Base):
    __tablename__ = 'sales'
    
    sale_id = Column(Integer, primary_key=True, autoincrement=True)
    sale_date = Column(DateTime, default=datetime.now)
    total_amount = Column(Float, default=0.0)
    
    # Relationships
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = 'sale_items'
    
    item_id = Column(Integer, primary_key=True, autoincrement=True)
    sale_id = Column(Integer, ForeignKey('sales.sale_id'))
    batch_id = Column(String, ForeignKey('inventory_batches.batch_id'))
    quantity_sold = Column(Integer)
    price_per_unit = Column(Float)
    total_price = Column(Float)
    
    # Relationships
    sale = relationship("Sale", back_populates="items")
    batch = relationship("InventoryBatch", back_populates="sale_items")

class HistoricalSale(Base):
    __tablename__ = 'historical_sales'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sale_id = Column(Integer) # From JSON
    date = Column(Date)
    season = Column(String)
    category_sold = Column(String)
    quantity_sold = Column(Integer)
    weather_condition = Column(String)

# Database Setup
DATABASE_URL = "sqlite:///./pharmacy.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def init_db():
    Base.metadata.create_all(bind=engine)
