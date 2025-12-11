# Smart Shelf & FEFO - Complete Testing Guide

## Prerequisites

### 1. Start the Backend
```bash
cd C:\Users\chara\OneDrive\Desktop\MLR\PharmaCare\ph_backend
pnpm dev
```
**Expected Output:**
```
✓ Database connected successfully
PharmaCare API Server
Port: 5000
```

### 2. Start the Frontend
```bash
cd C:\Users\chara\OneDrive\Desktop\MLR\PharmaCare\ph_frontend
npm run dev
```
**Expected Output:**
```
- Local:   http://localhost:3000
```

### 3. Login
- Navigate to: http://localhost:3000/login
- Use your admin credentials
- You should be redirected to `/dashboard`

---

## Testing Workflow

### 📍 **Step 1: Create Shelf Locations**

1. Click **"Smart Shelf & FEFO"** in the sidebar navigation
2. Click the **"Add Shelf"** button (green button, top right)
3. Fill in the form:

**Example Shelf 1:**
- **Shelf Code:** A1
- **Shelf Name:** Main Pharmacy Shelf A
- **Row:** 1
- **Column:** A
- **Capacity:** 50
- **Zone:** General
- **QR Code:** QR-SHELF-A1
- **Notes:** First shelf for testing

4. Click **"Create Shelf"**
5. The shelf should appear in the "Shelf Map" tab

**Create 2-3 more shelves:**
- Shelf Code: B2, Zone: Refrigerated, Capacity: 30
- Shelf Code: C3, Zone: Controlled, Capacity: 100

---

### 📦 **Step 2: Add Batches to Inventory**

You need batches with expiry dates to test the FEFO system. Use the existing **Inventory** page:

1. Navigate to **Dashboard > Inventory**
2. Click **"Add Batch"**
3. Create batches with **different expiry dates**:

**Example Batch 1 (Expiring Soon):**
- Drug: Select any drug
- Batch Number: BATCH-001
- Quantity: 100
- Purchase Price: 50
- Sell Price: 100
- **Expiry Date:** (Set to 15 days from today)
- Supplier: Select any
- Location: Leave empty for now

**Example Batch 2 (Expiring Very Soon):**
- Batch Number: BATCH-002
- **Expiry Date:** (Set to 7 days from today)

**Example Batch 3 (Good Stock):**
- Batch Number: BATCH-003
- **Expiry Date:** (Set to 90 days from today)

Create **5-10 batches** with varying expiry dates (some expiring in 5-30 days, some in 60+ days).

---

### 🔗 **Step 3: Link Batches to Shelves (API)**

Currently, the UI doesn't have a "scan and assign" feature, so we'll use the API directly:

#### Using Postman/Thunder Client/cURL:

**Endpoint:** `POST http://localhost:5000/api/smart-shelf/:shelfId/batch/:batchId`

1. **Get Shelf ID:**
   - Go to Smart Shelf page > Shelf Map tab
   - Open browser DevTools (F12) > Network tab
   - Refresh page
   - Find the request to `/api/smart-shelf`
   - Copy the `id` of shelf "A1"

2. **Get Batch ID:**
   - Go to Inventory page
   - Open DevTools > Network
   - Find the request to `/api/inventory`
   - Copy the `id` of "BATCH-001"

3. **Make API Call:**
```bash
# Replace {shelfId} and {batchId} with actual IDs
curl -X POST http://localhost:5000/api/smart-shelf/{shelfId}/batch/{batchId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**To get your JWT token:**
- Open DevTools > Application > Local Storage > `auth_token`
- Copy the token value

**Example:**
```bash
curl -X POST http://localhost:5000/api/smart-shelf/cm4exa1234/batch/cm4exb5678 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

4. **Assign multiple batches** to different shelves
   - Add BATCH-001, BATCH-002, BATCH-003 to Shelf A1
   - Add other batches to Shelf B2 and C3

---

### 🎯 **Step 4: Test Visual Shelf Map**

1. Navigate to **Smart Shelf & FEFO** page
2. Click **"Shelf Map"** tab
3. **Verify:**
   - ✅ All created shelves are displayed
   - ✅ Utilization percentage is calculated correctly
   - ✅ Color coding works:
     - Green (low utilization)
     - Amber (medium)
     - Red (high - if capacity > 80%)
   - ✅ Current stock shows correct count
   - ✅ Zone is displayed

4. **Click on a shelf card**
   - Should show shelf details (future enhancement)

