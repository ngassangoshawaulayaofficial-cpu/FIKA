import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface ConversationLog {
  id: string;
  status: string;
  created_at: string;
  participants: string[];
}

interface MessageAudit {
  id: string;
  sender_name: string;
  text?: string;
  created_at: string;
}

const Chats: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        created_at,
        conversation_participants (
          profiles (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      alert(`Error loading conversations: ${error.message}`);
    } else if (data) {
      const formatted: ConversationLog[] = data.map((item: any) => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        participants: item.conversation_participants.map((p: any) => p.profiles?.full_name || 'System User'),
      }));
      setConversations(formatted);
    }
    setLoading(false);
  };

  const handleSelectConversation = async (id: string) => {
    setSelectedConvId(id);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        text,
        created_at,
        profiles!messages_sender_id_fkey (
          full_name
        )
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      alert(`Error loading messages: ${error.message}`);
    } else if (data) {
      const formatted = data.map((m: any) => ({
        id: m.id,
        sender_name: m.profiles?.full_name || 'System User',
        text: m.text,
        created_at: m.created_at,
      }));
      setMessages(formatted);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert(`Error updating conversation: ${error.message}`);
    } else {
      setConversations(conversations.map(c => c.id === id ? { ...c, status: newStatus } : c));
      alert(`Conversation marked as: ${newStatus}`);
    }
  };

  if (loading && conversations.length === 0) {
    return <div>Loading chats control center...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
      {/* Conversations Thread Directory */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '20px', marginTop: 0 }}>Active Conversations Moderation</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Participants</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#0F4C81' }} onClick={() => handleSelectConversation(c.id)}>
                  {c.participants.join(' ↔ ')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    backgroundColor: c.status === 'active' ? '#D1FAE5' : '#FEE2E2',
                    color: c.status === 'active' ? '#065F46' : '#991B1B',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {c.status === 'active' ? (
                    <button onClick={() => handleUpdateStatus(c.id, 'blocked')} style={{ padding: '4px 8px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Block</button>
                  ) : (
                    <button onClick={() => handleUpdateStatus(c.id, 'active')} style={{ padding: '4px 8px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Unblock</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Message Audit Logs Viewer */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#0F4C81', marginTop: 0 }}>Message Audit Viewer</h3>
        
        {selectedConvId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#4B5563' }}>{m.sender_name}</strong>
                  <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#1F2937', margin: 0 }}>{m.text || '[Attachment / Map Pin]'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Select a thread on the left to audit message transmittals.</p>
        )}
      </div>
    </div>
  );
};

export default Chats;
