# Smart Shelf & FEFO - Quick Start Guide

## 🚀 Fastest Way to Test

### Prerequisites
- Backend running: `cd ph_backend && pnpm dev`
- Frontend running: `cd ph_frontend && npm run dev`
- Logged in to the dashboard

---

## ⚡ Option 1: Automatic Test Data (RECOMMENDED)

Run the automated seeder script to create everything:

```bash
cd ph_backend
npx ts-node scripts/seed-smart-shelf.ts
```

**This will create:**
- ✅ 4 shelf locations (A1, B2, C3, D4)
- ✅ 6 inventory batches with different expiry dates
- ✅ 1 sample incorrect pick alert
- ✅ Batches already assigned to shelves with queue positions

**Then:**
1. Navigate to http://localhost:3000/dashboard/smart-shelf
2. Click **"FEFO Swipe"** tab → See expiring batches ready to swipe
3. Click **"Shelf Map"** tab → See all 4 shelves with utilization
4. Click **"Alerts (1)"** tab → See the incorrect pick alert

---

## 📝 Option 2: Manual Testing (Step-by-Step)

### Step 1: Create Shelves

1. Go to http://localhost:3000/dashboard/smart-shelf
2. Click **"Add Shelf"** button (top right)
3. Fill in the form:

**Shelf 1:**
```
Shelf Code: A1
Shelf Name: Main Pharmacy Shelf
Zone: General
Capacity: 50
```

**Shelf 2:**
```
Shelf Code: B2
Shelf Name: Refrigerated Shelf
Zone: Refrigerated
Capacity: 30
```

4. Click "Create Shelf" for each

---

### Step 2: Create Expiring Batches

1. Go to **Dashboard > Inventory**
2. Click **"Add Batch"**
3. Create these batches:

**Batch 1 (Expiring Soon):**
```
Drug: [Select any drug]
Batch Number: URGENT-001
Quantity: 100
Purchase Price: 50
Sell Price: 100
Expiry Date: [Set to 10 days from today]
Supplier: [Select any]
```

**Batch 2 (Expiring Very Soon):**
```
Batch Number: CRITICAL-002
Expiry Date: [Set to 5 days from today]
[Other fields same as above]
```

Repeat for 3-4 more batches with varying expiry dates.

---

### Step 3: Link Batches to Shelves

**Get Your JWT Token:**
1. Press F12 (DevTools)
2. Go to **Application** > **Local Storage**
3. Find `auth_token`
4. Copy the value

**Get Shelf and Batch IDs:**
1. Go to Smart Shelf page
2. Open **Network** tab in DevTools
3. Refresh page
4. Find request to `/api/smart-shelf`
5. Copy the `id` from response (this is your shelfId)
6. Go to Inventory page
7. Find request to `/api/inventory`
8. Copy batch `id` values

**Link via API:**

Open a new terminal or use Postman:

```bash
# Replace {shelfId} and {batchId} with actual IDs
curl -X POST http://localhost:5000/api/smart-shelf/{shelfId}/batch/{batchId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/smart-shelf/cm4ex123abc/batch/cm4ey456def \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

Link 2-3 batches to each shelf.

---

### Step 4: Test the Features

**A. Test Shelf Map:**
1. Go to **Smart Shelf** page
2. Click **"Shelf Map"** tab
3. You should see:
   - All your shelves displayed as cards
   - Utilization percentages
   - Color coding (green/amber/red based on capacity)
   - Stock counts

**B. Test FEFO Swipe:**
1. Click **"FEFO Swipe"** tab
2. You should see:
   - Batches expiring in 30 days
   - Color-coded expiry badges
   - Current batch card with details
   - Three action buttons

3. Try each action:
   - **Green button** → Return to Vendor
   - **Amber button** → Discount & Push
   - **Red button** → Dispose

4. After clicking, the next batch should auto-load

**C. Test Alerts:**
1. Generate an alert by validating incorrect pick (use API from test file)
2. Go to **"Alerts"** tab
3. Click **"Review"** button
4. Click **"Acknowledge"**
5. Alert should disappear

---

## 🎯 Quick Feature Checklist

### Visual Shelf Map
- [ ] Shelves display with correct utilization %
- [ ] Color coding works (green/amber/red)
- [ ] Stock count is accurate
- [ ] Zone is shown

### FEFO Swipe Interface
- [ ] Expiring batches load
- [ ] Correct expiry badges (color-coded)
- [ ] Progress indicator shows (e.g., "Item 2 of 5")
- [ ] Navigation arrows work (left/right)
- [ ] All three action buttons work:
  - [ ] Return to Vendor (green)
  - [ ] Discount & Push (amber)
  - [ ] Dispose (red)
- [ ] Next batch auto-loads after action
- [ ] "No Expiring Items" shows when list is empty

### Analytics Dashboard
- [ ] Total Shelves count is correct
- [ ] Batches on Shelf count is correct
- [ ] Expiring Soon count matches FEFO tab
- [ ] Top Utilization shows highest %

### Alerts System
- [ ] Incorrect pick alert appears
- [ ] Review button opens dialog
- [ ] Alert details are shown
- [ ] Acknowledge button works
- [ ] Alert count updates in tab badge

### Add Shelf Dialog
- [ ] Dialog opens when clicking "Add Shelf"
- [ ] All form fields work
- [ ] Zone dropdown shows options
- [ ] Create button submits successfully
- [ ] New shelf appears in Shelf Map
- [ ] Dialog closes after creation

---

## 🐛 Common Issues & Fixes

### Issue: "Add Shelf button does nothing"
**Fix:** Clear browser cache and refresh page. The dialog should now work.

### Issue: "No expiring batches showing"
**Fix:**
- Ensure batches have expiry dates within 30 days from today
- Check batches exist in Inventory page
- Batches must have quantity > 0

### Issue: "Shelf utilization is 0%"
**Fix:** Batches need to be linked to shelves via API (Step 3 above)

### Issue: "Can't swipe batches"
**Fix:**
- Check browser console for errors (F12)
- Ensure backend is running (http://localhost:5000)
- Verify JWT token is valid (try logging out and back in)

### Issue: "401 Unauthorized on API calls"
**Fix:**
- JWT token expired - login again
- Copy fresh token from Local Storage
- Ensure token is included in Authorization header

---

## 📊 Expected Results After Setup

### Analytics Cards Should Show:
```
Total Shelves: 4
Batches on Shelf: 6
Expiring Soon: 4 (batches expiring in 30 days)
Incorrect Picks: 1 (unacknowledged alert)
Top Utilization: ~20-40%
```

### Shelf Map Should Show:
- 4 shelf cards
- Color-coded based on utilization
- Each showing stock/capacity ratio
- Zone labels visible

### FEFO Swipe Should Show:
- 4-6 batches to review
- Sorted by expiry date (oldest first)
- Each with expiry countdown

---

## 🎬 Watch It Work

### Demo Flow:
1. **Day 1:** Create shelves and add batches
2. **Day 7:** Batch URGENT-001 shows "3 days left" (red badge)
3. **Day 10:** Swipe URGENT-001 → Return to Vendor
4. **Day 15:** Batch CRITICAL-002 now at front
5. **Day 20:** Review analytics → See expiry actions taken

---

## 🔗 Useful Links

- **Frontend:** http://localhost:3000/dashboard/smart-shelf
- **Backend API:** http://localhost:5000/api/smart-shelf
- **API Docs (Swagger):** http://localhost:5000/api-docs
- **Testing Guide:** [SMART_SHELF_TESTING_GUIDE.md](./SMART_SHELF_TESTING_GUIDE.md)
- **HTTP Requests:** [ph_backend/test-smart-shelf.http](./ph_backend/test-smart-shelf.http)

---

## 🚀 Pro Tips

1. **Use the seeder script** for fastest setup (Option 1 above)
2. **Keep DevTools open** to monitor API calls
3. **Create batches with varied expiry dates** for better testing
4. **Test incorrect picks** to see the alert system
5. **Try different zones** (Refrigerated, Controlled, etc.)

---

## 📞 Need Help?

Check the detailed testing guide: `SMART_SHELF_TESTING_GUIDE.md`

**Happy Testing! 🎉**