---

### 🔥 **Step 5: Test FEFO Swipe Interface**

1. Navigate to **"FEFO Swipe"** tab
2. **Verify:**
   - ✅ Batches expiring in 30 days are shown
   - ✅ Sorted by expiry date (oldest first)
   - ✅ Progress indicator shows "Item X of Y"
   - ✅ Batch card displays:
     - Drug name
     - Batch number
     - Quantity
     - Expiry date
     - Location
     - Total value
   - ✅ Color-coded expiry badge:
     - Red "Expired" (if past expiry)
     - Red "Urgent" (< 7 days)
     - Orange "Critical" (7-14 days)
     - Amber (14-30 days)

3. **Test Navigation:**
   - Click **left arrow** → Goes to previous batch
   - Click **right arrow** → Goes to next batch

4. **Test Swipe Actions:**

**Action 1: Return to Vendor (Green Button)**
- Click **"Return to Vendor"**
- Batch should disappear
- Next batch should auto-load
- Check in DevTools > Network > `POST /api/smart-shelf/expiry-action`
- Response should show success

**Action 2: Discount & Push (Amber Button)**
- Click **"Discount & Push"**
- Batch should be marked as discounted
- Advances to next batch

**Action 3: Dispose (Red Button)**
- Click **"Dispose"**
- Batch should be marked for disposal
- Advances to next batch

5. **Complete all batches**
   - After swiping through all, page should show:
     "No Expiring Items" with green checkmark

---

### 🚨 **Step 6: Test FEFO Validation (Incorrect Pick Alert)**

This requires API testing since the scanning feature isn't in the UI yet.

**Scenario:** Pharmacist picks wrong batch (not at front of queue)

1. **Setup:**
   - Ensure Shelf A1 has multiple batches (BATCH-001, BATCH-002, BATCH-003)
   - The batch at position 0 (front) should be BATCH-001

2. **Simulate incorrect pick via API:**

```bash
# Validate picking BATCH-002 (wrong batch)
curl -X POST http://localhost:5000/api/smart-shelf/{shelfId}/validate-pick \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchId": "BATCH-002_ID"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Incorrect pick! Expected batch BATCH-001 (expires Jan 15), but you picked BATCH-002 (expires Jan 10)",
  "data": {
    "isValid": false,
    "expectedBatch": { ... },
    "pickedBatch": { ... },
    "alert": { ... }
  }
}
```

3. **View Alert in UI:**
   - Go to Smart Shelf page
   - Click **"Alerts (1)"** tab
   - Should see alert card with:
     - "Incorrect Pick Detected"
     - Shelf code
     - Timestamp
   - Click **"Review"** button
   - Alert dialog should show violation details
   - Click **"Acknowledge"**
   - Alert should disappear

---

### 📊 **Step 7: Test Analytics Dashboard**

1. Navigate to Smart Shelf page
2. **Verify the 5 metric cards:**

**Card 1: Total Shelves**
- Shows total count (e.g., "3")
- Shows active count (e.g., "3 active")

**Card 2: Batches on Shelf**
- Shows total batches assigned to shelves
- Should match the number you assigned via API

**Card 3: Expiring Soon**
- Shows count of batches expiring in 30 days
- Should match what you see in FEFO Swipe tab

**Card 4: Incorrect Picks**
- Shows unacknowledged alert count
- Should be 0 after acknowledging alerts

**Card 5: Top Utilization**
- Shows highest utilization percentage
- Shows shelf code with highest usage

---

### 🔄 **Step 8: Test Virtual Queue Logic**

**View Queue via API:**

```bash
# Get virtual queue for a shelf
curl -X GET http://localhost:5000/api/smart-shelf/{shelfId}/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Queue retrieved successfully",
  "data": [
    {
      "batch": { "id": "...", "batchNumber": "BATCH-001", "expiryDate": "..." },
      "position": 0,
      "isAtFront": true
    },
    {
      "batch": { "id": "...", "batchNumber": "BATCH-002", "expiryDate": "..." },
      "position": 1,
      "isAtFront": false
    },
    ...
  ]
}
```

**Verify:**
- ✅ Position 0 has oldest expiry date
- ✅ Positions are sequential (0, 1, 2, 3...)
- ✅ `isAtFront` is true only for position 0

