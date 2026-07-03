import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ProviderProfilePage extends StatefulWidget {
  const ProviderProfilePage({super.key});

  @override
  State<ProviderProfilePage> createState() => _ProviderProfilePageState();
}

class _ProviderProfilePageState extends State<ProviderProfilePage> {
  final _client = Supabase.instance.client;
  final _bioController = TextEditingController();
  final _radiusController = TextEditingController();
  final _serviceNameController = TextEditingController();
  final _servicePriceController = TextEditingController();
  final _serviceDurationController = TextEditingController(text: '30');

  bool _loading = true;
  bool _isVerified = false;
  String _name = '';
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _gallery = [];
  List<Map<String, dynamic>> _categories = [];
  String? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    _loadProviderProfile();
  }

  @override
  void dispose() {
    _bioController.dispose();
    _radiusController.dispose();
    _serviceNameController.dispose();
    _servicePriceController.dispose();
    _serviceDurationController.dispose();
    super.dispose();
  }

  Future<void> _loadProviderProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    // Get public profile name
    final profile = await _client.from('profiles').select().eq('id', user.id).single();
    _name = profile['full_name'] ?? '';

    // Get provider profile info
    final prov = await _client.from('provider_profiles').select().eq('id', user.id).single();
    _bioController.text = prov['bio'] ?? '';
    _radiusController.text = (prov['service_radius_km'] ?? 10.0).toString();
    _isVerified = prov['is_verified'] ?? false;

    // Load categories
    final cats = await _client.from('service_categories').select();
    if (cats != null) {
      _categories = List<Map<String, dynamic>>.from(cats);
      if (_categories.isNotEmpty) {
        _selectedCategoryId = _categories[0]['id'];
      }
    }

    // Load services
    final servs = await _client.from('provider_services').select().eq('provider_id', user.id);
    if (servs != null) {
      _services = List<Map<String, dynamic>>.from(servs);
    }

    // Load gallery portfolio
    final gal = await _client.from('provider_gallery').select().eq('provider_id', user.id);
    if (gal != null) {
      _gallery = List<Map<String, dynamic>>.from(gal);
    }

    setState(() => _loading = false);
  }

  Future<void> _saveSettings() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      await _client.from('provider_profiles').update({
        'bio': _bioController.text,
        'service_radius_km': double.tryParse(_radiusController.text) ?? 10.0,
      }).eq('id', user.id);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addService() async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    if (_serviceNameController.text.isEmpty || _servicePriceController.text.isEmpty || _selectedCategoryId == null) return;

    setState(() => _loading = true);
    try {
      final inserted = await _client.from('provider_services').insert({
        'provider_id': user.id,
        'category_id': _selectedCategoryId,
        'name': _serviceNameController.text,
        'price': double.tryParse(_servicePriceController.text) ?? 0.0,
        'duration_minutes': int.tryParse(_serviceDurationController.text) ?? 30,
      }).select().single();

      setState(() {
        _services.add(inserted);
        _serviceNameController.clear();
        _servicePriceController.clear();
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteService(String id, int index) async {
    setState(() => _loading = true);
    try {
      await _client.from('provider_services').delete().eq('id', id);
      setState(() {
        _services.removeAt(index);
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
        title: const Text('My Services & Portfolio'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading && _name.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Professional: $_name', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    _isVerified ? '🟢 Verified Account' : '⏳ Pending verification approval',
                    style: TextStyle(color: _isVerified ? Colors.green : FikaColors.accentGold, fontWeight: FontWeight.bold),
                  ),
                  const Divider(height: 32),

                  // Info setup
                  const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _bioController,
                    decoration: const InputDecoration(labelText: 'Short Professional Bio', border: OutlineInputBorder()),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _radiusController,
                    decoration: const InputDecoration(labelText: 'Service Radius (km)', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _saveSettings,
                    style: ElevatedButton.styleFrom(backgroundColor: FikaColors.primaryRoyalBlue),
                    child: const Text('Save Settings', style: TextStyle(color: Colors.white)),
                  ),
                  const Divider(height: 32),

                  // Services menu list
                  const Text('Services List', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: FikaColors.primaryRoyalBlue)),
                  const SizedBox(height: 12),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _services.length,
                    itemBuilder: (context, idx) {
                      final s = _services[idx];
                      return Card(
                        child: ListTile(
                          title: Text(s['name'] ?? ''),
                          subtitle: Text('${s['duration_minutes']} mins'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('TZS ${s['price']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _deleteService(s['id'], idx),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 32),

                  // Add Service Menu item
                  const Text('Add Service Item', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _serviceNameController,
                    decoration: const InputDecoration(labelText: 'Service Name', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _servicePriceController,
                    decoration: const InputDecoration(labelText: 'Price (TZS)', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _selectedCategoryId,
                    decoration: const InputDecoration(labelText: 'Service Category', border: OutlineInputBorder()),
                    items: _categories.map((cat) {
                      return DropdownMenuItem<String>(
                        value: cat['id'],
                        child: Text(cat['name'] ?? ''),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedCategoryId = val),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _addService,
                    style: ElevatedButton.styleFrom(backgroundColor: FikaColors.accentGold),
                    child: const Text('Add Service', style: TextStyle(color: Colors.black)),
                  ),
                ],
              ),
            ),
    );
  }
}
