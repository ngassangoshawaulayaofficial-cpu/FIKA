import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';

class ProviderDetailsPage extends StatelessWidget {
  final String providerName;
  final double rating;
  final String bio;

  const ProviderDetailsPage({
    super.key,
    required this.providerName,
    required this.rating,
    required this.bio,
  });

  @override
  Widget build(BuildContext context) {
    final timeSlots = ['08:00 AM', '09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

    return Scaffold(
      backgroundColor: FikaColors.background,
      appBar: AppBar(
        title: Text(providerName),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info Card
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: Color(0xFFE5E7EB)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: FikaColors.primaryRoyalBlue,
                      child: Text(
                        providerName.isNotEmpty ? providerName[0].toUpperCase() : 'P',
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(providerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                          const SizedBox(height: 4),
                          const Text('Verified Partner', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              const SizedBox(width: 4),
                              Text('$rating (42 reviews)', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 13)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Bio
            const Text('About', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
            const SizedBox(height: 8),
            Text(
              bio.isNotEmpty ? bio : 'Senior grooming expert with multiple years of verified styling services.',
              style: const TextStyle(color: FikaColors.textSecondary, height: 1.4),
            ),
            const Divider(height: 40),

            // Availability time slots
            const Text('Available Slots Today', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 2.2,
              ),
              itemCount: timeSlots.length,
              itemBuilder: (context, idx) {
                final slot = timeSlots[idx];
                return InkWell(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Selected slot: $slot')),
                    );
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      slot,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: FikaColors.textPrimary),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