**Remove from Front:**
```bash
curl -X DELETE http://localhost:5000/api/smart-shelf/{shelfId}/batch/front \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Then check queue again:**
- Position 0 should now have what was previously position 1
- All positions should be reordered

---

### 🧪 **Step 9: Test Edge Cases**

#### **Empty States:**
1. Create a shelf with no batches
   - Shelf Map should show 0 stock, 0% utilization
2. Acknowledge all alerts
   - Alerts tab should show "No Incorrect Pick Alerts"
3. Process all expiring batches
   - FEFO Swipe should show "No Expiring Items"

#### **Full Shelf:**
1. Add batches until utilization > 80%
   - Shelf card should turn RED
   - Utilization bar should be red

#### **Multiple Zones:**
1. Filter shelves by zone (future enhancement)
2. Verify different zones display correctly

---

### 📝 **Step 10: Test Expiry Action History**

**View all expiry actions via API:**

```bash
curl -X GET http://localhost:5000/api/smart-shelf/expiry-actions?limit=20 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "batchId": "...",
      "action": "RETURN_TO_VENDOR",
      "quantity": 100,
      "createdAt": "2024-12-10T...",
      "batch": {
        "batchNumber": "BATCH-001",
        "drug": { "brandName": "Paracetamol" }
      }
    },
    ...
  ],
  "pagination": { ... }
}
```

---

## 🎬 **Complete End-to-End Test Scenario**

### Workflow: Stock Arrival → Sale → Expiry Management

**1. New Stock Arrives:**
- Receive shipment of "Amoxicillin" batch
- Create batch in Inventory with expiry in 20 days
- Assign to Shelf A1 via API
- Batch added to back of queue (highest position)

**2. Customer Purchase:**
- Customer buys Amoxicillin
- System checks Shelf A1 queue
- Pharmacist must pick batch at position 0
- If correct: Sale proceeds
- If wrong: Alert created

**3. Expiry Review:**
- At end of month, review expiring items
- Go to FEFO Swipe tab
- See batch expiring in 20 days
- Decision:
  - If 15+ days left: Discount & Push (amber button)
  - If vendor accepts returns: Return to Vendor (green button)
  - If damaged/expired: Dispose (red button)

**4. Analytics:**
- View dashboard metrics
- Check shelf utilization
- Review incorrect pick trends

---

## 🐛 **Troubleshooting**

### Issue 1: "Add Shelf" button not working
**Solution:** The dialog is now implemented. Refresh the page.

### Issue 2: No expiring batches showing
**Solution:**
- Check if batches have expiry dates within 30 days
- Ensure batches exist in inventory

### Issue 3: Shelf utilization shows 0%
**Solution:**
- Batches need to be linked to shelves via API
- Use `POST /api/smart-shelf/:shelfId/batch/:batchId`

### Issue 4: Can't acknowledge alerts
**Solution:**
- Check network tab for errors
- Ensure JWT token is valid
- Alert ID must exist

### Issue 5: API returns 401 Unauthorized
**Solution:**
- Copy fresh JWT token from Local Storage
- Token expires after some time, login again

---

## 📊 **Expected Test Results**

### ✅ **All Features Working:**
1. ✅ Shelves created and displayed
2. ✅ Batches linked to shelves
3. ✅ Visual shelf map with color coding
4. ✅ FEFO swipe interface loads batches
5. ✅ Swipe actions record successfully
6. ✅ Virtual queue maintains FEFO order
7. ✅ Incorrect pick alerts created and acknowledged
8. ✅ Analytics dashboard shows accurate metrics

---

## 🚀 **Next Steps (Future Enhancements)**

1. **Barcode Scanner Integration:**
   - Add batch scanning feature
   - Auto-assign to shelf on scan
   - Real-time FEFO validation during sale

2. **QR Code Generation:**
   - Generate printable QR codes for shelves
   - Mobile app to scan QR codes

3. **Shelf Detail View:**
   - Click shelf to see all batches
   - Visual queue representation
   - Drag-and-drop reordering

4. **Notifications:**
   - Email alerts for expiring items
   - SMS for incorrect picks
   - Dashboard notifications

5. **Reports:**
   - Export expiry action history
   - Monthly FEFO compliance report
   - Shelf utilization trends

---

## 📞 **Support**

If you encounter issues:
1. Check browser console (F12) for errors
2. Check backend logs in terminal
3. Verify database migration ran successfully
4. Ensure all dependencies are installed (`pnpm install`, `npm install`)

---

**Happy Testing! 🎉**
