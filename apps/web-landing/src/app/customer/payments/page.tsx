'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

interface PaymentLog {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  transaction_id?: string;
  completed_at?: string;
  booking_date: string;
  provider_name: string;
}

export default function CustomerPayments() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Load payments joining bookings
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        created_at,
        payment_method,
        transaction_id,
        completed_at,
        bookings (
          scheduled_time,
          profiles!bookings_provider_id_fkey (
            full_name
          )
        )
      `)
      .eq('bookings.customer_id', session.user.id);

    if (error) {
      alert(`Error loading payments: ${error.message}`);
    } else if (data) {
      const filtered: PaymentLog[] = data
        .filter((item: unknown) => {
          const u = item as Record<string, unknown>;
          return u.bookings !== null;
        })
        .map((item: unknown) => {
          const u = item as Record<string, unknown>;
          const b = u.bookings as Record<string, unknown>;
          const profileData = b?.profiles as unknown as Record<string, unknown>;
          const nameVal = Array.isArray(profileData) ? profileData[0]?.full_name : profileData?.full_name;

          return {
            id: String(u.id),
            amount: Number(u.amount),
            status: String(u.status),
            created_at: String(u.created_at),
            payment_method: String(u.payment_method || 'mpesa_tz'),
            transaction_id: String(u.transaction_id || 'N/A'),
            completed_at: String(u.completed_at || ''),
            booking_date: String(b?.scheduled_time || ''),
            provider_name: String(nameVal || 'Grooming Expert'),
          };
        });
      setPayments(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchPayments();
    }, 0);
  }, []);

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'mpesa_tz': return 'Vodacom M-Pesa';
      case 'airtel_money_tz': return 'Airtel Money';
      case 'halopesa_tz': return 'HaloPesa';
      case 'mixx_yas_tz': return 'Mixx by Yas';
      case 'card': return 'Visa/Mastercard';
      default: return method || 'Cashless';
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading transaction history...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Dashboard</Link>
      </header>

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>Cashless Payment Receipts</h1>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>Transaction ID</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>Styling Professional</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>Mobile Money</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>Amount paid</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>Receipt Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No cashless transactions found.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#4B5563' }}>{p.transaction_id}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{new Date(p.created_at).toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: '500' }}>{p.provider_name}</td>
                  <td style={{ padding: '20px 24px', fontSize: '14px' }}>{getMethodLabel(p.payment_method)}</td>
                  <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 'bold', color: '#0F4C81' }}>TZS {p.amount.toLocaleString()}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{
                      backgroundColor: p.status === 'completed' ? '#D1FAE5' : p.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                      color: p.status === 'completed' ? '#065F46' : p.status === 'pending' ? '#D97706' : '#991B1B',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
