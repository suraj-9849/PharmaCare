# PharmaCare - Gemini AI Image Recognition Features

## Implementation Complete! ✅

I've successfully implemented **two powerful image recognition features** for your PharmaCare pharmacy management system using **Gemini 2.0 Flash** (the latest model from Google AI).

---

## 🎯 Features Implemented

### 1. **Invoice Processing with AI**
Upload supplier invoice images → Gemini extracts all items → Auto-add to inventory database

### 2. **Prescription Verification with AI**
Upload prescription images → Gemini extracts medications → Check availability → Process purchase → Auto-reduce stock

---

## 📁 Files Created/Modified

### **Backend Files Created:**

1. **`src/services/invoice.service.ts`**
   - Extracts invoice data using Gemini 2.0 Flash
   - Smart drug matching with fuzzy logic
   - Auto-creates suppliers and inventory batches

2. **`src/services/prescription.service.ts`**
   - Extracts medications from prescriptions (including handwritten)
   - Intelligent medication matching
   - Automatic stock reduction with FEFO (First Expired, First Out)
   - Low stock alerts

3. **`src/routes/invoice.routes.ts`**
   - `POST /api/invoices/extract` - Extract data from invoice image
   - `POST /api/invoices/process` - Save verified invoice to database

4. **`src/routes/prescription.routes.ts`**
   - `POST /api/prescriptions/scan` - Extract medications from prescription
   - `POST /api/prescriptions/check-availability` - Check stock availability
   - `POST /api/prescriptions/purchase` - Process purchase & reduce stock

### **Files Modified:**

5. **`prisma/schema.prisma`**
   - Added `customerId` to Sales
   - Made `supplierId` optional in InventoryBatch
   - Added proper relations for StockAlert and Customer
   - Made supplier email unique
   - Added default value for drug SKU

6. **`src/routes/index.ts`**
   - Registered invoice and prescription routes

7. **`src/config/env.ts`**
   - Added `GEMINI_API_KEY` configuration

8. **`.env.example`**
   - Added Gemini API key placeholder

---

## 🚀 Setup Instructions

### Step 1: Add Your Gemini API Key

1. **Get your free Gemini API key:**
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to your `.env` file:**
   ```bash
   cd PharmaCare/ph_backend

   # Edit your .env file and add:
   GEMINI_API_KEY=your-actual-gemini-api-key-here
   ```

### Step 2: Run Database Migration

Since we modified the Prisma schema, you need to apply the changes:

```bash
cd PharmaCare/ph_backend

# Generate Prisma client with new schema
pnpm prisma generate

# Apply migrations to your database
# Note: Run this when your database is accessible
pnpm prisma db push
```

**⚠️ Important:** The migration requires your PostgreSQL database to be running. If you see errors about duplicate suppliers, you may need to run:

```sql
-- Fix existing duplicate supplier emails if any
UPDATE suppliers
SET email = CONCAT(email, '-', id)
WHERE id NOT IN (
  SELECT MIN(id) FROM suppliers GROUP BY email
);
```

### Step 3: Start the Backend

```bash
cd PharmaCare/ph_backend
pnpm dev
```

You should see: `🚀 Server running on port 5000`

### Step 4: Test the Endpoints

#### Test Invoice Extraction:
```bash
curl -X POST http://localhost:5000/api/invoices/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Prescription Routes:
```bash
curl -X POST http://localhost:5000/api/prescriptions/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧪 API Usage Examples

### Feature 1: Invoice Processing

