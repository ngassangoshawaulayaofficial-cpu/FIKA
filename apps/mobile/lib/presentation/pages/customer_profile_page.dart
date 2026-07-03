import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class CustomerProfilePage extends StatefulWidget {
  const CustomerProfilePage({super.key});

  @override
  State<CustomerProfilePage> createState() => _CustomerProfilePageState();
}

class _CustomerProfilePageState extends State<CustomerProfilePage> {
  final _client = Supabase.instance.client;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _labelController = TextEditingController();
  final _addressController = TextEditingController();

  bool _loading = true;
  String _email = '';
  List<Map<String, dynamic>> _addresses = [];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _labelController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    _email = user.email ?? '';

    // Load profile
    final profile = await _client.from('profiles').select().eq('id', user.id).single();
    _nameController.text = profile['full_name'] ?? '';
    _phoneController.text = profile['phone'] ?? '';

    // Load addresses
    final addrs = await _client.from('saved_addresses').select().eq('customer_id', user.id);
    if (addrs != null) {
      _addresses = List<Map<String, dynamic>>.from(addrs);
    }

    setState(() => _loading = false);
  }

  Future<void> _saveProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      await _client.from('profiles').update({
        'full_name': _nameController.text,
        'phone': _phoneController.text,
      }).eq('id', user.id);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile saved successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addAddress() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    if (_labelController.text.isEmpty || _addressController.text.isEmpty) return;

    setState(() => _loading = true);
    try {
      final inserted = await _client.from('saved_addresses').insert({
        'customer_id': user.id,
        'label': _labelController.text,
        'address': _addressController.text,
        'latitude': -6.7924,
        'longitude': 39.2083,
      }).select().single();

      setState(() {
        _addresses.add(inserted);
        _labelController.clear();
        _addressController.clear();
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteAddress(String id, int index) async {
    setState(() => _loading = true);
    try {
      await _client.from('saved_addresses').delete().eq('id', id);
      setState(() {
        _addresses.removeAt(index);
      });
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
        title: const Text('My Profile'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading && _email.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Profile details
                  const Text('Personal Info', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  Text('Email: $_email', style: const TextStyle(color: FikaColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _saveProfile,
                    style: ElevatedButton.styleFrom(backgroundColor: FikaColors.primaryRoyalBlue),
                    child: const Text('Save Info', style: TextStyle(color: Colors.white)),
                  ),
                  const Divider(height: 48),

                  // Addresses Section
                  const Text('Saved Addresses', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 16),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _addresses.length,
                    itemBuilder: (context, idx) {
                      final addr = _addresses[idx];
                      return Card(
                        child: ListTile(
                          title: Text(addr['label'] ?? ''),
                          subtitle: Text(addr['address'] ?? ''),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () => _deleteAddress(addr['id'], idx),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  const Text('Add New Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _labelController,
                    decoration: const InputDecoration(labelText: 'Label (e.g. Home, Office)', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _addressController,
                    decoration: const InputDecoration(labelText: 'Delivery Address in Dar es Salaam', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _addAddress,
                    style: ElevatedButton.styleFrom(backgroundColor: FikaColors.accentGold),
                    child: const Text('Add Address', style: TextStyle(color: Colors.black)),
                  ),
                ],
              ),
            ),
    );
  }
}
