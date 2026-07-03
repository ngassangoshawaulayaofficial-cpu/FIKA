'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { R2UploadService } from '../../../lib/r2';

interface Address {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function CustomerProfile() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      setEmail(session.user.email || '');

      // Load public profile record
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setName(profile.full_name);
        setPhone(profile.phone || '');
        setAvatarUrl(profile.avatar_url || '');
      }

      // Load saved addresses
      const { data: addrList } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('customer_id', userId);

      if (addrList) {
        setAddresses(addrList);
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        phone: phone,
        avatar_url: avatarUrl,
      })
      .eq('id', session.user.id);

    if (error) {
      alert(`Error saving profile: ${error.message}`);
    } else {
      alert('Profile updated successfully');
    }
    setLoading(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAddress) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: inserted, error } = await supabase
      .from('saved_addresses')
      .insert({
        customer_id: session.user.id,
        label: newLabel,
        address: newAddress,
        latitude: -6.7924, // Standard Dar es Salaam center latitude
        longitude: 39.2083, // Standard Dar es Salaam center longitude
      })
      .select()
      .single();

    if (error) {
      alert(`Error adding address: ${error.message}`);
    } else if (inserted) {
      setAddresses([...addresses, inserted]);
      setNewLabel('');
      setNewAddress('');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase
      .from('saved_addresses')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error deleting address: ${error.message}`);
    } else {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);
    try {
      const publicUrl = await R2UploadService.uploadFile(file, 'avatars', session.user.id);
      setAvatarUrl(publicUrl);
      alert('Avatar uploaded to R2 bucket successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert(`R2 Upload Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && name === '') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading account details...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px' }}>← Back to Dashboard</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>My Account Profile</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#E5E7EB', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#6B7280', fontWeight: 'bold' }}>
              {!avatarUrl && name.charAt(0).toUpperCase()}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} id="avatar-input" />
              <label htmlFor="avatar-input" style={{ padding: '8px 16px', border: '1px solid #0F4C81', borderRadius: '6px', cursor: 'pointer', color: '#0F4C81', fontSize: '14px', fontWeight: '600' }}>Change Photo</label>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px', margin: 0 }}>Powered by Cloudflare R2</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email Address</label>
              <input type="email" value={email} disabled style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderRadius: '6px', color: '#6B7280' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>

            <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}>Save Changes</button>
          </form>
        </div>

        {/* Saved Addresses Card */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '16px' }}>Saved Delivery Addresses</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {addresses.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>No saved addresses yet.</p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0F4C81', display: 'block' }}>{addr.label}</strong>
                    <span style={{ fontSize: '14px', color: '#4B5563' }}>{addr.address}</span>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Delete</button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Add New Address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <input type="text" placeholder="Label (e.g. Home)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }} />
              <input type="text" placeholder="Full Address in Dar es Salaam" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#D4AF37', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add Address</button>
          </form>
        </div>
      </div>
    </div>
  );
}