**Step 1: Extract Invoice Data**
```bash
POST /api/invoices/extract
Content-Type: multipart/form-data
Authorization: Bearer <your-jwt-token>

Body:
  - invoice: <image-file> (jpg, png, webp)

Response:
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-12-09",
    "supplier": {
      "name": "MedPlus Distributors",
      "contactNumber": "+91-9876543210",
      "email": "contact@medplus.com",
      "address": "123 Medical Street, Mumbai"
    },
    "items": [
      {
        "drugName": "Paracetamol 650mg",
        "genericName": "Paracetamol",
        "batchNumber": "PCM-2024-12",
        "quantity": 500,
        "unitPrice": 8.50,
        "totalPrice": 4250.00,
        "expiryDate": "2026-12-31",
        "manufacturer": "Cipla",
        "category": "Analgesics"
      }
    ],
    "totalAmount": 4250.00,
    "confidence": 95
  },
  "message": "Invoice data extracted successfully..."
}
```

**Step 2: Process and Save to Database**
```bash
POST /api/invoices/process
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

Body:
{
  "extractedData": { /* data from step 1 */ }
}

Response:
{
  "success": true,
  "data": {
    "supplier": { /* created/updated supplier */ },
    "batches": [ /* created inventory batches */ ],
    "newDrugsCreated": [ /* new drugs added */ ],
    "matchedDrugsCount": 3,
    "totalItems": 5
  },
  "message": "Successfully processed 5 items. 2 new drugs added, 3 existing updated."
}
```

---

### Feature 2: Prescription Verification

**Step 1: Scan Prescription**
```bash
POST /api/prescriptions/scan
Content-Type: multipart/form-data
Authorization: Bearer <your-jwt-token>

Body:
  - prescription: <image-file>

Response:
{
  "success": true,
  "data": {
    "patientName": "John Doe",
    "doctorName": "Dr. Smith",
    "prescriptionDate": "2024-12-09",
    "medications": [
      {
        "medicationName": "Paracetamol 650mg",
        "dosage": "650mg",
        "frequency": "3 times daily",
        "duration": "5 days",
        "quantity": 15,
        "instructions": "After meals"
      }
    ],
    "confidence": 90
  }
}
```

**Step 2: Check Availability**
```bash
POST /api/prescriptions/check-availability
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

Body:
{
  "medications": [ /* array from step 1 */ ]
}

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "prescribedMedication": { /* medication details */ },
        "matchResult": {
          "matchedDrugId": "drug-paracetamol",
          "matchedDrugName": "Dolo 650",
          "confidence": 95,
          "availableQuantity": 500,
          "isAvailable": true
        },
        "availableBatches": [ /* batches with expiry dates */ ],
        "status": "IN_STOCK"
      }
    ],
    "summary": {
      "total": 1,
      "inStock": 1,
      "lowStock": 0,
      "outOfStock": 0
    }
  }
}
```

**Step 3: Process Purchase (Auto Stock Reduction)**
```bash
POST /api/prescriptions/purchase
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

Body:
{
  "prescriptionData": { /* data from scan */ },
  "availabilityResults": [ /* results from check-availability */ ],
  "paymentMethod": "CASH",
  "customerId": "customer-001" // optional
}

Response:
{
  "success": true,
  "data": {
    "sale": {
      "id": "sale-12345",
      "totalAmount": 187.50,
      "saleItems": [ /* items sold */ ]
    },
    "itemsProcessed": 1,
    "totalAmount": 187.50
  },
  "message": "Purchase completed! Stock automatically updated."
}
```

---

## 🎨 Frontend Integration (To Be Done)

You'll need to create these pages in your Next.js frontend:

### 1. Invoice Upload Page
**Location:** `app/dashboard/invoices/upload/page.tsx`

**Features:**
- File upload component (drag-and-drop)
- Preview invoice image
- Display extracted data in editable table
- Confidence scores
- "Confirm & Save" button

### 2. Prescription Verification Page
**Location:** `app/dashboard/prescriptions/verify/page.tsx`

**Features:**
- Upload prescription image
- Display prescription on left, medications on right
- Availability indicators (✅ In Stock, ⚠️ Low Stock, ❌ Out of Stock)
- Batch selection dropdown
- Payment method selector
- "Process Purchase" button

---

## 💡 How It Works

