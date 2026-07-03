'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { R2UploadService } from '../../../lib/r2';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text?: string;
  latitude?: number;
  longitude?: number;
  is_read: boolean;
  created_at: string;
  attachments?: { url: string }[];
}

interface Thread {
  id: string;
  otherUser: {
    id: string;
    full_name: string;
    role: string;
  };
  lastMessage?: string;
  status: string;
}

export default function ChatDashboard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateLastMessageInThread = (convId: string, text: string) => {
    setThreads(prev => prev.map(t => t.id === convId ? { ...t, lastMessage: text } : t));
  };

  const handleSelectThread = async (thread: Thread) => {
    setActiveThread(thread);
    const nowMs = new Date().getTime();
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          text,
          latitude,
          longitude,
          is_read,
          created_at,
          message_attachments (
            url
          )
        `)
        .eq('conversation_id', thread.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        const msgs = data.map((m: unknown) => {
          const msg = m as Record<string, unknown>;
          return {
            ...msg,
            id: String(msg.id),
            conversation_id: String(msg.conversation_id),
            sender_id: String(msg.sender_id),
            text: String(msg.text),
            is_read: Boolean(msg.is_read),
            created_at: String(msg.created_at),
            attachments: (msg.message_attachments || []) as Array<Record<string, unknown>>,
          };
        });
        setMessages(msgs);
      }
    } catch {
      // Mock chat messages
      setMessages([
        { id: 'm1', conversation_id: thread.id, sender_id: thread.otherUser.id, text: 'Habari! I am on my way to Victoria Block.', is_read: true, created_at: new Date(nowMs - 3600000).toISOString() },
        { id: 'm2', conversation_id: thread.id, sender_id: 'me', text: 'Karibu, text me when you arrive.', is_read: true, created_at: new Date(nowMs - 1800000).toISOString() },
      ]);
    }
  };

  const loadThreads = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setCurrentUser(session.user.id);

    try {
      // 1. Fetch user's participant rows
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', session.user.id);

      if (participations && participations.length > 0) {
        const convIds = participations.map(p => p.conversation_id);

        // 2. Fetch conversation threads
        const { data: threadsData } = await supabase
          .from('conversations')
          .select(`
            id,
            status,
            conversation_participants (
              user_id,
              profiles (
                id,
                full_name,
                role
              )
            )
          `)
          .in('id', convIds);

        if (threadsData) {
          const formatted: Thread[] = threadsData.map((item: unknown) => {
            const it = item as Record<string, unknown>;
            const participants = it.conversation_participants as Array<Record<string, unknown>>;
            const other = participants?.find((p: Record<string, unknown>) => p.user_id !== session.user.id);
            const otherProfile = other?.profiles as Record<string, unknown> | undefined;

            return {
              id: String(it.id),
              status: String(it.status),
              otherUser: {
                id: String(otherProfile?.id || 'Unknown'),
                full_name: String(otherProfile?.full_name || 'Groomer Partner'),
                role: String(otherProfile?.role || 'provider'),
              },
            };
          });
          setThreads(formatted);
          if (formatted.length > 0) {
            handleSelectThread(formatted[0]);
          }
        }
      }
    } catch {
      // Fallback mocks for preview/compilation support
      const mocks: Thread[] = [
        { id: 't1', status: 'active', otherUser: { id: 'p1', full_name: 'Ally Rajabu (Barber)', role: 'provider' } },
        { id: 't2', status: 'active', otherUser: { id: 'p2', full_name: 'Fatma Juma (Stylist)', role: 'provider' } },
      ];
      setThreads(mocks);
      handleSelectThread(mocks[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread || !currentUser) return;

    const messageText = inputText;
    setInputText('');
    const nowMs = new Date().getTime();

    try {
      const { data: msg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeThread.id,
          sender_id: currentUser,
          text: messageText,
        })
        .select()
        .single();

      if (error) throw error;
      if (msg) setMessages((prev) => [...prev, msg]);
    } catch {
      // Local push mock fallback
      const localMsg: ChatMessage = {
        id: `local_${nowMs}`,
        conversation_id: activeThread.id,
        sender_id: currentUser,
        text: messageText,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);
    }
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread || !currentUser) return;

    try {
      const publicUrl = await R2UploadService.uploadFile(file, 'chat', currentUser);

      // Create message with attachment
      const { data: msg, error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeThread.id,
          sender_id: currentUser,
          text: 'Sent an image attachment',
        })
        .select()
        .single();

      if (msgErr) throw msgErr;

      await supabase.from('message_attachments').insert({
        message_id: msg.id,
        url: publicUrl,
      });

      setMessages((prev) => [...prev, { ...msg, attachments: [{ url: publicUrl }] }]);
    } catch (err) {
      alert(`Upload image fail: ${err}`);
    }
  };

  const handleLocationSend = async () => {
    if (!activeThread || !currentUser) return;

    // Send Victoria Block Dar es Salaam coordinates
    const lat = -6.7924;
    const lng = 39.2083;
    const nowMs = new Date().getTime();

    try {
      const { data: msg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeThread.id,
          sender_id: currentUser,
          text: 'Shared location pin',
          latitude: lat,
          longitude: lng,
        })
        .select()
        .single();

      if (error) throw error;
      if (msg) setMessages((prev) => [...prev, msg]);
    } catch {
      const localMsg: ChatMessage = {
        id: `loc_${nowMs}`,
        conversation_id: activeThread.id,
        sender_id: currentUser,
        text: 'Shared location pin',
        latitude: lat,
        longitude: lng,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);
    }
  };

  useEffect(() => {
    // Subscribe to Postgres changes on public.messages for real-time updates
    const subscription = supabase
      .channel('chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (activeThread && newMsg.conversation_id === activeThread.id) {
          setMessages((prev) => [...prev, newMsg]);
        }
        updateLastMessageInThread(newMsg.conversation_id, newMsg.text || 'Attachment sent');
      })
      .subscribe();

    setTimeout(() => {
      loadThreads();
    }, 0);

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading threads & chats...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 80px)', fontFamily: 'Inter, sans-serif', maxWidth: '1400px', margin: '0 auto', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', marginTop: '20px' }}>
      {/* Thread list sidebar */}
      <aside style={{ borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', backgroundColor: '#F9FAFB' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '18px', color: '#0F4C81' }}>Inbox Chats</strong>
          <Link href="/customer" style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'none' }}>Exit</Link>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {threads.length === 0 ? (
            <p style={{ padding: '20px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>No active grooming discussions.</p>
          ) : (
            threads.map((t) => {
              const isActive = activeThread?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectThread(t)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'white' : 'transparent',
                    borderLeft: isActive ? '4px solid #0F4C81' : '4px solid transparent',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '14px', color: '#374151' }}>{t.otherUser.full_name}</strong>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.lastMessage || 'Open thread history'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main chat window */}
      <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {activeThread ? (
          <>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '16px' }}>{activeThread.otherUser.full_name}</strong>
                <span style={{ fontSize: '12px', color: '#10B981', marginLeft: '12px' }}>online</span>
              </div>
              <button
                onClick={handleLocationSend}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#0F4C81',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                📍 Send Location Pin
              </button>
            </div>

            {/* Messages feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F3F4F6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((m) => {
                const isMe = m.sender_id === currentUser || m.sender_id === 'me';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '60%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      backgroundColor: isMe ? '#0F4C81' : 'white',
                      color: isMe ? 'white' : '#374151',
                      padding: '12px 16px',
                      borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      fontSize: '14px',
                      lineHeight: '1.4',
                    }}>
                      {m.text}
                      
                      {/* Location Maps Pin */}
                      {m.latitude && m.longitude && (
                        <div style={{ marginTop: '8px', borderTop: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E5E7EB', paddingTop: '8px' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>📍 Shared Location Details:</span>
                          <span style={{ display: 'block', fontSize: '11px' }}>Lat: {m.latitude} | Lng: {m.longitude}</span>
                          <a
                            href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: isMe ? '#D4AF37' : '#0F4C81', fontWeight: 'bold', textDecoration: 'none' }}
                          >
                            Open in Google Maps →
                          </a>
                        </div>
                      )}

                      {/* Image attachments */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {m.attachments.map((att, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={att.url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', display: 'block', marginTop: '4px' }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <div style={{ padding: '20px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#F3F4F6', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }}>
                📷
                <input type="file" accept="image/*" onChange={handleImageSend} style={{ display: 'none' }} />
              </label>

              <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{ flex: 1, padding: '10px 16px', border: '1px solid #D1D5DB', borderRadius: '24px', outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#0F4C81',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9CA3AF', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>💬</span>
            <strong>No Active Styling Discussion</strong>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Select an inbox chat from the left panel to display message logs.</p>
          </div>
        )}
      </section>
    </div>
  );
}
