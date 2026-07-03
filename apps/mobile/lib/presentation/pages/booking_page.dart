import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class BookingPage extends StatefulWidget {
  final String providerId;
  final String providerName;
  final String serviceId;
  final String serviceName;
  final double price;
  final String timeSlot;

  const BookingPage({
    super.key,
    required this.providerId,
    required this.providerName,
    required this.serviceId,
    required this.serviceName,
    required this.price,
    required this.timeSlot,
  });

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  final _client = Supabase.instance.client;
  final _addressController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submitBooking() async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    if (_addressController.text.isEmpty) return;

    setState(() => _loading = true);

    try {
      final total = widget.price;
      final commission = total * 0.15;
      final earnings = total * 0.85;

      final scheduledTimestamp = DateTime.now().add(const Duration(days: 1)).toIso8601String(); // mock date tomorrow

      // 1. Create Booking
      final booking = await _client.from('bookings').insert({
        'customer_id': user.id,
        'provider_id': widget.providerId,
        'status': 'pending_payment',
        'scheduled_time': scheduledTimestamp,
        'address': _addressController.text,
        'latitude': -6.7924,
        'longitude': 39.2083,
        'total_price': total,
        'commission_fee': commission,
        'provider_earnings': earnings,
      }).select().single();

      // 2. Add Booking Service relationship
      await _client.from('booking_services').insert({
        'booking_id': booking['id'],
        'service_id': widget.serviceId,
        'price': total,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking created successfully! Redirecting to pay...')),
      );

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Booking error: $e')),
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
        title: const Text('Checkout Booking'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              const Text('Professional'),
                              Text(widget.providerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              const Text('Service'),
                              Text(widget.serviceName, style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              const Text('Schedule'),
                              Text(widget.timeSlot, style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              const Text('Total Price'),
                              Text('TZS ${widget.price}', style: const TextStyle(fontWeight: FontWeight.bold, color: FikaColors.primaryRoyalBlue)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 48),

                  const Text('Delivery Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      labelText: 'Dar es Salaam Delivery Address',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_on),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 32),

                  ElevatedButton(
                    onPressed: _submitBooking,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: FikaColors.primaryRoyalBlue,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Confirm & Book Now', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
    );
  }
}