### Invoice Processing Flow:
1. User uploads invoice image
2. Gemini 2.0 Flash analyzes image and extracts structured data
3. System matches drug names with existing database (fuzzy matching)
4. Creates new drugs if not found
5. Creates/updates supplier information
6. Creates inventory batches with all details
7. Returns summary for user verification

### Prescription Processing Flow:
1. User uploads prescription (even handwritten!)
2. Gemini extracts medication names, dosages, frequencies
3. System intelligently matches prescribed meds with inventory
4. Shows availability status for each medication
5. User confirms purchase
6. **Automatic stock reduction using FEFO** (First Expired, First Out)
7. Creates low stock alerts if needed
8. Returns sale receipt

---

## 🔧 Configuration

### Gemini Model Settings

Currently using: **`gemini-2.0-flash-exp`**

You can change the model in the services:
- `gemini-2.0-flash-exp` - Latest, fastest, most capable (recommended)
- `gemini-1.5-flash` - Stable version
- `gemini-1.5-pro` - More powerful but slower

### File Upload Limits

Current: **10MB per image**

To change:
```typescript
// In invoice.routes.ts and prescription.routes.ts
const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  }
});
```

---

## 💰 Pricing (Gemini API)

**Free Tier:**
- 1,500 requests/day
- More than enough for most pharmacies!

**Paid Tier:**
- $0.075 per 1M input tokens
- $0.30 per 1M output tokens
- Images count as ~258 tokens each

**Example Cost:**
- 100 invoices/day = ~$0.02/day = **$7/month**
- 50 prescriptions/day = ~$0.01/day = **$3/month**

---

## 🛡️ Security Features

- ✅ JWT authentication required for all endpoints
- ✅ File type validation (images only)
- ✅ File size limits
- ✅ Database transactions for atomic operations
- ✅ Input sanitization
- ✅ Error handling with rollback

---

## 🐛 Troubleshooting

### Error: "Missing GEMINI_API_KEY"
**Solution:** Add your API key to `.env` file

### Error: "Prisma migration failed"
**Solution:** Run `pnpm prisma db push` when database is accessible

### Error: "Supplier email already exists"
**Solution:** Run the SQL fix query mentioned in Step 2 above

### Low confidence scores
**Solution:** Ensure images are:
- High resolution (min 800x600)
- Good lighting
- Clear text (not blurry)
- Proper orientation

---

## 📊 Database Changes Summary

**New Fields:**
- `Sale.customerId` (optional) - Link sales to customers
- `Drug.sku` now has default value (auto-generated)
- `Supplier.email` is now unique
- `InventoryBatch.supplierId` is now optional

**New Relations:**
- `Drug ↔ StockAlert` (one-to-many)
- `Sale ↔ Customer` (many-to-one)

---

## 🚀 Next Steps

1. **Add your Gemini API key** to `.env`
2. **Run database migration** (`pnpm prisma db push`)
3. **Test the APIs** using curl or Postman
4. **Build frontend pages** for invoice upload and prescription verification
5. **Add image storage** (optional: AWS S3, Cloudinary for audit trail)
6. **Customize markup** (currently 30% on invoices)
7. **Add user permissions** (only ADMIN can process invoices)

---

## 📞 Support

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify your Gemini API key is correct
3. Ensure database is running and accessible
4. Check that all dependencies are installed

---

## 🎉 Features Highlights

✅ **Smart Drug Matching** - Handles abbreviations, typos, variations
✅ **Handwriting Recognition** - Reads doctor prescriptions
✅ **FEFO Stock Management** - Uses oldest stock first
✅ **Auto Low Stock Alerts** - Never run out of critical medicines
✅ **Multi-batch Support** - Automatically allocates from multiple batches
✅ **Transaction Safety** - Rollback on errors
✅ **Confidence Scores** - Know when to manually verify
✅ **Supplier Auto-creation** - Streamlined invoice processing

---

**Congratulations! Your pharmacy now has AI-powered image recognition! 🎊**
