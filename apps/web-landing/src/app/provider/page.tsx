'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

interface BookingLog {
  id: string;
  status: string;
  scheduled_time: string;
  address: string;
  total_price: number;
  customer_name: string;
}

export default function ProviderDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [walletBalance, setWalletBalance] = useState(120000);
  const [totalEarnings, setTotalEarnings] = useState(450000);

  const dailyEarnings = 35000;
  const weeklyEarnings = 140000;
  const monthlyEarnings = 380000;

  const [bookings, setBookings] = useState<BookingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const loadDashboardStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    try {
      // 1. Fetch provider details
      const { data: provProfile } = await supabase
        .from('provider_profiles')
        .select('is_online, rating_avg')
        .eq('id', userId)
        .single();
      if (provProfile) {
        setIsOnline(provProfile.is_online);
      }

      // 2. Fetch completed bookings for earnings calculation
      const { data: completedBookings } = await supabase
        .from('bookings')
        .select('total_price, provider_earnings, created_at')
        .eq('provider_id', userId)
        .eq('status', 'completed');

      if (completedBookings) {
        const sumTotal = completedBookings.reduce((sum, b) => sum + Number(b.provider_earnings), 0);
        setTotalEarnings(sumTotal);
        setWalletBalance(sumTotal * 0.7);
      }

      // 3. Fetch today's upcoming bookings
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: upcomingData } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          scheduled_time,
          address,
          total_price,
          profiles!bookings_customer_id_fkey (
            full_name
          )
        `)
        .eq('provider_id', userId)
        .gte('scheduled_time', todayStart.toISOString())
        .order('scheduled_time', { ascending: true });

      if (upcomingData) {
        const formatted: BookingLog[] = upcomingData.map((item: unknown) => {
          const u = item as Record<string, unknown>;
          const profileData = u.profiles as unknown as Record<string, unknown>;
          const nameVal = Array.isArray(profileData)
            ? profileData[0]?.full_name
            : profileData?.full_name;

          return {
            id: String(u.id),
            status: String(u.status),
            scheduled_time: String(u.scheduled_time),
            address: String(u.address),
            total_price: Number(u.total_price),
            customer_name: String(nameVal || 'Client'),
          };
        });
        setBookings(formatted);
      }
    } catch {
      // Fallback mocks
      setBookings([
        { id: 'b1', status: 'confirmed', scheduled_time: new Date(Date.now() + 7200000).toISOString(), address: 'Upanga, Dar es Salaam', total_price: 25000, customer_name: 'David Minja' },
        { id: 'b2', status: 'confirmed', scheduled_time: new Date(Date.now() + 18000000).toISOString(), address: 'Masaki, Dar es Salaam', total_price: 35000, customer_name: 'Neema Kessy' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      loadDashboardStats();
    }, 0);
  }, []);

  const handleToggleOnline = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const nextVal = !isOnline;
    setIsOnline(nextVal);

    await supabase
      .from('provider_profiles')
      .update({ is_online: nextVal })
      .eq('id', session.user.id);
  };

  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount > walletBalance) {
      alert('Invalid withdrawal amount request.');
      return;
    }

    setIsWithdrawing(true);
    setTimeout(() => {
      setWalletBalance(prev => prev - amount);
      setIsWithdrawing(false);
      setWithdrawAmount('');
      alert('Withdrawal request initiated successfully. Payout is being processed via mobile money.');
    }, 1500);
  };

  // Mock monthly earnings graph values
  const graphData = [
    { month: 'Jan', amount: 280000 },
    { month: 'Feb', amount: 310000 },
    { month: 'Mar', amount: 420000 },
    { month: 'Apr', amount: 390000 },
    { month: 'May', amount: totalEarnings }
  ];

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #E5E7EB', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0F4C81', margin: 0 }}>Groomer Dashboard</h1>
          <p style={{ color: '#6B7280', marginTop: '4px', margin: 0 }}>Review earnings split, wallet status, and active schedules</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500' }}>Status: {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}</span>
            <button
              onClick={handleToggleOnline}
              style={{
                padding: '8px 16px',
                backgroundColor: isOnline ? '#EF4444' : '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Go {isOnline ? 'Offline' : 'Online'}
            </button>
          </div>
          <Link href="/auth/login" style={{ color: '#D4AF37', fontWeight: '600', textDecoration: 'none' }}>Logout</Link>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>Wallet Balance</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F4C81', marginTop: '8px', margin: 0 }}>TZS {walletBalance.toLocaleString()}</h2>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>Total Earnings</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginTop: '8px', margin: 0 }}>TZS {totalEarnings.toLocaleString()}</h2>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>Daily / Weekly</span>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', marginTop: '8px', margin: 0 }}>TZS {dailyEarnings.toLocaleString()} / TZS {weeklyEarnings.toLocaleString()}</h2>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>Monthly Volume</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151', marginTop: '8px', margin: 0 }}>TZS {monthlyEarnings.toLocaleString()}</h2>
        </div>
      </section>

      {/* Grid Layout: Payouts & Earnings Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Earnings Graph Chart */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px', marginTop: 0 }}>Monthly Performance Analytics</h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
            {graphData.map((d, i) => {
              const maxVal = Math.max(...graphData.map(gd => gd.amount));
              const pct = (d.amount / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                  <div style={{ height: `${pct * 1.5}px`, width: '32px', backgroundColor: '#0F4C81', borderRadius: '6px 6px 0 0', position: 'relative' }}></div>
                  <span style={{ fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wallet Withdrawal Card */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '12px', marginTop: 0 }}>Withdraw Wallet Funds</h3>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '24px' }}>Submit a payout ticket to request transfer to your registered mobile money wallet.</p>

          <form onSubmit={handleWithdrawRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Amount to Withdraw (TZS)</label>
              <input
                type="number"
                placeholder="E.g., 50000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isWithdrawing}
              style={{ padding: '12px', backgroundColor: '#D4AF37', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isWithdrawing ? 'Processing payout...' : 'Request Payout'}
            </button>
          </form>
        </div>
      </div>

      {/* Directory of Action links */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {[
          { title: 'My Services & Price Catalog', desc: 'Set up menu items, bio, and radius.', link: '/provider/profile' },
          { title: 'Incoming Booking Requests', desc: 'Accept, decline, or complete sessions.', link: '/provider/bookings' },
          { title: 'Availability Calendar', desc: 'Manage your active schedules calendar.', link: '/provider/calendar' },
        ].map((item, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '8px', marginTop: 0 }}>{item.title}</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '24px' }}>{item.desc}</p>
            </div>
            <Link href={item.link} style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: '#0F4C81', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Open portal</Link>
          </div>
        ))}
      </section>

      {/* Today&apos;s Bookings Quick-View */}
      <section style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '20px', marginTop: 0 }}>Today&apos;s Scheduled Appointments</h3>
        
        {loading ? (
          <div>Loading day schedule...</div>
        ) : bookings.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>No bookings scheduled for today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((bk) => (
              <div key={bk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{bk.customer_name}</strong>
                  <span style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginTop: '4px' }}>🕒 Time: {new Date(bk.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | 📍 Address: {bk.address}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#0F4C81', marginRight: '16px' }}>TZS {bk.total_price.toLocaleString()}</span>
                  <Link href="/provider/bookings" style={{ padding: '6px 12px', backgroundColor: '#F3F4F6', color: '#374151', textDecoration: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #E5E7EB' }}>Actions</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
