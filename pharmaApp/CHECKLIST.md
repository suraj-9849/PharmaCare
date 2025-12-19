# PharmaCare App - Development Checklist

## ✅ Completed

- [x] Create Flutter project structure
- [x] Set up dependencies (Provider, Dio, Firebase, Scanner)
- [x] Create core constants (colors, strings, API endpoints)
- [x] Design app theme (Material 3)
- [x] Build data models (Drug, Alert, Batch, User, etc.)
- [x] Create Login screen
- [x] Create Home screen with dashboard
- [x] Create Inventory screen with search
- [x] Create Scanner screen with camera
- [x] Set up bottom navigation
- [x] Add Android camera permissions
- [x] Generate JSON serialization code

---

## 🔥 Critical Priority (Must Do First)

### Backend REST API
- [ ] Create Express.js server structure
- [ ] **Auth API** (`routes/auth.ts`)
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/register (optional)
  - [ ] POST /api/auth/refresh (optional)
- [ ] **Drugs API** (`routes/drugs.ts`)
  - [ ] GET /api/drugs (list with search)
  - [ ] GET /api/drugs/:id (single drug)
- [ ] **Alerts API** (`routes/alerts.ts`)
  - [ ] GET /api/alerts
  - [ ] PATCH /api/alerts/:id/read
- [ ] **Stats API** (`routes/stats.ts`)
  - [ ] GET /api/stats/dashboard
- [ ] **Inventory API** (`routes/inventory.ts`)
  - [ ] PATCH /api/inventory/adjust
- [ ] **Scanner API** (`routes/scanner.ts`)
  - [ ] POST /api/scan/barcode
  - [ ] GET /api/shelves/code/:code
- [ ] Test all endpoints with Postman

### Flutter API Integration
- [ ] Update API base URL in `api_constants.dart`
- [ ] Create `ApiService` class (`data/services/api_service.dart`)
- [ ] Create `AuthRepository` (`data/repositories/auth_repository.dart`)
- [ ] Create `DrugRepository` (`data/repositories/drug_repository.dart`)
- [ ] Create `AlertRepository` (`data/repositories/alert_repository.dart`)

### State Management
- [ ] Create `AuthProvider` (`presentation/providers/auth_provider.dart`)
- [ ] Create `DrugProvider` (`presentation/providers/drug_provider.dart`)
- [ ] Create `AlertProvider` (`presentation/providers/alert_provider.dart`)
- [ ] Register providers in `main.dart`

### Connect Screens to Data
- [ ] Connect Login screen to API
- [ ] Connect Home screen to stats API
- [ ] Connect Inventory screen to drugs API
- [ ] Connect Scanner to barcode API
- [ ] Test data flow end-to-end

---

## 🔔 High Priority (For Notifications)

### Firebase Setup
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Add Android app to Firebase
- [ ] Download `google-services.json`
- [ ] Place `google-services.json` in `android/app/`
- [ ] Update `android/build.gradle` (add Google Services plugin)
- [ ] Update `android/app/build.gradle` (apply plugin)
- [ ] Run `flutterfire configure`
- [ ] Initialize Firebase in `main.dart`

### Firebase Cloud Messaging
- [ ] Create `NotificationService` (`data/services/notification_service.dart`)
- [ ] Request FCM permissions
- [ ] Get FCM token
- [ ] Send token to backend
- [ ] Handle foreground messages
- [ ] Handle background messages
- [ ] Test notifications

### Firebase Cloud Functions
- [ ] Set up Firebase Functions project
- [ ] Create daily CRON job for expiry checks
- [ ] Create function for low stock alerts
- [ ] Create function for reorder notifications
- [ ] Deploy functions
- [ ] Test notification triggers

---

## 🎯 Medium Priority (Enhance Features)

### Additional Screens
- [ ] Drug detail screen
  - [ ] View all batches
  - [ ] Adjust quantity for each batch
  - [ ] Move batch to different shelf
  - [ ] View supplier info
- [ ] User profile screen
  - [ ] View user info
  - [ ] Logout button
  - [ ] Change password
- [ ] Settings screen
  - [ ] App preferences
  - [ ] Notification settings
- [ ] Notifications history screen
- [ ] Reorder requests screen

### Enhanced Search & Filter
- [ ] Inventory filters bottom sheet
  - [ ] Filter by category
  - [ ] Filter by supplier
  - [ ] Filter by stock status
  - [ ] Filter by expiry date range
- [ ] Inventory sort options
  - [ ] Sort by name (A-Z, Z-A)
  - [ ] Sort by quantity (low to high)
  - [ ] Sort by expiry date
- [ ] Search with debouncing

### Quantity Adjustment UI
- [ ] Create quantity adjustment dialog
- [ ] Add +/- buttons
- [ ] Add reason dropdown
- [ ] Validate input
- [ ] Show confirmation
- [ ] Update inventory on backend

---

## ✨ Low Priority (Polish)

### UI Enhancements
- [ ] Add loading skeletons (shimmer)
- [ ] Add animations (flutter_staggered_animations)
- [ ] Improve error messages
- [ ] Add success animations
- [ ] Add empty state illustrations

### User Experience
- [ ] Add offline mode support
- [ ] Cache data locally
- [ ] Show sync indicators
- [ ] Add haptic feedback
- [ ] Improve accessibility

### Analytics & Reporting
- [ ] Add charts (fl_chart package)
- [ ] Sales analytics screen
- [ ] Inventory reports
- [ ] Export to PDF/Excel

### Additional Features
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] Biometric authentication
- [ ] Receipt printing
- [ ] Batch import via CSV

---

## 🧪 Testing & Deployment

### Testing
- [ ] Write unit tests for repositories
- [ ] Write widget tests for screens
- [ ] Test on real Android device
- [ ] Test camera scanning
- [ ] Test notifications
- [ ] Test offline mode
- [ ] Performance testing

### Deployment
- [ ] Configure app signing
- [ ] Generate release APK
- [ ] Test release build
- [ ] Create app icon
- [ ] Update app name and metadata
- [ ] Publish to Google Play (optional)

---

## 📊 Progress Tracker

**Total Tasks**: ~80
**Completed**: 12 ✅
**In Progress**: 0 🔄
**Remaining**: 68 ⏳

**Completion**: 15%

---

## 🎯 Next Session Goals

Focus on these for maximum impact:

### Session 1: Backend Setup (2-3 hours)
- [ ] Create all backend API routes
- [ ] Test with Postman
- [ ] Document API responses

### Session 2: Flutter Integration (2 hours)
- [ ] Create API service layer
- [ ] Set up providers
- [ ] Connect login screen

### Session 3: Data Flow (1 hour)
- [ ] Connect home screen
- [ ] Connect inventory screen
- [ ] Test end-to-end

### Session 4: Firebase (1-2 hours)
- [ ] Set up Firebase project
- [ ] Implement notifications
- [ ] Test FCM

**Total Estimated Time to MVP**: 6-8 hours

---

## 💡 Quick Wins (Do These First!)

1. **Backend Login API** (30 min)
   - Create auth route
   - Test with Postman
   - Connect Flutter login

2. **Backend Stats API** (20 min)
   - Create stats endpoint
   - Show on home screen

3. **Backend Drugs List** (30 min)
   - Create drugs endpoint
   - Show in inventory

4. **Scanner Lookup** (45 min)
   - Create barcode endpoint
   - Show results after scan

**Time to Demo**: ~2-3 hours! 🚀

---

Good luck! Mark items as you complete them to track your progress! 💪
