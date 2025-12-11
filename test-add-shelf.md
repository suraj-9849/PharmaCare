# Test Add Shelf Feature

## Quick Test Using Browser Console

1. Open http://localhost:3000/dashboard/smart-shelf
2. Press F12 (DevTools)
3. Go to **Console** tab
4. Paste this code and press Enter:

```javascript
// Get your token from localStorage
const token = localStorage.getItem('auth_token');

// Test data
const shelfData = {
  shelfCode: "TEST-A1",
  shelfName: "Test Shelf Alpha",
  row: "1",
  column: "A",
  zone: "General",
  capacity: 50,
  qrCode: "QR-TEST-A1",
  notes: "Test shelf created from console"
};

// Make the API call
fetch('http://localhost:5000/api/smart-shelf', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(shelfData)
})
.then(res => res.json())
.then(data => {
  console.log('Response:', data);
  if (data.success) {
    console.log('✅ Shelf created successfully!', data.data);
  } else {
    console.error('❌ Error:', data.message);
  }
})
.catch(err => console.error('❌ Network error:', err));
```

## What to Look For:

### ✅ **Success Response:**
```json
{
  "success": true,
  "message": "Shelf created successfully",
  "data": {
    "id": "cm4ex...",
    "shelfCode": "TEST-A1",
    "shelfName": "Test Shelf Alpha",
    ...
  }
}
```

### ❌ **Common Errors:**

#### 1. Duplicate Shelf Code
```json
{
  "success": false,
  "message": "Unique constraint failed on the fields: (`shelf_code`)"
}
```
**Solution:** Change shelfCode to something unique like "TEST-B2"

#### 2. Unauthorized (401)
```json
{
  "message": "Unauthorized"
}
```
**Solution:** Login again to get fresh JWT token

#### 3. Missing Required Fields
```json
{
  "success": false,
  "message": "..."
}
```
**Solution:** Ensure shelfCode and shelfName are provided

## Check Backend Logs

In your terminal where `pnpm dev` is running, you should see:
```
POST /api/smart-shelf 201 - - ms
```

If you see errors, they will appear there.

## Alternative Test - Using cURL

```bash
# Replace YOUR_TOKEN with your actual JWT token from localStorage
curl -X POST http://localhost:5000/api/smart-shelf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shelfCode": "CURL-TEST-1",
    "shelfName": "cURL Test Shelf",
    "zone": "General",
    "capacity": 50
  }'
```

## Debug the UI Form

If the console test works but the UI form doesn't:

1. Open DevTools > Console
2. Click "Add Shelf" button
3. Fill in the form
4. **Before clicking "Create Shelf"**, check the console for the logged data:
   ```
   Creating shelf with data: { shelfCode: "...", ... }
   ```
5. Click "Create Shelf"
6. Check for any error messages

## Common UI Issues:

### Issue: "Failed to create shelf" generic message
**Cause:** JavaScript error in form submission
**Check:** Browser console for red error messages

### Issue: Network error
**Cause:** Backend not running or CORS issue
**Check:**
- Is `pnpm dev` running in ph_backend?
- Backend should be at http://localhost:5000

### Issue: Nothing happens when clicking button
**Cause:** Form validation failing
**Check:** Ensure Shelf Code and Shelf Name are filled (required fields)

---

Run the browser console test first - it will tell us exactly what the backend is responding with!
