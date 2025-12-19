"""
PharmaCare AI Services - FastAPI Backend
Includes: Text-to-SQL Chatbot + Intelligent Agent
For ZENITH'25 Hackathon
"""

# Suppress langgraph deprecation warnings
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import re
import os
import io
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
import pandas as pd

# Load environment variables
load_dotenv()

# Configure OpenRouter
os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
DATABASE_URL = os.getenv("DATABASE_URL")

# Import Agent Tools
from agent_tools import (
    check_low_stock,
    check_expiring_stock,
    get_inventory_summary,
    place_order,
    add_stock_to_inventory,
    remove_stock_from_inventory,
    get_sales_analytics
)

# Import Refined Agent Tools
from agent_tools_agent import (
    check_low_stock as check_low_stock_v2,
    check_expiring_stock as check_expiring_stock_v2,
    get_inventory_summary as get_inventory_summary_v2,
    place_order as place_order_v2,
    add_stock_to_inventory as add_stock_to_inventory_v2,
    remove_stock_from_inventory as remove_stock_from_inventory_v2,
    get_sales_analytics as get_sales_analytics_v2,
    forecast_demand,
    get_full_inventory
)

# ==================== APP SETUP ====================

app = FastAPI(
    title="PharmaCare AI Services",
    description="Text-to-SQL Chatbot + Intelligent Agent API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATABASE ====================

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
            "keepalives_count": 5
        }
    )

# ==================== LLM SETUP ====================

llm = ChatOpenAI(
    model="gpt-oss-120b:free",
    temperature=0,
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "PharmaCare AI"
    }
)

llm_creative = ChatOpenAI(
    model="gpt-oss-120b:free",
    temperature=0.7,
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "PharmaCare AI"
    }
)

# ==================== CHATBOT (Text-to-SQL) ====================

DB_SCHEMA = """
PostgreSQL pharmacy database tables:

1. drugs - id, brand_name, generic_name, category, manufacturer, requires_prescription, reorder_level, sku
2. inventory_batches - id, drug_id, batch_number, quantity, purchase_price, sell_price, expiry_date, supplier_id, location
3. suppliers - id, supplier_name, contact_number, email, address
4. sales - id, user_id, total_amount, payment_method (CASH/CARD/UPI/CREDIT), sale_date, status (COMPLETED/PENDING/CANCELLED)
5. sale_items - id, sale_id, drug_id, batch_id, quantity, unit_price, subtotal
6. users - id, username, email, role (ADMIN/PHARMACIST/CASHIER)
7. customers - id, name, phone, email, address
8. stock_alerts - id, drug_id, alert_type, message, is_read

Key relationships: inventory_batches.drug_id->drugs.id, inventory_batches.supplier_id->suppliers.id, sale_items.sale_id->sales.id
"""

CLASSIFICATION_PROMPT = """Classify the question as DATABASE (needs data query) or GENERAL (greeting/help/general knowledge).
Respond with only: DATABASE or GENERAL"""

SQL_SYSTEM_PROMPT = f"""Convert questions to PostgreSQL SELECT queries.
{DB_SCHEMA}
Rules: Use table aliases, CURRENT_DATE for dates, limit to 20 rows, wrap in ```sql``` blocks."""

RESPONSE_SYSTEM_PROMPT = """Summarize query results professionally with key findings and recommendations. Use markdown formatting."""

GENERAL_SYSTEM_PROMPT = """You are PharmaCare Assistant. Help with inventory, sales, expiry tracking. Be concise and friendly."""

# Chatbot chains
classification_chain = ChatPromptTemplate.from_messages([
    ("system", CLASSIFICATION_PROMPT), ("human", "{input}")
]) | llm

sql_chain = ChatPromptTemplate.from_messages([
    ("system", SQL_SYSTEM_PROMPT), MessagesPlaceholder(variable_name="chat_history"), ("human", "{input}")
]) | llm

