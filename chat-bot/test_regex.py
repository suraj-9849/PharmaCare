import re

def test_parsing(text):
    pattern = r'(\d+)\s+(?:units|strips|boxes|bottles|packs)?\s*(?:of)?\s*([a-zA-Z0-9\s\(\)\-]+?)(?:,|$|\s+and\s+)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    print(f"Input: {text}")
    for qty, name in matches:
        print(f"  - Qty: {qty}, Name: '{name.strip()}'")

test_parsing("Confirmed payment for 100 Electral Powder (ORS), 100 Saridon, and 20 Volini Spray")
test_parsing("Confirmed 50 Dolo")
test_parsing("10 strips of Dolo and 5 bottles of Cough Syrup")
