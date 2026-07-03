import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ProviderHomePage extends StatefulWidget {
  const ProviderHomePage({super.key});

  @override
  State<ProviderHomePage> createState() => _ProviderHomePageState();
}

class _ProviderHomePageState extends State<ProviderHomePage> {
  final _client = Supabase.instance.client;
  bool _isOnline = false;
  bool _isVerified = true;
  String _providerName = 'Professional Groomer';
  double _walletBalance = 120000.0;
  int _completedJobs = 8;
  double _rating = 4.9;

  bool _loading = true;
  List<Map<String, dynamic>> _todayBookings = [];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      // 1. Load name
      final profile = await _client.from('profiles').select().eq('id', user.id).single();
      _providerName = profile['full_name'] ?? 'Professional';

      // 2. Load provider info
      final prov = await _client.from('provider_profiles').select().eq('id', user.id).single();
      _isOnline = prov['is_online'] ?? false;
      _isVerified = prov['is_verified'] ?? false;
      _rating = (prov['rating_avg'] ?? 4.9).toDouble();
      _completedJobs = prov['rating_count'] ?? 8;

      // 3. Load wallet balance (mocked as total earnings * 0.70)
      final bookingsData = await _client
          .from('bookings')
          .select('provider_earnings')
          .eq('provider_id', user.id)
          .eq('status', 'completed');
      if (bookingsData != null) {
        final totalEarned = (bookingsData as List).fold<double>(
          0.0,
          (sum, item) => sum + (item['provider_earnings'] as num).toDouble(),
        );
        _walletBalance = totalEarned * 0.70;
      }

      // 4. Load today's upcoming bookings
      final todayData = await _client
          .from('bookings')
          .select('*, profiles!bookings_customer_id_fkey(full_name)')
          .eq('provider_id', user.id)
          .order('scheduled_time', ascending: true);

      if (todayData != null) {
        _todayBookings = List<Map<String, dynamic>>.from(todayData);
      }
    } catch (e) {
      // Mock today's bookings
      _todayBookings = [
        {'id': '1', 'status': 'confirmed', 'scheduled_time': 'Today, 2:30 PM', 'address': 'Upanga, Dar es Salaam', 'total_price': 25000, 'profiles': {'full_name': 'David Minja'}},
      ];
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _toggleOnline(bool val) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() {
      _isOnline = val;
    });

    try {
      await _client.from('provider_profiles').update({'is_online': val}).eq('id', user.id);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FikaColors.background,
      appBar: AppBar(
        title: const Text('Provider Portal'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.book_online_outlined),
            onPressed: () => Navigator.pushNamed(context, '/provider-bookings'),
          ),
          IconButton(
            icon: const Icon(Icons.design_services),
            onPressed: () => Navigator.pushNamed(context, '/provider-profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Greeting & Status Switch
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Hello, $_providerName', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                          const SizedBox(height: 4),
                          Text(_isVerified ? '🟢 Verified Partner' : '⏳ Verification Pending', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 13)),
                        ],
                      ),
                      Switch(
                        value: _isOnline,
                        activeColor: FikaColors.primaryRoyalBlue,
                        onChanged: _toggleOnline,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Analytics Cards Grid
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard('Wallet Balance', 'TZS ${_walletBalance.toInt()}', Colors.green),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildMetricCard('Completed Jobs', '$_completedJobs', FikaColors.primaryRoyalBlue),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard('Rating Score', '$_rating ★', Colors.orange),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildMetricCard('Est. Earnings', 'TZS ${(completedEarnings()).toInt()}', FikaColors.accentGold),
                      ),
                    ],
                  ),
                  const Divider(height: 48),

                  // Quick Navigation Options
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildQuickNavButton(context, Icons.cut, 'Catalog', '/provider-profile'),
                      _buildQuickNavButton(context, Icons.calendar_month, 'Schedule', '/provider-bookings'),
                    ],
                  ),
                  const Divider(height: 48),

                  // Today's Bookings
                  const Text('Upcoming Requests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 12),
                  _todayBookings.isEmpty
                      ? const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('No appointments booked.', style: TextStyle(color: FikaColors.textSecondary))))
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _todayBookings.length,
                          itemBuilder: (context, idx) {
                            final b = _todayBookings[idx];
                            final client = b['profiles'];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                title: Text(client?['full_name'] ?? b['customer_name'] ?? 'Client'),
                                subtitle: Text('Time: ${b['scheduled_time']} | Address: ${b['address']}'),
                                trailing: const Icon(Icons.chevron_right, color: FikaColors.primaryRoyalBlue),
                                onTap: () => Navigator.pushNamed(context, '/provider-bookings'),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
    );
  }

  double completedEarnings() {
    return _walletBalance / 0.70;
  }

  Widget _buildMetricCard(String label, String value, Color color) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: FikaColors.textSecondary)),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickNavButton(BuildContext context, IconData icon, String label, String route) {
    return Column(
      children: [
        IconButton(
          icon: Icon(icon, size: 32, color: FikaColors.primaryRoyalBlue),
          onPressed: () => Navigator.pushNamed(context, route),
        ),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}