response_chain = ChatPromptTemplate.from_messages([
    ("system", RESPONSE_SYSTEM_PROMPT),
    ("human", "Question: {question}\nSQL: {sql}\nResults: {results}\nSummarize:")
]) | llm

general_chain = ChatPromptTemplate.from_messages([
    ("system", GENERAL_SYSTEM_PROMPT), MessagesPlaceholder(variable_name="chat_history"), ("human", "{input}")
]) | llm_creative

# ==================== AGENT SETUP ====================

AGENT_SYSTEM_PROMPT = """You are the PharmaCare Inventory Manager - an intelligent agent that helps manage pharmacy operations.

You have access to these tools:
- check_low_stock: Find items below reorder level
- check_expiring_stock: Find items expiring soon (input: days, e.g., "30")
- get_inventory_summary: Get overall inventory statistics
- place_order: Create purchase order with price comparison
- add_stock_to_inventory: Add stock after payment confirmation
- remove_stock_from_inventory: Remove stock (FIFO method)
- get_sales_analytics: Get sales data (input: today/week/month/all)

IMPORTANT:
- When showing tool results, display the FULL output including tables and lists
- For reorder/low stock questions, use check_low_stock
- For expiry questions, use check_expiring_stock
- For ordering, use place_order then add_stock_to_inventory after confirmation
- Be proactive and suggest actions based on the data

Commands:
- /reorder or /lowstock - Check low stock items
- /expiry - Check expiring items
- /summary - Inventory overview
- /sales - Today's sales analytics
- /help - Show available commands"""

# Agent tools list
agent_tools = [
    check_low_stock,
    check_expiring_stock,
    get_inventory_summary,
    place_order,
    add_stock_to_inventory,
    remove_stock_from_inventory,
    get_sales_analytics
]

# Create agent using langgraph
agent_executor = create_react_agent(llm, agent_tools, prompt=AGENT_SYSTEM_PROMPT)

# ==================== REFINED AGENT SETUP ====================

AGENT_SYSTEM_PROMPT_V2 = """You are the PharmaCare Inventory Manager - an intelligent agent that helps manage pharmacy operations.

You have access to these tools:
- check_low_stock: Find items below reorder level
- check_expiring_stock: Find items expiring soon (input: days, e.g., 30)
- get_inventory_summary: Get overall inventory statistics
- place_order: Create purchase order comparison (input: list of items)
- add_stock_to_inventory: Add stock. REQUIRES: drug_name, quantity, purchase_price, expiry_date (YYYY-MM-DD).
- remove_stock_from_inventory: Remove stock (FIFO method)
- get_sales_analytics: Get sales data (input: today/week/month/all)
- forecast_demand: Predict future medicine requirements based on season and college context

IMPORTANT GUIDELINES:
1. **Adding Stock**: You MUST ask the user for the `expiry_date` and `purchase_price` if they are not provided. Do NOT guess these values.
2. **Ordering**: Use `place_order` to compare prices. When the user confirms an order, ask for the specific details needed for `add_stock_to_inventory` before adding it.
3. **Formatting**: Return tables and lists in Markdown.
4. **Proactive**: Suggest actions (e.g., "Should I place an order for these low stock items?").

Commands:
- /reorder or /lowstock - Check low stock items
- /expiry - Check expiring items
- /summary - Inventory overview
- /sales - Today's sales analytics
- /forecast - Predict future demand based on season and college events
- /get_inventory - Show detailed inventory list
- /help - Show available commands"""

agent_tools_v2 = [
    check_low_stock_v2,
    check_expiring_stock_v2,
    get_inventory_summary_v2,
    place_order_v2,
    add_stock_to_inventory_v2,
    remove_stock_from_inventory_v2,
    get_sales_analytics_v2,
    forecast_demand,
    get_full_inventory
]

agent_executor_v2 = create_react_agent(llm, agent_tools_v2, prompt=AGENT_SYSTEM_PROMPT_V2)

# ==================== PYDANTIC MODELS ====================

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    sql: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    query_type: str = "general"

