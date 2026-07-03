'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { SnippeService } from '../../../lib/snippe';

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const providerId = searchParams.get('provider') || '';
  const serviceId = searchParams.get('service') || '';

  const [providerName, setProviderName] = useState('Grooming Expert');
  const [serviceName, setServiceName] = useState('Grooming Service');
  const [price, setPrice] = useState(15000);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetails() {
      if (!providerId) return;

      // Load provider name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', providerId)
        .single();
      if (profile) setProviderName(profile.full_name);

      // Load service details
      if (serviceId) {
        const { data: svc } = await supabase
          .from('provider_services')
          .select('name, price')
          .eq('id', serviceId)
          .single();
        if (svc) {
          setServiceName(svc.name);
          setPrice(Number(svc.price));
        }
      }
    }
    loadDetails();
  }, [providerId, serviceId]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('You must be signed in to book a service.');
        return;
      }

      const totalVal = price;
      const commissionVal = totalVal * 0.15;
      const earningsVal = totalVal * 0.85;

      const scheduledTimestamp = new Date(`${date}T${time}`).toISOString();

      // 1. Create Booking Record
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          customer_id: session.user.id,
          provider_id: providerId || session.user.id, // fallback if empty
          status: 'pending_payment',
          scheduled_time: scheduledTimestamp,
          address: address,
          latitude: -6.7924,
          longitude: 39.2083,
          total_price: totalVal,
          commission_fee: commissionVal,
          provider_earnings: earningsVal,
        })
        .select()
        .single();

      if (bookingErr) throw bookingErr;

      // 2. Add Booking Services Menu Relationship
      if (serviceId) {
        const { error: serviceLinkErr } = await supabase
          .from('booking_services')
          .insert({
            booking_id: booking.id,
            service_id: serviceId,
            price: totalVal,
          });
        if (serviceLinkErr) throw serviceLinkErr;
      }

      // 3. Initiate Cashless Payment session
      const checkoutSession = await SnippeService.createCheckoutSession({
        bookingId: booking.id,
        amount: totalVal,
        customerPhone: session.user.phone || '+255700000000',
        callbackUrl: `${window.location.origin}/auth/callback`,
      });

      // 4. Save Payment Record
      const { error: payErr } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          snippe_checkout_id: checkoutSession.checkoutId,
          status: 'pending',
          amount: totalVal,
        });

      if (payErr) throw payErr;

      // Redirect to Snippe.sh checkout redirect URL
      router.push(checkoutSession.redirectUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Booking creation failed';
      setError(`Checkout Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px' }}>← Back to Map</Link>
      </header>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '8px' }}>Confirm Booking</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>You are booking with <strong>{providerName}</strong></p>

        {error && <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

        <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Service</span>
            <strong>{serviceName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Price</span>
            <strong style={{ color: '#0F4C81' }}>TZS {price.toLocaleString()}</strong>
          </div>
        </div>

        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Preferred Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Preferred Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Delivery Address (Dar es Salaam)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="E.g., Victoria Office Block, Floor 3"
              style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', minHeight: '80px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}
          >
            {loading ? 'Processing Checkout...' : 'Proceed to Pay (Snippe.sh)'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading booking parameters...</div>}>
      <BookingFormContent />
    </Suspense>
  );
}
