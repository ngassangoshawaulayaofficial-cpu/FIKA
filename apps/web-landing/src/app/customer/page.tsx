'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

interface ProviderCard {
  id: string;
  name: string;
  category: string;
  bio: string;
  rating: number;
  distance: number;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

export default function CustomerDashboard() {
  const [distanceRadius, setDistanceRadius] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer Hub Stats
  const walletBalance = 45000;
  const [activeCount, setActiveCount] = useState(1);
  const favoriteCount = 2;

  // Saved Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    { id: '1', label: 'Home', address: 'Victoria Block, Dar es Salaam' },
    { id: '2', label: 'Office', address: 'Masaki Peninsula, Dar es Salaam' },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Active bookings timeline
  const [upcomingBooking, setUpcomingBooking] = useState<{ id: string; provider_name: string; scheduled_time: string; status: string } | null>(null);

  const loadDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      // 1. Fetch count of active bookings
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          scheduled_time,
          profiles!bookings_provider_id_fkey (
            full_name
          )
        `)
        .eq('customer_id', session.user.id)
        .in('status', ['pending', 'confirmed', 'arrived']);

      if (activeBookings) {
        setActiveCount(activeBookings.length);
        if (activeBookings.length > 0) {
          const first = activeBookings[0];
          const firstProfile = first.profiles as unknown as Record<string, unknown>;
          const profileName = Array.isArray(firstProfile) ? firstProfile[0]?.full_name : firstProfile?.full_name;

          setUpcomingBooking({
            id: first.id,
            provider_name: String(profileName || 'Grooming Expert'),
            scheduled_time: first.scheduled_time,
            status: first.status,
          });
        }
      }

      // 2. Fetch list of providers from database
      const { data: provProfiles } = await supabase
        .from('provider_profiles')
        .select(`
          id,
          bio,
          rating_avg,
          profiles (
            full_name
          )
        `);

      if (provProfiles) {
        const formatted: ProviderCard[] = provProfiles.map((p: unknown) => {
          const item = p as Record<string, unknown>;
          const profilesVal = item.profiles as unknown as Record<string, unknown>;
          const nameVal = Array.isArray(profilesVal) ? profilesVal[0]?.full_name : profilesVal?.full_name;

          return {
            id: String(item.id),
            name: String(nameVal || 'Grooming Expert'),
            category: 'barber',
            bio: String(item.bio || 'Verified grooming professional.'),
            rating: Number(item.rating_avg) || 5.0,
            distance: Math.floor(Math.random() * 10) + 1,
          };
        });
        setProviders(formatted);
      }
    } catch {
      // Mocks
      setProviders([
        { id: '1', name: 'Ally Rajabu', category: 'barber', bio: 'Expert fades and beard trimming.', rating: 4.9, distance: 1.2 },
        { id: '2', name: 'Fatma Juma', category: 'hairstylist', bio: 'Premium hair styling & braiding.', rating: 4.8, distance: 4.5 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      loadDashboardData();
    }, 0);
  }, []);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAddress) return;

    setAddresses([...addresses, { id: Date.now().toString(), label: newLabel, address: newAddress }]);
    setNewLabel('');
    setNewAddress('');
  };

  const filteredProviders = providers.filter((p) => {
    const matchesCat = !selectedCategory || p.category === selectedCategory;
    const matchesDist = p.distance <= distanceRadius;
    return matchesCat && matchesDist;
  });

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #E5E7EB', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0F4C81', margin: 0 }}>FIKA Portal</h1>
          <p style={{ color: '#6B7280', marginTop: '4px', margin: 0 }}>Premium home-visit grooming Marketplace</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/customer/profile" style={{ color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>My Profile</Link>
          <Link href="/customer/bookings" style={{ color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>Appointments 📅</Link>
          <Link href="/customer/payments" style={{ color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>Receipts</Link>
          <Link href="/customer/notifications" style={{ color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>Notifications 🔔</Link>
          <Link href="/customer/chat" style={{ color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>Chat 💬</Link>
          <Link href="/auth/login" style={{ color: '#EF4444', fontWeight: '600', textDecoration: 'none' }}>Logout</Link>
        </div>
      </header>

      {/* Stats Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>My Wallet</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F4C81', marginTop: '8px', margin: 0 }}>TZS {walletBalance.toLocaleString()}</h2>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>Active Bookings</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginTop: '8px', margin: 0 }}>{activeCount} Session(s)</h2>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'medium' }}>Favorite Groomers</span>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D4AF37', marginTop: '8px', margin: 0 }}>{favoriteCount} Stylists</h2>
        </div>
      </section>

      {/* Grid Layout: Active Timeline & Address Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Active Booking Timeline */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '20px', marginTop: 0 }}>Grooming Appointment Status</h3>
          {upcomingBooking ? (
            <div style={{ borderLeft: '4px solid #0F4C81', paddingLeft: '16px', paddingTop: '8px', paddingBottom: '8px' }}>
              <strong style={{ fontSize: '16px', display: 'block' }}>{upcomingBooking.provider_name}</strong>
              <span style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginTop: '4px' }}>📅 Time: {new Date(upcomingBooking.scheduled_time).toLocaleString()}</span>
              <span style={{
                backgroundColor: upcomingBooking.status === 'confirmed' ? '#DBEAFE' : '#FEF3C7',
                color: upcomingBooking.status === 'confirmed' ? '#1E40AF' : '#D97706',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginTop: '10px'
              }}>
                {upcomingBooking.status.toUpperCase()}
              </span>
            </div>
          ) : (
            <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>No active grooming appointments today.</p>
          )}
        </div>

        {/* Saved Addresses Manager */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '16px', marginTop: 0 }}>My Saved Locations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {addresses.map((a) => (
              <div key={a.id} style={{ fontSize: '13px', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
                <strong>📍 {a.label}</strong>: {a.address}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAddress} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Label (e.g. Gym)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
              style={{ width: '30%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
            />
            <input
              type="text"
              placeholder="Full Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              required
              style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
            />
            <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Add</button>
          </form>
        </div>
      </div>

      {/* Directory Directory & Search panel */}
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>Book a Grooming Appointment</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        {/* Filters Sidebar */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Search Filters</h4>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Category</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'All Categories', value: null },
                { label: 'Barber Grooming', value: 'barber' },
                { label: 'Hair Stylist', value: 'hairstylist' },
                { label: 'Braiders', value: 'braider' },
              ].map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    backgroundColor: selectedCategory === cat.value ? '#EFF6FF' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: selectedCategory === cat.value ? '#0F4C81' : '#374151',
                    fontWeight: selectedCategory === cat.value ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Distance: {distanceRadius} km</label>
            <input
              type="range"
              min="1"
              max="50"
              value={distanceRadius}
              onChange={(e) => setDistanceRadius(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Listings Directory */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Showing {filteredProviders.length} active professionals</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>Searching active styling professionals...</div>
            ) : filteredProviders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>No professional groomers match your active search filters.</div>
            ) : (
              filteredProviders.map((p) => (
                <div key={p.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '18px', color: '#1F2937' }}>{p.name}</strong>
                      <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 'bold' }}>⭐ {p.rating.toFixed(1)}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#4B5563', margin: '0 0 12px 0' }}>{p.bio}</p>
                    <span style={{ fontSize: '12px', color: '#0F4C81', fontWeight: 'bold' }}>📍 {p.distance} km away</span>
                  </div>
                  <Link
                    href={`/customer/providers/${p.id}`}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#0F4C81',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    View Catalog
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
