import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final _client = Supabase.instance.client;
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  RealtimeChannel? _subscription;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    if (_subscription != null) {
      _client.removeChannel(_subscription!);
    }
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      final data = await _client
          .from('notifications')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (data != null) {
        _notifications = List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  void _subscribeRealtime() {
    final user = _client.auth.currentUser;
    if (user == null) return;

    _subscription = _client
        .channel('realtime-notifications')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          callback: (payload) {
            final newNotification = payload.newRecord;
            if (newNotification['user_id'] == user.id) {
              setState(() {
                _notifications.insert(0, newNotification);
              });
            }
          },
        )
        .subscribe();
  }

  Future<void> _markAllRead() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      await _client.from('notifications').update({'is_read': true}).eq('user_id', user.id);
      setState(() {
        for (var n in _notifications) {
          n['is_read'] = true;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read')),
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
        title: const Text('Notifications'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: _markAllRead,
            tooltip: 'Mark all as read',
          ),
        ],
      ),
      body: _loading && _notifications.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(child: Text('Your inbox is empty.', style: TextStyle(color: FikaColors.textSecondary)))
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, idx) {
                      final n = _notifications[idx];
                      final isRead = n['is_read'] as bool? ?? false;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        color: isRead ? Colors.white : const Color(0xFFF0FDF4),
                        shape: RoundedRectangleBorder(
                          side: BorderSide(
                            color: isRead ? const Color(0xFFE5E7EB) : const Color(0xFF10B981),
                            width: isRead ? 1.0 : 2.0,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: ListTile(
                          title: Text(n['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(n['message'] ?? '', style: const TextStyle(color: FikaColors.textSecondary)),
                              const SizedBox(height: 6),
                              Text(n['created_at'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 10)),
                            ],
                          ),
                          leading: Icon(
                            n['type'] == 'booking' ? Icons.book_online : Icons.notifications,
                            color: FikaColors.primaryRoyalBlue,
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
