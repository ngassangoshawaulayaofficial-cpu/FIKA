import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/theme/colors.dart';
import 'core/theme/typography.dart';
import 'presentation/pages/login_page.dart';
import 'presentation/pages/home_page.dart';
import 'presentation/pages/register_page.dart';
import 'presentation/pages/forgot_password_page.dart';
import 'presentation/pages/customer_profile_page.dart';
import 'presentation/pages/provider_profile_page.dart';
import 'presentation/pages/customer_bookings_page.dart';
import 'presentation/pages/provider_bookings_page.dart';
import 'presentation/pages/customer_payments_page.dart';
import 'presentation/pages/notifications_page.dart';
import 'presentation/pages/chat_list_page.dart';
import 'presentation/pages/admin_home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://your-supabase-project.supabase.co',
    anonKey: 'your-anon-key',
  );

  runApp(const FikaApp());
}

class FikaApp extends StatelessWidget {
  const FikaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FIKA Grooming',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: FikaColors.primaryRoyalBlue,
        colorScheme: ColorScheme.fromSwatch().copyWith(
          primary: FikaColors.primaryRoyalBlue,
          secondary: FikaColors.accentGold,
        ),
        textTheme: FikaTypography.textTheme,
        useMaterial3: true,
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/forgot-password': (context) => const ForgotPasswordPage(),
        '/home': (context) => const HomePage(),
        '/customer-profile': (context) => const CustomerProfilePage(),
        '/provider-profile': (context) => const ProviderProfilePage(),
        '/customer-bookings': (context) => const CustomerBookingsPage(),
        '/provider-bookings': (context) => const ProviderBookingsPage(),
        '/customer-payments': (context) => const CustomerPaymentsPage(),
        '/notifications': (context) => const NotificationsPage(),
        '/chats': (context) => const ChatListPage(),
        '/admin-home': (context) => const AdminHomePage(),
      },
    );
  }
}
