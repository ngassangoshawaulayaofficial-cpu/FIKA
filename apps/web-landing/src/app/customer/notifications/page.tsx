'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [enablePush, setEnablePush] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableSms, setEnableSms] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    // 1. Fetch Notification Logs
    const { data: list } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (list) setNotifications(list);

    // 2. Fetch Preference Switches
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefs) {
      setEnablePush(prefs.enable_push);
      setEnableEmail(prefs.enable_email);
      setEnableSms(prefs.enable_sms);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Setup Supabase Realtime subscription for instant notification alerts
    const subscription = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
      })
      .subscribe();

    setTimeout(() => {
      loadData();
    }, 0);

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleMarkAllRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id);

    if (error) {
      alert(`Error updating: ${error.message}`);
    } else {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleTogglePreference = async (field: 'push' | 'email' | 'sms', currentVal: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const updates: Record<string, unknown> = {};
    if (field === 'push') {
      updates.enable_push = !currentVal;
      setEnablePush(!currentVal);
    } else if (field === 'email') {
      updates.enable_email = !currentVal;
      setEnableEmail(!currentVal);
    } else if (field === 'sms') {
      updates.enable_sms = !currentVal;
      setEnableSms(!currentVal);
    }

    const { error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', session.user.id);

    if (error) {
      alert(`Error updating preferences: ${error.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading alerts log...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Dashboard</Link>
        <button onClick={handleMarkAllRead} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Mark All Read</button>
      </header>

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>Notification History</h1>

      {/* Preferences Section */}
      <section style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '16px', marginTop: 0 }}>Notification Channels</h3>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={enablePush} onChange={() => handleTogglePreference('push', enablePush)} />
            <span>Push alerts</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={enableEmail} onChange={() => handleTogglePreference('email', enableEmail)} />
            <span>Email dispatches</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={enableSms} onChange={() => handleTogglePreference('sms', enableSms)} />
            <span>SMS updates</span>
          </label>
        </div>
      </section>

      {/* Alert Feed Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed #D1D5DB', borderRadius: '12px', color: '#6B7280' }}>Inbox is clean. No alerts logged.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: n.is_read ? 0.75 : 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '15px' }}>{n.title}</strong>
                  {!n.is_read && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4AF37' }}></span>
                  )}
                </div>
                <p style={{ color: '#4B5563', fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.4' }}>{n.message}</p>
                <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <span style={{
                backgroundColor: n.type === 'payment' ? '#D1FAE5' : '#EFF6FF',
                color: n.type === 'payment' ? '#065F46' : '#1E40AF',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {n.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