class AgentResponse(BaseModel):
    response: str
    tools_used: Optional[List[str]] = None

class HealthResponse(BaseModel):
    status: str
    database: str
    model: str

# ==================== HELPER FUNCTIONS ====================

def extract_sql(text: str) -> Optional[str]:
    """Extract SQL from LLM response"""
    patterns = [
        r'```sql\s*(.*?)\s*```',
        r'```\s*(SELECT.*?)\s*```',
        r'(SELECT\s+.*?;)'
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def execute_query(sql: str, max_retries: int = 2):
    """Execute SQL with retry"""
    for _ in range(max_retries):
        try:
            engine = get_db_engine()
            with engine.connect() as conn:
                result = conn.execute(text(sql))
                df = pd.DataFrame(result.fetchall(), columns=result.keys())
                return df, None
        except Exception as e:
            if "SSL" in str(e) or "connection" in str(e).lower():
                continue
            return None, str(e)
    return None, "Connection failed"

def convert_history(history: List[ChatMessage]):
    """Convert to LangChain format"""
    return [
        HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
        for m in history
    ]

def classify_question(question: str) -> str:
    """Classify question type"""
    try:
        result = classification_chain.invoke({"input": question})
        return "database" if "DATABASE" in result.content.upper() else "general"
    except:
        return "database"

# ==================== CHATBOT ENDPOINTS ====================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check"""
    db_status = "connected"
    try:
        engine = get_db_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except:
        db_status = "disconnected"
    return HealthResponse(status="ok", database=db_status, model="gpt-oss-120b:free")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Text-to-SQL Chatbot endpoint"""
    try:
        history = convert_history(request.history[-20:])
        query_type = classify_question(request.message)

        if query_type == "general":
            response = general_chain.invoke({"chat_history": history, "input": request.message})
            return ChatResponse(response=response.content, query_type="general")

        sql_response = sql_chain.invoke({"chat_history": history, "input": request.message})
        sql_query = extract_sql(sql_response.content)

        if not sql_query:
            response = general_chain.invoke({"chat_history": history, "input": request.message})
            return ChatResponse(response=response.content, query_type="general")

        df, error = execute_query(sql_query)
        if error:
            return ChatResponse(
                response="Database query failed. Please try rephrasing.",
                sql=sql_query, query_type="database"
            )

        results_str = df.to_string() if not df.empty else "No results"
        final = response_chain.invoke({"question": request.message, "sql": sql_query, "results": results_str})

        return ChatResponse(
            response=final.content,
            sql=sql_query,
            data=df.to_dict(orient='records') if not df.empty else [],
            columns=list(df.columns) if not df.empty else [],
            query_type="database"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AGENT ENDPOINTS ====================

@app.post("/agent/chat", response_model=AgentResponse)
async def agent_chat(request: ChatRequest):
    """Intelligent Agent endpoint"""
    try:
        user_input = request.message.strip()

        # Handle slash commands
        commands = {
            "/help": "## 🤖 Available Commands\n\n- `/reorder` - Check low stock items\n- `/expiry` - Check expiring items (30 days)\n- `/summary` - Inventory overview\n- `/sales` - Today's sales\n\nOr just ask naturally: 'What's running low?' or 'Order 50 Paracetamol'",
            "/reorder": "Check for low stock items that need reordering",
            "/lowstock": "Check for low stock items that need reordering",
            "/expiry": "Check for items expiring in the next 30 days",
            "/summary": "Show inventory summary and overview",
            "/sales": "Show today's sales analytics"
        }

        if user_input.lower() in commands:
            if user_input.lower() == "/help":
                return AgentResponse(response=commands["/help"], tools_used=[])
            user_input = commands[user_input.lower()]

        # Build messages for langgraph agent
        history = convert_history(request.history[-20:])
        messages = history + [HumanMessage(content=user_input)]

        # Invoke agent
        result = agent_executor.invoke({"messages": messages})

        # Extract response and tools used
        tools_used = []
        tool_outputs = []
        ai_response = ""

        for msg in result["messages"]:
            # Check for tool calls
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    tools_used.append(tc.get('name', 'unknown'))
            
            # Get tool outputs
            if hasattr(msg, 'content') and msg.type == "tool":
                if isinstance(msg.content, str) and len(msg.content) > 50:
                    tool_outputs.append(msg.content)

            # Get final AI response
            if hasattr(msg, 'content') and msg.content and msg.type == "ai":
                # Skip if it's just a tool call message
                if not (hasattr(msg, 'tool_calls') and msg.tool_calls):
                    ai_response = msg.content

        final_output = ai_response
        if tool_outputs:
            combined_tools = "\n\n---\n\n".join(tool_outputs)
            if combined_tools[:50] not in ai_response:
                final_output = combined_tools + "\n\n" + ai_response

        if not final_output:
            # Fallback - get last message content
            final_output = result["messages"][-1].content if result["messages"] else "I couldn't process that request."

        print(f"[{datetime.now().isoformat()}] AGENT RESPONSE: {final_output}")

        return AgentResponse(response=final_output, tools_used=list(set(tools_used)))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/refined-chat", response_model=AgentResponse)
async def agent_chat_refined(request: ChatRequest):
    """Refined Intelligent Agent endpoint using new tools"""
    try:
        user_input = request.message.strip()

        # Handle slash commands
        commands = {
            "/help": "## 🤖 Available Commands\n\n- `/reorder` - Check low stock items\n- `/expiry` - Check expiring items (30 days)\n- `/summary` - Inventory overview\n- `/sales` - Today's sales\n\nOr just ask naturally: 'What's running low?' or 'Order 50 Paracetamol'",
            "/reorder": "Check for low stock items that need reordering",
            "/lowstock": "Check for low stock items that need reordering",
            "/expiry": "Check for items expiring in the next 30 days",
            "/summary": "Show inventory summary and overview",
            "/sales": "Show today's sales analytics",
            "/forecast": "Predict future medicine demand based on season and college events",
            "/get_inventory": "Show detailed list of all inventory items"
        }

        if user_input.lower() in commands:
            if user_input.lower() == "/help":
                return AgentResponse(response=commands["/help"], tools_used=[])
            user_input = commands[user_input.lower()]

        # Build messages for langgraph agent
        history = convert_history(request.history[-20:])
        messages = history + [HumanMessage(content=user_input)]

        # Invoke refined agent
        result = agent_executor_v2.invoke({"messages": messages})

        # Extract response and tools used
        tools_used = []
        tool_outputs = []
        ai_response = ""

        for msg in result["messages"]:
            # Check for tool calls
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    tools_used.append(tc.get('name', 'unknown'))
            
            # Get tool outputs
            if hasattr(msg, 'content') and msg.type == "tool":
                if isinstance(msg.content, str) and len(msg.content) > 50:
                    tool_outputs.append(msg.content)

            # Get final AI response
            if hasattr(msg, 'content') and msg.content and msg.type == "ai":
                # Skip if it's just a tool call message
                if not (hasattr(msg, 'tool_calls') and msg.tool_calls):
                    ai_response = msg.content

        final_output = ai_response
        if tool_outputs:
            combined_tools = "\n\n---\n\n".join(tool_outputs)
            if combined_tools[:50] not in ai_response:
                final_output = combined_tools + "\n\n" + ai_response

        if not final_output:
            # Fallback - get last message content
            final_output = result["messages"][-1].content if result["messages"] else "I couldn't process that request."

        print(f"[{datetime.now().isoformat()}] REFINED AGENT RESPONSE: {final_output}")

        return AgentResponse(response=final_output, tools_used=list(set(tools_used)))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/upload-inventory")
async def upload_inventory(file: UploadFile = File(...)):
    """Upload inventory via Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Please upload an Excel file (.xlsx or .xls)")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Normalize column names
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Check required columns
    required = ['brand_name', 'quantity']
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing}. Required: brand_name, quantity. Optional: batch_number, expiry_date, location, purchase_price, sell_price"
        )

    engine = get_db_engine()
    results = {"added": 0, "updated": 0, "errors": []}

    try:
        with engine.connect() as conn:
            # Get default supplier
            supplier = conn.execute(text("SELECT id FROM suppliers LIMIT 1")).fetchone()
            if not supplier:
                raise HTTPException(status_code=400, detail="No suppliers in database. Add a supplier first.")
            supplier_id = supplier.id

            for idx, row in df.iterrows():
                try:
                    brand_name = str(row['brand_name']).strip()
                    quantity = int(row['quantity'])

                    # Find drug
                    drug = conn.execute(
                        text("SELECT id, brand_name FROM drugs WHERE LOWER(brand_name) LIKE LOWER(:name) LIMIT 1"),
                        {"name": f"%{brand_name}%"}
                    ).fetchone()

                    if not drug:
                        results["errors"].append(f"Row {idx+2}: Drug '{brand_name}' not found")
                        continue

                    # Generate batch details
                    batch_id = str(uuid.uuid4())[:24]
                    batch_number = row.get('batch_number', f"UPLOAD-{datetime.now().strftime('%Y%m%d')}-{idx+1}")

                    # Handle expiry date
                    expiry = row.get('expiry_date')
                    if pd.isna(expiry):
                        expiry_date = datetime.now() + timedelta(days=365)
                    else:
                        expiry_date = pd.to_datetime(expiry)

                    # Prices
                    purchase_price = float(row.get('purchase_price', 50.0))
                    sell_price = float(row.get('sell_price', purchase_price * 1.3))
                    location = row.get('location', 'Main Storage')

                    # Insert batch
                    conn.execute(text("""
                        INSERT INTO inventory_batches
                        (id, drug_id, batch_number, quantity, purchase_price, sell_price, expiry_date, supplier_id, location, date_added, created_at, updated_at)
                        VALUES (:id, :drug_id, :batch_number, :quantity, :purchase_price, :sell_price, :expiry_date, :supplier_id, :location, NOW(), NOW(), NOW())
                    """), {
                        "id": batch_id,
                        "drug_id": drug.id,
                        "batch_number": str(batch_number),
                        "quantity": quantity,
                        "purchase_price": purchase_price,
                        "sell_price": sell_price,
                        "expiry_date": expiry_date,
                        "supplier_id": supplier_id,
                        "location": str(location) if not pd.isna(location) else "Main Storage"
                    })

                    results["added"] += 1

                except Exception as e:
                    results["errors"].append(f"Row {idx+2}: {str(e)}")

            conn.commit()

        return {
            "status": "success",
            "message": f"Processed {results['added']} items",
            "added": results["added"],
            "errors": results["errors"][:10]  # Limit errors shown
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/inventory")
async def get_inventory():
    """Get current inventory"""
    engine = get_db_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT
                    d.brand_name, d.generic_name, d.category,
                    ib.batch_number, ib.quantity, ib.sell_price,
                    ib.expiry_date, ib.location
                FROM inventory_batches ib
                JOIN drugs d ON ib.drug_id = d.id
                WHERE ib.quantity > 0
                ORDER BY d.brand_name, ib.expiry_date
                LIMIT 100
            """))
            rows = result.fetchall()

            inventory = [{
                "brand_name": r.brand_name,
                "generic_name": r.generic_name,
                "category": r.category,
                "batch_number": r.batch_number,
                "quantity": r.quantity,
                "sell_price": float(r.sell_price),
                "expiry_date": r.expiry_date.isoformat() if r.expiry_date else None,
                "location": r.location
            } for r in rows]

            return {"inventory": inventory, "count": len(inventory)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/health")
async def agent_health():
    """Agent service health check"""
    db_status = "connected"
    try:
        engine = get_db_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except:
        db_status = "disconnected"
    return {"status": "ok", "database": db_status, "agent": "ready"}

@app.post("/clear")
async def clear_history():
    """Clear chat history"""
    return {"status": "ok"}

# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
