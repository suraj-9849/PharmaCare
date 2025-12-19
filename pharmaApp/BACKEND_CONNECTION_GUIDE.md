# Backend Connection Guide - PharmaCare App

## ✅ What's Been Done

### Flutter App Side:
- ✅ API Constants updated with base URL (`http://10.0.2.2:5000/api`)
- ✅ API Service created with Dio and authentication interceptor
- ✅ Repositories created: Auth, Dashboard, Drug, Alert
- ✅ Login screen connected to `/auth/login` API
- ✅ Home screen connected to `/dashboard` API
- ✅ Token storage implemented with SharedPreferences

### Backend API Available:
Your backend already has all these endpoints ready:
- ✅ `POST /api/auth/login` - User authentication
- ✅ `GET /api/auth/me` - Get current user
- ✅ `GET /api/dashboard` - Dashboard statistics
- ✅ `GET /api/drugs` - List all drugs
- ✅ `GET /api/alerts` - Get stock alerts
- ✅ `GET /api/inventory` - Inventory management
- ✅ `GET /api/smart-shelf` - Smart shelf integration

---

## 🚀 Quick Start - Connect App to Database

### Step 1: Start Your Backend Server

```bash
# Navigate to backend directory
cd "C:\Users\Sai Mohith\Desktop\pharmaCare\PharmaCare\ph_backend"

# Install dependencies (if not already done)
npm install
# or
pnpm install

# Start the server
npm run dev
# or
pnpm dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║   PharmaCare API Server                                   ║
║   Port: 5000                                              ║
║   URL: http://localhost:5000                              ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 2: Verify Backend is Running

Open your browser or use curl:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### Step 3: Create a Test User (if needed)

Your backend likely needs a user in the database. Check if you have any users:

```bash
# Connect to your Neon PostgreSQL database
# Use the DATABASE_URL from your .env file
```

Or create a user through Prisma:
```bash
cd "C:\Users\Sai Mohith\Desktop\pharmaCare\PharmaCare\ph_backend"
npx prisma studio
```

This opens Prisma Studio where you can:
1. Click on `User` table
2. Add a new record:
   - username: `admin`
   - email: `admin@pharmacare.com`
   - passwordHash: (You'll need to hash a password - see below)
   - role: `ADMIN`

**To hash a password**, run this Node.js script:
```javascript
const bcrypt = require('bcrypt');
const password = 'admin123';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

### Step 4: Run the Flutter App

```bash
cd pharmaApp
flutter run
```

### Step 5: Login

Use your created credentials:
- **Email**: `admin@pharmacare.com`
- **Password**: `admin123` (or whatever you set)

---

## 🔌 Connection Flow

```
Flutter App (Android Emulator)
         ↓
http://10.0.2.2:5000/api  (Emulator's localhost)
         ↓
Your Computer: http://localhost:5000
         ↓
Express.js Backend
         ↓
Neon PostgreSQL Database
```

---

## 📱 Testing Real Device

If using a **real Android device** instead of emulator:

1. **Find your computer's IP address**:
   ```bash
   ipconfig  # Windows
   # Look for IPv4 Address under your network adapter
   ```

2. **Update API Constants**:
   Open `lib/core/constants/api_constants.dart` and change:
   ```dart
   static const String baseUrl = 'http://YOUR_IP:5000/api';
   // Example: 'http://192.168.1.100:5000/api'
   ```

3. **Make sure your phone and computer are on the same WiFi network**

---

## 🐛 Troubleshooting

### Problem: "Network error. Please check your connection"

**Solution:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check if port 5000 is not blocked by firewall
3. For emulator, ensure you're using `http://10.0.2.2:5000/api`
4. For real device, use your computer's IP address

### Problem: "401 Unauthorized" or "Invalid credentials"

**Solutions:**
1. Check if user exists in database
2. Verify password hash is correct
3. Check JWT_SECRET in backend `.env` file

### Problem: App connects but shows no data

**Solutions:**
1. Check if database has data (drugs, inventory, etc.)
2. Run the seed script if available:
   ```bash
   cd ph_backend
   npx ts-node src/seed.ts
   ```
3. Check backend console logs for errors

### Problem: "Session expired" after successful login

**Solution:**
- Check if JWT_SECRET is set in backend `.env`
- Verify token is being saved (check Flutter logs for "🌐" network calls)

---

## 📊 Expected Behavior After Connection

### 1. Login Screen
- Enter credentials
- See loading spinner
- On success: Navigate to Home screen
- On error: Show red snackbar with error message

### 2. Home Screen
- Shows loading spinner
- Fetches dashboard stats from backend
- Displays:
  - Total Drugs count
  - Expiring This Month count
  - Pending Reorders count
  - Today's Sales count
- Shows alerts (if any)

### 3. Network Logs
You'll see these in Flutter console:
```
🌐 POST http://10.0.2.2:5000/api/auth/login
✅ 200 http://10.0.2.2:5000/api/auth/login
🌐 GET http://10.0.2.2:5000/api/dashboard
✅ 200 http://10.0.2.2:5000/api/dashboard
```

---

## 🗄️ Database Setup (If Empty)

If your database is empty, you need some initial data:

### Option 1: Use Prisma Studio
```bash
cd ph_backend
npx prisma studio
```
Manually add data through the UI.

### Option 2: Run Seed Script
If your backend has a seed file:
```bash
cd ph_backend
npx ts-node src/seed.ts
```

### Option 3: Import Sample Data
Use the test HTTP file:
```bash
cd ph_backend
# Use VS Code REST Client or Postman with test-smart-shelf.http
```

---

## 🎯 Next Steps

Once connected:

1. **Test Login** ✅
   - Use admin credentials
   - Verify token is saved

2. **View Dashboard** ✅
   - Check if stats load
   - Verify data matches database

3. **Connect Inventory Screen**
   - Already has repository
   - Just needs UI update (similar to Home)

4. **Test Scanner**
   - Add barcode lookup endpoint
   - Test with real medicine barcodes

5. **Add Firebase Notifications**
   - Set up Firebase project
   - Configure FCM
   - Test push notifications

---

## 📝 Important Files

**Flutter App:**
- `lib/core/constants/api_constants.dart` - API URLs
- `lib/data/services/api_service.dart` - HTTP client
- `lib/data/repositories/*.dart` - API calls
- `lib/presentation/screens/auth/login_screen.dart` - Login UI

**Backend:**
- `src/index.ts` - Server entry point
- `src/routes/*.routes.ts` - API endpoints
- `.env` - Configuration (DATABASE_URL, PORT, JWT_SECRET)
- `prisma/schema.prisma` - Database schema

---

## 🎉 Success Checklist

- [ ] Backend server running on port 5000
- [ ] Database connected (check `/health` endpoint)
- [ ] User created in database
- [ ] Flutter app running on emulator/device
- [ ] Login successful
- [ ] Dashboard shows real data
- [ ] Network logs show successful API calls

---

**Need Help?** Check the backend console logs and Flutter logs for detailed error messages!

Good luck! 🚀
