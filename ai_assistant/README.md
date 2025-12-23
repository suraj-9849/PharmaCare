## Setup with uv

1. Create virtual environment:
```bash
cd ai_assistant
python -m venv .venv
source .venv/bin/activate
```

2. Install uv:
```bash
pip install uv
```

3. Install dependencies:
```bash
uv pip install -e .
```

4. For development dependencies:
```bash
uv pip install -e ".[dev]"
```

5. Create .env file:
```bash
cp .env.example .env
# Add your OPENAI_API_KEY and DATABASE_URL
```

6. Run the server:
```bash
uv run uvicorn main:app --reload --port 8000
```

## Available Scripts

```bash
# Start server
uv run uvicorn main:app --reload --port 8000

# Format code
uv run black .

# Lint code
uv run flake8 .

# Type check
uv run mypy .

# Run tests
uv run pytest
``

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_database_url
```
