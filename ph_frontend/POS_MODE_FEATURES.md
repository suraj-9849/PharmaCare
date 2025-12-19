# PharmaCare POS Mode - Feature Documentation

## Overview
The new Full-Screen Point of Sale (POS) Mode is optimized for speed and walk-in customers, providing a modern, efficient interface for processing sales quickly.

## How to Access
From the Sales page, click **"New Sale (POS Mode)"** button (green button in the top-right).

## Layout

### Split-Screen Design
- **Left Side (65%)**: Product Search & Grid
- **Right Side (35%)**: Current Bill (Shopping Cart)

## Key Features

### 1. Smart Product Search (Left Side)
- **Auto-focus**: Search bar automatically focuses when POS mode opens
- **Barcode Support**: Accepts barcode scans directly
- **Text Search**: Search by:
  - Brand Name
  - Generic Name
  - Batch Number
  - SKU
- **Enter Key**: If only 1 product matches, press Enter to add it instantly
- **Clear Search**: X button to quickly clear search

### 2. Product Grid Display
Each product card shows:
- **Brand Name** (main title)
- **Generic Name** (subtitle)
- **Stock Count** with color-coded badge:
  - Green: Stock > 10
  - Red: Stock ≤ 10
- **Expiry Date** with warnings:
  - Orange: Expiring within 90 days
  - Red: Expired
  - Alert icon for expiring/expired items
- **Price**: Large, prominent display
- **Click to Add**: Click any product card to add 1 unit to cart

### 3. Customer Toggle (Top Right)
- **Walk-in** (Default): No customer information needed
- **Registered**: Search and select registered customers
  - Shows mini customer search dropdown
  - Displays customer name, phone, email when selected
  - Easy to clear selection

### 4. Shopping Cart (Right Side)
- **Live Item Count**: Shows number of items in cart
- **Item List**: Each item displays:
  - Product name (brand and generic)
  - Quantity controls (-, +, direct input)
  - Unit price and total
  - Remove button
- **Empty State**: Clear visual indicator when cart is empty
- **Real-time Total**: Large, prominent total display

### 5. Quick-Pay Buttons (Bottom Right)
Three large, color-coded payment buttons:

#### Cash (Green)
- Click to show cash input modal
- Enter amount received
- Automatically calculates change
- Complete sale when amount ≥ total

#### UPI (Purple)
- One-click to launch Razorpay payment gateway
- Integrates with customer phone/email if registered
- Handles payment confirmation automatically

#### Card (Blue)
- One-click to complete card payment
- Instantly processes the sale

### 6. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **F1** | Focus on search bar |
| **F2** | Toggle Walk-in ↔ Registered customer |
| **F10** | Open payment (shows cash input) |
| **Escape** | Clear search, close cash input, or exit POS |
| **Enter** | Add product (if only 1 match) |

All shortcuts are displayed in the top header for easy reference.

### 7. Visual Design
- **PharmaCare Green Branding**: Emerald-600 (#059669) primary color
- **High Contrast**: White background for readability
- **Large Touch Targets**: Optimized for speed
- **Clear Typography**: Easy to read at a glance
- **Responsive Grid**: Adapts to screen size

## Workflow Example

### Quick Walk-in Sale
1. **Press F1** or click search bar
2. **Scan/Type** product name or barcode
3. **Click** product card (or press Enter if 1 match)
4. **Repeat** for additional items
5. **Click** Cash/UPI/Card button
6. **Complete** payment
7. Sale created instantly!

### Registered Customer Sale
1. **Press F2** to switch to Registered mode
2. **Search** for customer name/phone
3. **Select** customer from dropdown
4. Add products (same as walk-in)
5. Complete payment
6. Sale linked to customer automatically

## Technical Details

### Component Location
- **File**: `components/sales/pos-mode.tsx`
- **Integration**: `app/dashboard/sales/page.tsx`

### Features Implemented
✅ Full-screen modal overlay
✅ Split-screen layout (65/35)
✅ Auto-focus search with debounce
✅ Real-time product filtering
✅ Stock level indicators
✅ Expiry date warnings
✅ Customer type toggle
✅ Customer search with dropdown
✅ Cart management (add, remove, update qty)
✅ Live total calculation
✅ Cash payment with change calculation
✅ UPI payment via Razorpay
✅ Card payment
✅ Keyboard shortcuts (F1, F2, F10, Escape)
✅ Error handling and validation
✅ Loading states
✅ Responsive design

### API Endpoints Used
- `GET /inventory/available` - Fetch available products
- `GET /customers/search?q=` - Search customers
- `POST /sales` - Create sale transaction

## Advantages Over Classic Mode
1. **Faster**: Fewer clicks, keyboard shortcuts
2. **More Visible**: Full-screen, larger text and buttons
3. **Better for Walk-ins**: Default mode doesn't require customer
4. **Barcode Ready**: Direct barcode scan support
5. **Stock Aware**: See stock levels at a glance
6. **Expiry Aware**: Visual warnings for expiring items
7. **One-Click Payment**: Quick payment buttons
8. **Professional**: Modern POS interface

## Future Enhancements (Potential)
- Recent/frequently sold items on empty search
- Discount/coupon support
- Print receipt automatically
- Sound feedback on barcode scan
- Multi-language support
- Receipt printer integration
- Customer loyalty points display
