import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ProviderBookingsPage extends StatefulWidget {
  const ProviderBookingsPage({super.key});

  @override
  State<ProviderBookingsPage> createState() => _ProviderBookingsPageState();
}

class _ProviderBookingsPageState extends State<ProviderBookingsPage> {
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
          .select('*, profiles!bookings_customer_id_fkey(full_name, phone)')
          .eq('provider_id', user.id)
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

  Future<void> _updateStatus(String bookingId, String newStatus, int index) async {
    setState(() => _loading = true);
    try {
      await _client.from('bookings').update({'status': newStatus}).eq('id', bookingId);
      setState(() {
        _bookings[index]['status'] = newStatus;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Booking marked as $newStatus')),
      );
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
        title: const Text('Client Requests'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _bookings.isEmpty
              ? const Center(child: Text('No bookings requests found.', style: TextStyle(color: FikaColors.textSecondary)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _bookings.length,
                  itemBuilder: (context, idx) {
                    final bk = _bookings[idx];
                    final customer = bk['profiles'];
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
                                  customer?['full_name'] ?? 'Client',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: bk['status'] == 'confirmed' ? Colors.green.shade100 : Colors.amber.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    (bk['status'] as String).toUpperCase(),
                                    style: TextStyle(
                                      color: bk['status'] == 'confirmed' ? Colors.green.shade900 : Colors.amber.shade900,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Phone: ${customer?['phone'] ?? 'N/A'}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('Location: ${bk['address']}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('Scheduled: ${bk['scheduled_time']}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 8),
                            Text(
                              'Price: TZS ${bk['total_price']}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: FikaColors.primaryRoyalBlue),
                            ),
                            const SizedBox(height: 16),

                            // Actions
                            if (bk['status'] == 'confirmed') ...[
                              Row(
                                children: [
                                  ElevatedButton(
                                    onPressed: () => _updateStatus(bk['id'], 'in_progress', idx),
                                    style: ElevatedButton.styleFrom(backgroundColor: FikaColors.primaryRoyalBlue),
                                    child: const Text('Start Service', style: TextStyle(color: Colors.white)),
                                  ),
                                  const SizedBox(width: 12),
                                  OutlinedButton(
                                    onPressed: () => _updateStatus(bk['id'], 'cancelled', idx),
                                    style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                                    child: const Text('Decline'),
                                  ),
                                ],
                              ),
                            ],
                            if (bk['status'] == 'in_progress') ...[
                              ElevatedButton(
                                onPressed: () => _updateStatus(bk['id'], 'completed', idx),
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                                child: const Text('Complete Service', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
