'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

interface BookingRecord {
  id: string;
  status: string;
  scheduled_time: string;
  address: string;
  total_price: number;
  customer_name: string;
  customer_phone: string;
}

export default function ProviderBookings() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Load bookings where provider is active user
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        scheduled_time,
        address,
        total_price,
        profiles!bookings_customer_id_fkey (
          full_name,
          phone
        )
      `)
      .eq('provider_id', session.user.id)
      .order('scheduled_time', { ascending: true });

    if (error) {
      alert(`Error loading bookings: ${error.message}`);
    } else if (data) {
      const formatted: BookingRecord[] = data.map((item: unknown) => {
        const b = item as Record<string, unknown>;
        const profileData = b.profiles as unknown as Record<string, unknown>;
        const nameVal = Array.isArray(profileData) ? profileData[0]?.full_name : profileData?.full_name;
        const phoneVal = Array.isArray(profileData) ? profileData[0]?.phone : profileData?.phone;

        return {
          id: String(b.id),
          status: String(b.status),
          scheduled_time: String(b.scheduled_time),
          address: String(b.address),
          total_price: Number(b.total_price),
          customer_name: String(nameVal || 'Customer'),
          customer_phone: String(phoneVal || 'No phone number'),
        };
      });
      setBookings(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchBookings();
    }, 0);
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      alert(`Error updating booking status: ${error.message}`);
    } else {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Appointment marked as: ${newStatus.toUpperCase()}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading scheduled appointments...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/provider" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Dashboard</Link>
        <button onClick={fetchBookings} style={{ padding: '8px 16px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Refresh</button>
      </header>

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>Appointments Management</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed #D1D5DB', borderRadius: '12px', color: '#6B7280' }}>No active styling bookings assigned.</div>
        ) : (
          bookings.map((bk) => (
            <div key={bk.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '16px' }}>{bk.customer_name}</strong>
                  <span style={{
                    backgroundColor: bk.status === 'completed' ? '#D1FAE5' : bk.status === 'confirmed' ? '#DBEAFE' : '#FEF3C7',
                    color: bk.status === 'completed' ? '#065F46' : bk.status === 'confirmed' ? '#1E40AF' : '#D97706',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {bk.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>📅 Scheduled: {new Date(bk.scheduled_time).toLocaleString()}</span>
                  <span>📍 Client Address: {bk.address}</span>
                  <span>📞 Contact: {bk.customer_phone}</span>
                  <span style={{ fontWeight: 'bold', color: '#0F4C81' }}>Price: TZS {bk.total_price.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {bk.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdateStatus(bk.id, 'confirmed')} style={{ padding: '8px 14px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Accept</button>
                    <button onClick={() => handleUpdateStatus(bk.id, 'cancelled')} style={{ padding: '8px 14px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Decline</button>
                  </>
                )}
                {bk.status === 'confirmed' && (
                  <button onClick={() => handleUpdateStatus(bk.id, 'arrived')} style={{ padding: '8px 14px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Mark Arrived</button>
                )}
                {bk.status === 'arrived' && (
                  <button onClick={() => handleUpdateStatus(bk.id, 'completed')} style={{ padding: '8px 14px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Complete Session</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
