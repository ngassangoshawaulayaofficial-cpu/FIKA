'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

interface BookingLog {
  id: string;
  status: string;
  scheduled_time: string;
  address: string;
  total_price: number;
  provider_name: string;
  has_review: boolean;
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState<BookingLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Fetch customer bookings with provider profile and joining reviews to check if reviewed
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        scheduled_time,
        address,
        total_price,
        profiles!bookings_provider_id_fkey (
          full_name
        ),
        reviews (
          id
        )
      `)
      .eq('customer_id', session.user.id)
      .order('scheduled_time', { ascending: false });

    if (error) {
      alert(`Error loading bookings: ${error.message}`);
    } else if (data) {
      const formatted: BookingLog[] = data.map((item: unknown) => {
        const b = item as Record<string, unknown>;
        const profileData = b.profiles as unknown as Record<string, unknown>;
        const nameVal = Array.isArray(profileData) ? profileData[0]?.full_name : profileData?.full_name;
        const reviewsVal = b.reviews as Array<Record<string, unknown>>;

        return {
          id: String(b.id),
          status: String(b.status),
          scheduled_time: String(b.scheduled_time),
          address: String(b.address),
          total_price: Number(b.total_price),
          provider_name: String(nameVal || 'Grooming Expert'),
          has_review: reviewsVal && reviewsVal.length > 0,
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

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading booking history...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Map</Link>
      </header>

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>My Grooming Appointments</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed #D1D5DB', borderRadius: '12px', color: '#6B7280' }}>No appointments booked yet.</div>
        ) : (
          bookings.map((bk) => (
            <div key={bk.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '16px' }}>{bk.provider_name}</strong>
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
                  <span>📅 Date: {new Date(bk.scheduled_time).toLocaleString()}</span>
                  <span>📍 Address: {bk.address}</span>
                  <span style={{ fontWeight: 'bold', color: '#0F4C81' }}>Price: TZS {bk.total_price.toLocaleString()}</span>
                </div>
              </div>

              <div>
                {bk.status === 'completed' && !bk.has_review && (
                  <Link href={`/customer/reviews/new?booking=${bk.id}`} style={{ padding: '8px 16px', backgroundColor: '#D4AF37', color: 'black', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>Rate & Review</Link>
                )}
                {bk.has_review && (
                  <span style={{ color: '#10B981', fontSize: '13px', fontWeight: 'bold' }}>✓ Reviewed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
