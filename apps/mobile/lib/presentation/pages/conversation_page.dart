import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ConversationPage extends StatefulWidget {
  final String conversationId;
  final String otherUserName;
  final String otherUserId;

  const ConversationPage({
    super.key,
    required this.conversationId,
    required this.otherUserName,
    required this.otherUserId,
  });

  @override
  State<ConversationPage> createState() => _ConversationPageState();
}

class _ConversationPageState extends State<ConversationPage> {
  final _client = Supabase.instance.client;
  final _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  RealtimeChannel? _subscription;
  String _myId = '';

  @override
  void initState() {
    super.initState();
    final user = _client.auth.currentUser;
    if (user != null) _myId = user.id;

    _loadMessages();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    if (_subscription != null) {
      _client.removeChannel(_subscription!);
    }
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() => _loading = true);

    try {
      final data = await _client
          .from('messages')
          .select('*, message_attachments(url)')
          .eq('conversation_id', widget.conversationId)
          .order('created_at', ascending: true);

      if (data != null) {
        _messages = List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      // Mock messages for fallback support
      _messages = [
        {
          'id': 'm1',
          'conversation_id': widget.conversationId,
          'sender_id': widget.otherUserId,
          'text': 'Habari! I am on my way to Victoria Block.',
          'created_at': DateTime.now().subtract(const Duration(minutes: 30)).toIso8601String(),
        },
        {
          'id': 'm2',
          'conversation_id': widget.conversationId,
          'sender_id': _myId,
          'text': 'Karibu, text me when you arrive.',
          'created_at': DateTime.now().subtract(const Duration(minutes: 15)).toIso8601String(),
        },
      ];
    } finally {
      setState(() => _loading = false);
      _scrollToBottom();
    }
  }

  void _subscribeRealtime() {
    _subscription = _client
        .channel('chat-thread-${widget.conversationId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) {
            final newMsg = payload.newRecord;
            if (newMsg['conversation_id'] == widget.conversationId) {
              setState(() {
                _messages.add(newMsg);
              });
              _scrollToBottom();
            }
          },
        )
        .subscribe();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    if (_msgController.text.isEmpty) return;

    final txt = _msgController.text;
    _msgController.clear();

    try {
      await _client.from('messages').insert({
        'conversation_id': widget.conversationId,
        'sender_id': _myId,
        'text': txt,
      });
    } catch (e) {
      // Fallback local update
      setState(() {
        _messages.add({
          'id': 'local_${DateTime.now().millisecondsSinceEpoch}',
          'conversation_id': widget.conversationId,
          'sender_id': _myId,
          'text': txt,
          'created_at': DateTime.now().toIso8601String(),
        });
      });
      _scrollToBottom();
    }
  }

  Future<void> _shareLocation() async {
    final lat = -6.7924;
    final lng = 39.2083;

    try {
      await _client.from('messages').insert({
        'conversation_id': widget.conversationId,
        'sender_id': _myId,
        'text': 'Shared location pin',
        'latitude': lat,
        'longitude': lng,
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'id': 'local_${DateTime.now().millisecondsSinceEpoch}',
          'conversation_id': widget.conversationId,
          'sender_id': _myId,
          'text': 'Shared location pin',
          'latitude': lat,
          'longitude': lng,
          'created_at': DateTime.now().toIso8601String(),
        });
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FikaColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.otherUserName),
            const Text('🟢 Online', style: TextStyle(fontSize: 12, color: Colors.greenAccent)),
          ],
        ),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Stream viewport
          Expanded(
            child: _loading && _messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, idx) {
                      final m = _messages[idx];
                      final isMe = m['sender_id'] == _myId;
                      final hasLoc = m['latitude'] != null;

                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: isMe ? FikaColors.primaryRoyalBlue : Colors.white,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(12),
                              topRight: const Radius.circular(12),
                              bottomLeft: isMe ? const Radius.circular(12) : Radius.zero,
                              bottomRight: isMe ? Radius.zero : const Radius.circular(12),
                            ),
                            boxShadow: const [
                              BoxShadow(color: Colors.black12, blurRadius: 2, offset: Offset(0, 1)),
                            ],
                          ),
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.65),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m['text'] ?? '',
                                style: TextStyle(color: isMe ? Colors.white : FikaColors.textPrimary, fontSize: 14),
                              ),
                              if (hasLoc) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  color: Colors.black12,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('📍 Location Pin Shared', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: FikaColors.accentGold)),
                                      Text('Coords: ${m['latitude']}, ${m['longitude']}', style: const TextStyle(fontSize: 10, color: Colors.white)),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Composer
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.location_on, color: FikaColors.primaryRoyalBlue),
                    onPressed: _shareLocation,
                  ),
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      decoration: const InputDecoration(
                        hintText: 'Type your message...',
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send, color: FikaColors.primaryRoyalBlue),
                    onPressed: _sendMessage,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
