import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:pharma_care/core/theme/app_theme.dart';
import 'package:pharma_care/core/constants/app_strings.dart';
import 'package:pharma_care/presentation/screens/auth/login_screen.dart';
import 'package:pharma_care/data/services/firebase_messaging_service.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Initialize Firebase
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    print('✅ Firebase initialized successfully');

    // Initialize Firebase Messaging (non-blocking)
    FirebaseMessagingService.instance.initialize().then((_) {
      print('✅ Firebase Messaging initialized successfully');
    }).catchError((e) {
      print('⚠️ Firebase Messaging initialization error: $e');
    });
  } catch (e) {
    print('⚠️ Firebase initialization error: $e');
    print('⚠️ App will continue without push notifications');
  }

  runApp(const DrugDeskApp());
}

class DrugDeskApp extends StatelessWidget {
  const DrugDeskApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const LoginScreen(),
    );
  }
}
