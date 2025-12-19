# DrugDesk Mobile App

A Flutter mobile application for pharmacy inventory management with real-time alerts and barcode scanning.

## 🚀 Quick Start

### Prerequisites
- Flutter SDK (installed ✅)
- Android Studio / VS Code
- Node.js backend running (see backend setup)

### Run the App
```bash
# Install dependencies
flutter pub get

# Run on Android device/emulator
flutter run
```

## 📱 Features

### ✅ Implemented
- **Login Authentication** - Secure user login (ready for API)
- **Dashboard** - Real-time stats and alerts overview
- **Inventory Management** - Search and view medicine stock
- **Barcode Scanner** - Scan medicines to check location and quantity
- **Smart Alerts** - Color-coded notifications for expiry and stock levels

### 🔄 Coming Soon
- Push notifications via Firebase
- Quantity adjustment
- Advanced filters and sorting
- Real-time data sync

## 📂 Project Structure

```
lib/
├── core/               # Constants, theme, utilities
├── data/               # Models, services, repositories
├── presentation/       # UI screens and widgets
└── routes/             # Navigation

Key Files:
├── SETUP_GUIDE.md     # Detailed setup instructions
├── PROJECT_SUMMARY.md # Complete feature overview
└── CHECKLIST.md       # Development checklist
```

## 🔧 Configuration

### API Base URL
Update your backend URL in `lib/core/constants/api_constants.dart`:

```dart
static const String baseUrl = 'http://YOUR_IP:3000/api';
```

**For Android Emulator**: Use `http://10.0.2.2:3000/api`
**For Real Device**: Use your computer's IP address

### Firebase (Optional - for notifications)
1. Add `google-services.json` to `android/app/`
2. Run `flutterfire configure`
3. See `SETUP_GUIDE.md` for details

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step setup for backend, Firebase, and API integration
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete overview of features and architecture
- **[CHECKLIST.md](./CHECKLIST.md)** - Development task checklist

## 🎯 Next Steps

1. **Build Backend API** (Critical)
   - See `SETUP_GUIDE.md` Section 1
   - Create auth, drugs, alerts, and stats endpoints

2. **Connect to Backend**
   - Update API base URL
   - Create API service layer
   - Test login and data flow

3. **Set Up Firebase** (For notifications)
   - Create Firebase project
   - Add `google-services.json`
   - Initialize FCM

## 🛠️ Development Commands

```bash
# Install dependencies
flutter pub get

# Run app
flutter run

# Build APK
flutter build apk

# Clean build
flutter clean

# Analyze code
flutter analyze

# Run tests
flutter test

# Generate JSON serialization
flutter pub run build_runner build --delete-conflicting-outputs
```

## 📦 Dependencies

- **provider** - State management
- **dio** - HTTP client
- **retrofit** - Type-safe API calls
- **firebase_messaging** - Push notifications
- **mobile_scanner** - Barcode scanning
- **cached_network_image** - Image caching
- **shimmer** - Loading animations

## 🎨 Design

- **Material Design 3**
- **Color Scheme**: Professional blue and green
- **Responsive layouts**
- **Dark mode ready** (to be implemented)

## 📱 Screenshots

_Coming soon - Run the app to see the beautiful UI!_

## 🤝 Contributing

This is a private project. For issues or questions, refer to the documentation files.

## 📄 License

Private/Proprietary

---

**Built with ❤️ using Flutter**

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
