'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { R2UploadService } from '../../../lib/r2';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProviderProfile() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [serviceRadius, setServiceRadius] = useState(10.00);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDocUrl, setVerificationDocUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Services State
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  // Portfolio State
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  useEffect(() => {
    async function loadProviderProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      // Load Profile & Provider Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: provProfile } = await supabase.from('provider_profiles').select('*').eq('id', userId).single();

      if (profile) {
        setName(profile.full_name);
        setPhone(profile.phone || '');
      }

      if (provProfile) {
        setBio(provProfile.bio || '');
        setServiceRadius(Number(provProfile.service_radius_km));
        setIsVerified(provProfile.is_verified);
        setVerificationDocUrl(provProfile.verification_document_url || '');
      }

      // Load categories
      const { data: catList } = await supabase.from('service_categories').select('id, name');
      if (catList) {
        setCategories(catList);
        if (catList.length > 0) setSelectedCategory(catList[0].id);
      }

      // Load services
      const { data: serviceList } = await supabase.from('provider_services').select('*').eq('provider_id', userId);
      if (serviceList) setServices(serviceList);

      // Load gallery
      const { data: galleryList } = await supabase.from('provider_gallery').select('*').eq('provider_id', userId);
      if (galleryList) setGallery(galleryList);

      setLoading(false);
    }

    loadProviderProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    // Update profiles table
    const { error: profError } = await supabase
      .from('profiles')
      .update({ full_name: name, phone })
      .eq('id', userId);

    // Update provider_profiles table
    const { error: provError } = await supabase
      .from('provider_profiles')
      .update({ bio, service_radius_km: serviceRadius })
      .eq('id', userId);

    if (profError || provError) {
      alert(`Error saving profile: ${profError?.message || provError?.message}`);
    } else {
      alert('Profile details saved successfully!');
    }
    setLoading(false);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || !selectedCategory) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: inserted, error } = await supabase
      .from('provider_services')
      .insert({
        provider_id: session.user.id,
        category_id: selectedCategory,
        name: newServiceName,
        price: Number(newServicePrice),
        duration_minutes: Number(newServiceDuration),
      })
      .select()
      .single();

    if (error) {
      alert(`Error adding service: ${error.message}`);
    } else if (inserted) {
      setServices([...services, inserted]);
      setNewServiceName('');
      setNewServicePrice('');
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from('provider_services').delete().eq('id', id);
    if (error) {
      alert(`Error deleting service: ${error.message}`);
    } else {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);
    try {
      const publicUrl = await R2UploadService.uploadFile(file, 'verifications', session.user.id);
      
      const { error } = await supabase
        .from('provider_profiles')
        .update({ verification_document_url: publicUrl })
        .eq('id', session.user.id);

      if (error) throw error;
      setVerificationDocUrl(publicUrl);
      alert('Verification document uploaded to Cloudflare R2 and submitted for verification approval.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert(`R2 Document Upload Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);
    try {
      const publicUrl = await R2UploadService.uploadFile(file, 'portfolios', session.user.id);
      
      const { data: inserted, error } = await supabase
        .from('provider_gallery')
        .insert({
          provider_id: session.user.id,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (error) throw error;
      if (inserted) setGallery([...gallery, inserted]);
      alert('Gallery photo uploaded successfully to Cloudflare R2 portfolio!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert(`R2 Gallery Upload Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    const { error } = await supabase.from('provider_gallery').delete().eq('id', id);
    if (error) {
      alert(`Error removing photo: ${error.message}`);
    } else {
      setGallery(gallery.filter(item => item.id !== id));
    }
  };

  if (loading && name === '') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading provider profile...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/provider" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px' }}>← Back to Dashboard</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Side: General Profile Setup & Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '24px' }}>Provider Information</h2>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Phone Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Professional Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', minHeight: '80px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Service Radius (km)</label>
                <input type="number" step="0.5" value={serviceRadius} onChange={(e) => setServiceRadius(Number(e.target.value))} required style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
              </div>

              <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Save Settings</button>
            </form>
          </div>

          {/* Verification Box */}
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '16px' }}>Verification Status</h2>
            <div style={{ marginBottom: '20px' }}>
              {isVerified ? (
                <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>✓ VERIFIED PROVIDER</span>
              ) : (
                <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>⏳ PENDING VERIFICATION</span>
              )}
            </div>

            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Upload Verification PDF / Document</label>
            <input type="file" accept=".pdf,image/*" onChange={handleDocUpload} style={{ display: 'block', marginBottom: '8px' }} />
            {verificationDocUrl && (
              <a href={verificationDocUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#0F4C81', textDecoration: 'none' }}>View submitted document</a>
            )}
          </div>
        </div>

        {/* Right Side: Services Menu & Portfolio Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Services Setup */}
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '16px' }}>Manage Services</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
              {services.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No services added yet.</p>
              ) : (
                services.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <div>
                      <strong>{s.name}</strong>
                      <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>{s.duration_minutes} mins</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#0F4C81', fontWeight: 'bold' }}>TZS {s.price.toLocaleString()}</span>
                      <button onClick={() => handleDeleteService(s.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddService} style={{ borderTop: '1px solid #F3F4F6', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Add Service Item</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Service Name" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} required style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} />
                <input type="number" placeholder="Price (TZS)" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} required style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', backgroundColor: 'white' }}>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input type="number" placeholder="Duration (mins)" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} required style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} />
              </div>

              <button type="submit" style={{ padding: '8px', backgroundColor: '#D4AF37', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Add Service</button>
            </form>
          </div>

          {/* Portfolio Gallery */}
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '16px' }}>Portfolio Gallery</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {gallery.map((item) => (
                <div key={item.id} style={{ position: 'relative', width: '100%', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt="Portfolio" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => handleDeleteGalleryItem(item.id)} style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Upload New Portfolio Photo</label>
            <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: 'block' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
