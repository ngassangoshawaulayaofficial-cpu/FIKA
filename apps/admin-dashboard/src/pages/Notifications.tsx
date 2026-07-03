import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface NotificationLog {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
}

const Notifications: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement fields
  const [targetRole, setTargetRole] = useState<'all' | 'customer' | 'provider'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        is_read,
        created_at,
        profiles (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      alert(`Error loading notification audit logs: ${error.message}`);
    } else if (data) {
      const formatted: NotificationLog[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        is_read: item.is_read,
        created_at: item.created_at,
        user_name: item.profiles?.full_name || 'System User',
        user_email: item.profiles?.email || 'N/A',
      }));
      setLogs(formatted);
    }
    setLoading(false);
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSending(true);
    try {
      // 1. Fetch user IDs matching role scope
      let query = supabase.from('profiles').select('id');
      if (targetRole !== 'all') {
        query = query.eq('role', targetRole);
      }

      const { data: users, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      if (!users || users.length === 0) {
        alert('No users found in this target role scope.');
        setSending(false);
        return;
      }

      // 2. Dispatch notifications list inserts
      const insertRows = users.map(u => ({
        user_id: u.id,
        title,
        message,
        type: 'system',
      }));

      const { error: sendErr } = await supabase.from('notifications').insert(insertRows);
      if (sendErr) throw sendErr;

      alert(`Announced successfully to ${users.length} users!`);
      setTitle('');
      setMessage('');
      fetchLogs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Announcement dispatch failed';
      alert(`Error dispatching announcement: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  if (loading && logs.length === 0) {
    return <div>Loading notifications control center...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
      {/* Left Column: Announcement Creator */}
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '20px', marginTop: 0 }}>Create Announcement</h2>

        <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Target Audience</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: 'white' }}
            >
              <option value="all">All Users (Customers & Providers)</option>
              <option value="customer">Customers Only</option>
              <option value="provider">Providers Only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Announcement Title</label>
            <input
              type="text"
              placeholder="E.g., App update scheduled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Message Body</label>
            <textarea
              placeholder="Enter announcement text content..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', minHeight: '120px' }}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            style={{ padding: '12px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {sending ? 'Sending Broadcast...' : 'Broadcast Announcement'}
          </button>
        </form>
      </div>

      {/* Right Column: History Audit Logs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Notification Dispatch History</h2>
          <button onClick={fetchLogs} style={{ padding: '6px 12px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Refresh History</button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Sent Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Recipient User</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Alert Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold', color: '#374151' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF' }}>No notifications dispatched yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.user_name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{log.user_email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{log.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
