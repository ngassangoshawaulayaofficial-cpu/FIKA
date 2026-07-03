import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';
import 'review_form_page.dart';

class CustomerBookingsPage extends StatefulWidget {
  const CustomerBookingsPage({super.key});

  @override
  State<CustomerBookingsPage> createState() => _CustomerBookingsPageState();
}

class _CustomerBookingsPageState extends State<CustomerBookingsPage> {
  final _client = Supabase.instance.client;
  List<Map<String, dynamic>> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      final data = await _client
          .from('bookings')
          .select('*, profiles!bookings_provider_id_fkey(full_name), reviews(id)')
          .eq('customer_id', user.id)
          .order('scheduled_time', ascending: true);

      if (data != null) {
        _bookings = List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FikaColors.background,
      appBar: AppBar(
        title: const Text('My Bookings'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _bookings.isEmpty
              ? const Center(child: Text('No bookings found.', style: TextStyle(color: FikaColors.textSecondary)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _bookings.length,
                  itemBuilder: (context, idx) {
                    final bk = _bookings[idx];
                    final provider = bk['profiles'];
                    final reviews = bk['reviews'] as List?;
                    final hasReview = reviews != null && reviews.isNotEmpty;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Text(
                                  provider?['full_name'] ?? 'Professional',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: bk['status'] == 'completed' ? Colors.green.shade100 : Colors.amber.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    (bk['status'] as String).toUpperCase(),
                                    style: TextStyle(
                                      color: bk['status'] == 'completed' ? Colors.green.shade900 : Colors.amber.shade900,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Address: ${bk['address']}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('Time: ${bk['scheduled_time']}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Text(
                                  'Price: TZS ${bk['total_price']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: FikaColors.primaryRoyalBlue),
                                ),
                                if (bk['status'] == 'completed') ...[
                                  if (hasReview)
                                    const Text('✓ Reviewed', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold))
                                  else
                                    ElevatedButton(
                                      onPressed: () async {
                                        final refetched = await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => ReviewFormPage(
                                              bookingId: bk['id'],
                                              providerId: bk['provider_id'],
                                              providerName: provider?['full_name'] ?? 'Professional',
                                            ),
                                          ),
                                        );
                                        if (refetched == true) {
                                          _loadBookings();
                                        }
                                      },
                                      style: ElevatedButton.styleFrom(backgroundColor: FikaColors.accentGold),
                                      child: const Text('Rate Pro', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                                    ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
