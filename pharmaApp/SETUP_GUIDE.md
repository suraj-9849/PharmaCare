# PharmaCare Flutter App - Setup & Development Guide

## 📱 Project Overview

A Flutter mobile application for pharmacy management with features:
- **Home Dashboard**: Real-time alerts, stats, and activity feed
- **Inventory Management**: Search, filter, and adjust medicine quantities
- **Barcode Scanner**: Scan medicines to check location and stock

---

## ✅ Completed Setup

### 1. Project Structure Created
```
pharmaApp/
├── lib/
│   ├── core/
│   │   ├── constants/     # API endpoints, colors, strings
│   │   ├── theme/         # App theme configuration
│   │   └── utils/         # Date formatting, alert helpers
│   ├── data/
│   │   ├── models/        # Drug, Alert, User, etc.
│   │   ├── repositories/  # (To be implemented)
│   │   └── services/      # (To be implemented)
│   ├── presentation/
│   │   ├── screens/
│   │   │   ├── auth/      # Login screen
│   │   │   ├── home/      # Dashboard with widgets
│   │   │   ├── inventory/ # Inventory list screen
│   │   │   ├── scanner/   # Barcode scanner
│   │   │   └── main/      # Bottom navigation
│   │   └── providers/     # (To be implemented)
│   └── routes/            # (To be implemented)
└── android/               # Android config with camera permissions
```

### 2. Dependencies Installed
- **State Management**: Provider
- **Networking**: Dio, Retrofit
- **Firebase**: firebase_core, firebase_messaging
- **Scanner**: mobile_scanner
- **UI**: shimmer, cached_network_image, flutter_staggered_animations

### 3. Screens Built
- ✅ Login Screen
- ✅ Home Screen (with Alert Cards, Stats Cards, Activity Feed)
- ✅ Inventory Screen (with search bar and empty state)
- ✅ Scanner Screen (with custom overlay and camera integration)

### 4. Data Models Created
- Drug, InventoryBatch, Supplier, ShelfLocation
- StockAlert, ReorderRequest
- User, AuthResponse
- DashboardStats

---

## 🚀 Next Steps

### Step 1: Build Backend REST API

You need to create API endpoints in your Node.js backend. Currently, you have a Prisma schema but no API routes.

**Create these files in `PharmaCare/ph_backend/src/`:**

#### A. Authentication API (`src/routes/auth.ts`)
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      accessToken,
      refreshToken: accessToken, // Implement proper refresh token logic
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
```

#### B. Drugs API (`src/routes/drugs.ts`)
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/drugs - List all drugs with total quantity
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    const drugs = await prisma.drug.findMany({
      where: search ? {
        OR: [
          { brandName: { contains: search as string, mode: 'insensitive' } },
          { genericName: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } }
        ]
      } : undefined,
      include: {
        inventoryBatches: {
          include: {
            shelfLocation: true
          }
        }
      }
    });

    // Calculate total quantity for each drug
    const drugsWithQuantity = drugs.map(drug => ({
      ...drug,
      totalQuantity: drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0)
    }));

    res.json(drugsWithQuantity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drugs' });
  }
});

// GET /api/drugs/:id - Get single drug with batches
router.get('/:id', async (req, res) => {
  try {
    const drug = await prisma.drug.findUnique({
      where: { id: req.params.id },
      include: {
        inventoryBatches: {
          include: {
            shelfLocation: true,
            supplier: true
          }
        }
      }
    });

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    res.json(drug);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drug' });
  }
});

export default router;
```

