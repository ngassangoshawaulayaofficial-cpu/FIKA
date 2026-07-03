import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import 'provider_details_page.dart';
import 'map_search_page.dart';

class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({super.key});

  @override
  State<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends State<CustomerHomePage> {
  double _distanceRadius = 15.0;
  String? _selectedCategory;
  double _walletBalance = 45000.0;
  int _activeBookings = 1;
  int _favoriteStylists = 2;

  final List<Map<String, dynamic>> _providers = [
    {
      'id': '1',
      'name': 'Ally Rajabu',
      'category': 'barber',
      'bio': 'Expert fades and beard trimming.',
      'rating': 4.9,
      'distance': 1.2,
      'latitude': -6.7915,
      'longitude': 39.2090
    },
    {
      'id': '2',
      'name': 'Fatma Juma',
      'category': 'hairstylist',
      'bio': 'Premium hair styling & braiding.',
      'rating': 4.8,
      'distance': 4.5,
      'latitude': -6.7850,
      'longitude': 39.2150
    },
    {
      'id': '3',
      'name': 'Hamis Selemani',
      'category': 'braider',
      'bio': 'Mobile clean styling haircuts.',
      'rating': 4.7,
      'distance': 8.9,
      'latitude': -6.8120,
      'longitude': 39.1980
    },
  ];

  @override
  Widget build(BuildContext context) {
    // Filter list
    final filtered = _providers.where((p) {
      final matchesCat = _selectedCategory == null || p['category'] == _selectedCategory;
      final matchesDist = p['distance'] <= _distanceRadius;
      return matchesCat && matchesDist;
    }).toList();

    return Scaffold(
      backgroundColor: FikaColors.background,
      appBar: AppBar(
        title: const Text('FIKA Home'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => Navigator.pushNamed(context, '/chats'),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_active_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            onPressed: () => Navigator.pushNamed(context, '/customer-payments'),
          ),
          IconButton(
            icon: const Icon(Icons.book_online_outlined),
            onPressed: () => Navigator.pushNamed(context, '/customer-bookings'),
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => Navigator.pushNamed(context, '/customer-profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MapSearchPage(providers: filtered),
            ),
          );
        },
        backgroundColor: FikaColors.accentGold,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.map_outlined),
        label: const Text('Map View', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // KPI metrics summaries
            Row(
              children: [
                Expanded(child: _buildMetricCard('Wallet Balance', 'TZS ${_walletBalance.toInt()}', Colors.green)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Active Tasks', '$_activeBookings session', FikaColors.primaryRoyalBlue)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Favorites', '$_favoriteStylists pros', FikaColors.accentGold)),
              ],
            ),
            const Divider(height: 36),

            // Category selectors
            const Text('Categories', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildCategoryChip('All', null),
                  const SizedBox(width: 8),
                  _buildCategoryChip('Barber', 'barber'),
                  const SizedBox(width: 8),
                  _buildCategoryChip('Stylist', 'hairstylist'),
                  const SizedBox(width: 8),
                  _buildCategoryChip('Braider', 'braider'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Distance slider
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text('Search Radius', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('${_distanceRadius.toInt()} km', style: const TextStyle(fontWeight: FontWeight.bold, color: FikaColors.primaryRoyalBlue)),
              ],
            ),
            Slider(
              min: 1.0,
              max: 50.0,
              value: _distanceRadius,
              activeColor: FikaColors.primaryRoyalBlue,
              inactiveColor: const Color(0xFFE5E7EB),
              onChanged: (val) {
                setState(() {
                  _distanceRadius = val;
                });
              },
            ),
            const SizedBox(height: 24),

            // Providers List
            const Text('Grooming Experts Nearby', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
            const SizedBox(height: 12),
            filtered.isEmpty
                ? const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No active professionals in this range.', style: TextStyle(color: FikaColors.textSecondary))))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filtered.length,
                    itemBuilder: (context, idx) {
                      final p = filtered[idx];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          side: const BorderSide(color: Color(0xFFE5E7EB)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          title: Row(
                            children: [
                              Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(width: 8),
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              const SizedBox(width: 4),
                              Text('${p['rating']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 6),
                              Text(p['bio'] ?? '', style: const TextStyle(color: FikaColors.textSecondary, fontSize: 13)),
                              const SizedBox(height: 8),
                              Text('📍 ${p['distance']} km away', style: const TextStyle(fontWeight: FontWeight.bold, color: FikaColors.primaryRoyalBlue, fontSize: 12)),
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right, color: FikaColors.primaryRoyalBlue),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ProviderDetailsPage(
                                  providerName: p['name'],
                                  rating: p['rating'],
                                  bio: p['bio'],
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, Color color) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: FikaColors.textSecondary)),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String label, String? categoryValue) {
    final isSelected = _selectedCategory == categoryValue;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedCategory = selected ? categoryValue : null;
        });
      },
      selectedColor: FikaColors.primaryRoyalBlue,
      textColor: isSelected ? Colors.white : FikaColors.textPrimary,
    );
  }
}
