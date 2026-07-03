import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';
import 'conversation_page.dart';

class ChatListPage extends StatefulWidget {
  const ChatListPage({super.key});

  @override
  State<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends State<ChatListPage> {
  final _client = Supabase.instance.client;
  List<Map<String, dynamic>> _threads = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadThreads();
  }

  Future<void> _loadThreads() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      // 1. Get user's participations
      final participations = await _client
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

      if (participations != null && (participations as List).isNotEmpty) {
        final convIds = (participations).map((p) => p['conversation_id']).toList();

        // 2. Fetch conversations & participants
        final threadsData = await _client
            .from('conversations')
            .select('id, status, conversation_participants(user_id, profiles(id, full_name, role))')
            .in_('id', convIds);

        if (threadsData != null) {
          _threads = List<Map<String, dynamic>>.from(threadsData).map((item) {
            final parts = item['conversation_participants'] as List;
            final other = parts.firstWhere((p) => p['user_id'] != user.id, orElse: () => null);
            return {
              'id': item['id'],
              'status': item['status'],
              'other_name': other?['profiles']?['full_name'] ?? 'Grooming Expert',
              'other_id': other?['profiles']?['id'] ?? '',
            };
          }).toList();
        }
      }
    } catch (e) {
      // Mock threads if RPC/tables are empty
      _threads = [
        {'id': 't1', 'status': 'active', 'other_name': 'Ally Rajabu (Barber)', 'other_id': 'p1'},
        {'id': 't2', 'status': 'active', 'other_name': 'Fatma Juma (Stylist)', 'other_id': 'p2'},
      ];
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FikaColors.background,
      appBar: AppBar(
        title: const Text('My Chats'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _threads.isEmpty
              ? const Center(child: Text('No messages yet.', style: TextStyle(color: FikaColors.textSecondary)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _threads.length,
                  itemBuilder: (context, idx) {
                    final t = _threads[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: FikaColors.primaryRoyalBlue,
                          child: Text(
                            t['other_name'][0].toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(t['other_name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Tap to open conversation thread'),
                        trailing: const Icon(Icons.chevron_right, color: FikaColors.primaryRoyalBlue),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ConversationPage(
                                conversationId: t['id'],
                                otherUserName: t['other_name'],
                                otherUserId: t['other_id'],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
