import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class CustomerPaymentsPage extends StatefulWidget {
  const CustomerPaymentsPage({super.key});

  @override
  State<CustomerPaymentsPage> createState() => _CustomerPaymentsPageState();
}

class _CustomerPaymentsPageState extends State<CustomerPaymentsPage> {
  final _client = Supabase.instance.client;
  List<Map<String, dynamic>> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      final data = await _client
          .from('payments')
          .select('*, bookings(scheduled_time, profiles!bookings_provider_id_fkey(full_name))')
          .order('created_at', ascending: false);

      if (data != null) {
        _payments = List<Map<String, dynamic>>.from(data);
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
        title: const Text('Payment Receipts'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _payments.isEmpty
              ? const Center(child: Text('No transaction history.', style: TextStyle(color: FikaColors.textSecondary)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _payments.length,
                  itemBuilder: (context, idx) {
                    final p = _payments[idx];
                    final booking = p['bookings'];
                    final provider = booking?['profiles'];
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
                                  provider?['full_name'] ?? 'Grooming Expert',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: p['status'] == 'completed' ? Colors.green.shade100 : Colors.amber.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    (p['status'] as String).toUpperCase(),
                                    style: TextStyle(
                                      color: p['status'] == 'completed' ? Colors.green.shade900 : Colors.amber.shade900,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Channel: ${p['payment_method'] ?? 'mpesa_tz'}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('Transaction ID: ${p['transaction_id'] ?? 'Pending'}', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 14)),
                            const SizedBox(height: 8),
                            Text(
                              'Amount: TZS ${p['amount']}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: FikaColors.primaryRoyalBlue, fontSize: 16),
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
