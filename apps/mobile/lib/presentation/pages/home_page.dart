import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'customer_home_page.dart';
import 'provider_home_page.dart';
import 'admin_home_page.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final role = user?.userMetadata?['role'] ?? 'customer';

    if (role == 'admin') {
      return const AdminHomePage();
    } else if (role == 'provider') {
      return const ProviderHomePage();
    } else {
      return const CustomerHomePage();
    }
  }
}
