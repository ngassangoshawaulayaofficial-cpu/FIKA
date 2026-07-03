import React from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

export default async function ProviderProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let fullName = 'Grooming Expert';
  let bio = 'Verified grooming professional based in Dar es Salaam.';
  let ratingAvg = 5.0;
  let ratingCount = 0;
  let services: Service[] = [];
  const gallery: GalleryImage[] = [];

  try {
    // 1. Fetch Profile & Provider Profile
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', id).single();
    const { data: provProfile } = await supabase.from('provider_profiles').select('bio, rating_avg, rating_count').eq('id', id).single();

    if (profile) fullName = profile.full_name;
    if (provProfile) {
      bio = provProfile.bio || bio;
      ratingAvg = Number(provProfile.rating_avg);
      ratingCount = provProfile.rating_count;
    }

    // 2. Fetch Services
    const { data: serviceList } = await supabase.from('provider_services').select('*').eq('provider_id', id);
    if (serviceList) services = serviceList;

    // 3. Fetch Gallery
    const { data: galleryList } = await supabase.from('provider_gallery').select('*').eq('provider_id', id);
    if (galleryList) {
      galleryList.forEach(item => gallery.push(item));
    }
  } catch {
    // Fallback Mock menu data for compilation/preview support
    services = [
      { id: 's1', name: 'Classic Fade & Style', price: 15000, duration_minutes: 30, description: 'Clean haircut including wash and styling.' },
      { id: 's2', name: 'Beard Trimming & Oil', price: 10000, duration_minutes: 20, description: 'Shaping, razor finish, and organic beard oil.' },
    ];
  }

  // Generate availability time slots
  const timeSlots = ['08:00 AM', '09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Map Directory</Link>
      </header>

      {/* Main Info Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', marginBottom: '48px', backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <div>
          <div style={{ width: '160px', height: '160px', borderRadius: '50%', backgroundColor: '#0F4C81', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F4C81' }}>⭐ {ratingAvg.toFixed(1)} ({ratingCount} reviews)</span>
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1F2937', marginBottom: '8px' }}>{fullName}</h1>
          <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '16px' }}>✓ VERIFIED PARTNER</span>
          <p style={{ color: '#4B5563', fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px 0' }}>{bio}</p>
        </div>
      </div>

      {/* Grid Layout: Services menu & Slot Availability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '48px' }}>
        {/* Left Side: Services List */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#0F4C81' }}>Services Menu</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {services.map((service) => (
              <div key={service.id} style={{ padding: '20px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '16px' }}>{service.name}</strong>
                  <span style={{ fontWeight: 'bold', color: '#0F4C81' }}>TZS {service.price.toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 12px 0' }}>{service.description || 'Verified grooming service.'}</p>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>🕒 {service.duration_minutes} minutes duration</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Availability Calendar Slots */}
        <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0F4C81' }}>Available Slots Today</h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '24px' }}>Choose a scheduling window below to proceed with the booking checkout.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {timeSlots.map((slot, index) => (
              <Link
                key={index}
                href={`/customer/booking?provider=${encodeURIComponent(fullName)}&service=${encodeURIComponent(services[0]?.name || 'Classic Fade')}&price=${encodeURIComponent('TZS ' + (services[0]?.price || 15000).toLocaleString())}&time=${encodeURIComponent(slot)}`}
                style={{
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '6px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  display: 'block',
                  border: '1px solid #E5E7EB'
                }}
              >
                {slot}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Gallery Showcase */}
      {gallery.length > 0 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#0F4C81' }}>Portfolio Gallery</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {gallery.map((image) => (
              <div key={image.id} style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.image_url} alt="Portfolio" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