#### C. Alerts API (`src/routes/alerts.ts`)
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/alerts - Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await prisma.stockAlert.findMany({
      include: {
        drug: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PATCH /api/alerts/:id/read - Mark alert as read
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await prisma.stockAlert.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;
```

#### D. Stats API (`src/routes/stats.ts`)
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/stats/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalDrugs = await prisma.drug.count();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringBatches = await prisma.inventoryBatch.count({
      where: {
        expiryDate: {
          lte: thirtyDaysFromNow,
          gt: new Date()
        }
      }
    });

    const pendingReorders = await prisma.reorderRequest.count({
      where: { status: 'PENDING' }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await prisma.sale.count({
      where: {
        saleDate: { gte: today }
      }
    });

    const lowStockDrugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: true
      }
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;

    lowStockDrugs.forEach(drug => {
      const totalQty = drug.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalQty === 0) outOfStockCount++;
      else if (totalQty <= drug.reorderLevel) lowStockCount++;
    });

    const expiredBatches = await prisma.inventoryBatch.count({
      where: {
        expiryDate: { lt: new Date() }
      }
    });

    res.json({
      totalDrugs,
      expiringThisMonth: expiringBatches,
      pendingReorders,
      todaySales,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      expiredItems: expiredBatches
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
```

#### E. Update Main Server File (`index.js` or `src/index.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import drugRoutes from './routes/drugs';
import alertRoutes from './routes/alerts';
import statsRoutes from './routes/stats';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/stats', statsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Step 2: Configure API Base URL

Update `lib/core/constants/api_constants.dart`:

```dart
class ApiConstants {
  // Replace with your actual backend URL
  // For local testing: 'http://10.0.2.2:3000/api' (Android emulator)
  // For real device: 'http://YOUR_IP:3000/api'
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  // ... rest of constants
}
```

---

### Step 3: Implement API Service Layer

Create `lib/data/services/api_service.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('access_token');

        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        return handler.next(options);
      },
    ));
  }

  Dio get dio => _dio;
}
```

---

### Step 4: Set Up Firebase

#### A. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" → Enter "PharmaCare"
3. Disable Google Analytics (optional)
4. Click "Create project"

#### B. Add Android App
1. In Firebase Console → Click Android icon
2. Enter package name: `com.pharmacare.pharma_care`
3. Download `google-services.json`
4. Place it in `pharmaApp/android/app/`

#### C. Update Android Build Files

**android/build.gradle:**
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**android/app/build.gradle:**
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    // ... existing dependencies
}
```

#### D. Initialize Firebase in Flutter

Update `lib/main.dart`:
```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const PharmaCareApp());
}
```

Generate Firebase config:
```bash
cd pharmaApp
flutterfire configure
```

---

### Step 5: Implement Push Notifications

Create `lib/data/services/notification_service.dart`:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Request permission
    await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get FCM token
    final token = await _fcm.getToken();
    print('FCM Token: $token');
    // TODO: Send token to backend

    // Initialize local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    await _localNotifications.initialize(initSettings);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_backgroundMessageHandler);
  }

  void _handleMessage(RemoteMessage message) {
    // Show local notification
    _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'alerts_channel',
          'Alerts',
          importance: Importance.high,
        ),
      ),
    );
  }
}

Future<void> _backgroundMessageHandler(RemoteMessage message) async {
  print('Background message: ${message.messageId}');
}
```

---

## 🧪 Testing the App

### 1. Run the App
```bash
cd pharmaApp
flutter run
```

### 2. Test Features
- **Login**: Use temporary bypass (already implemented)
- **Home Screen**: View empty stats and alerts
- **Inventory**: See empty state
- **Scanner**: Grant camera permission and test scanning

### 3. Connect to Backend
1. Start your backend server: `cd ph_backend && npm run dev`
2. Update API base URL in `api_constants.dart`
3. Test login with real credentials

---

## 📝 TODO List

- [ ] Build backend REST API endpoints (auth, drugs, alerts, stats)
- [ ] Create API service layer in Flutter
- [ ] Implement state management with Provider
- [ ] Set up Firebase project and add `google-services.json`
- [ ] Configure Firebase Cloud Messaging
- [ ] Implement notification service
- [ ] Create Firebase Cloud Functions for alert triggers
- [ ] Add barcode lookup functionality
- [ ] Implement inventory quantity adjustment
- [ ] Add user profile screen
- [ ] Create drug detail screen
- [ ] Implement real-time data refresh

---

## 🔧 Troubleshooting

### Camera not working
- Ensure permissions are in AndroidManifest.xml (already added)
- Grant camera permission when prompted

### Network error
- Check backend is running
- Update base URL to match your network
- For Android emulator: Use `10.0.2.2` instead of `localhost`

### Build errors
- Run `flutter clean && flutter pub get`
- Delete `build/` folder
- Restart IDE

---

## 📚 Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Firebase Setup Guide](https://firebase.google.com/docs/flutter/setup)
- [Dio HTTP Client](https://pub.dev/packages/dio)
- [Provider State Management](https://pub.dev/packages/provider)

---

## 🎯 Next Session Focus

1. **Implement Backend APIs** - This is critical for the app to work
2. **Set up Firebase** - For push notifications
3. **Connect API layer** - Make the app functional with real data

Good luck! The foundation is solid. Now it's time to connect the backend and make it come alive! 🚀
