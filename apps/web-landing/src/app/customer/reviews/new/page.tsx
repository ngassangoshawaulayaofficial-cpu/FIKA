'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { R2UploadService } from '../../../../lib/r2';

function ReviewFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking') || '';

  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState('Grooming Expert');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          provider_id,
          status,
          profiles!bookings_provider_id_fkey (
            full_name
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        setError('Booking not found or unauthorized.');
      } else if (booking.status !== 'completed') {
        setError('You can only review completed appointments.');
      } else {
        setProviderId(booking.provider_id);
        const profileData = booking.profiles as unknown as Record<string, unknown>;
        const nameVal = Array.isArray(profileData)
          ? (profileData[0] as Record<string, unknown>)?.full_name
          : profileData?.full_name;
        setProviderName(nameVal || 'Grooming Expert');
      }
      setLoading(false);
    }
    loadBooking();
  }, [bookingId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !providerId) return;

    setSubmitting(true);
    try {
      const publicUrl = await R2UploadService.uploadFile(file, 'reviews', providerId);
      setImageUrl(publicUrl);
      alert('Review photo uploaded successfully to R2 bucket!');
    } catch (err) {
      alert(`R2 Upload Fail: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      // 1. Insert review
      const { data: review, error: revErr } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          customer_id: session.user.id,
          provider_id: providerId,
          rating: rating,
          comment: comment,
        })
        .select()
        .single();

      if (revErr) throw revErr;

      // 2. Insert image if uploaded
      if (imageUrl && review) {
        await supabase
          .from('review_images')
          .insert({
            review_id: review.id,
            image_url: imageUrl,
          });
      }

      alert('Review submitted successfully! Thank you for your feedback.');
      router.push('/customer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submit failed';
      alert(`Error submitting review: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verifying booking details...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <div style={{ padding: '16px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>
        <Link href="/customer" style={{ color: '#0F4C81', fontWeight: 'bold' }}>Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/customer" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Dashboard</Link>
      </header>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '8px' }}>Write a Review</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Share your styling experience with <strong>{providerName}</strong></p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Star selector */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Star Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    fontSize: '28px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= rating ? '#F59E0B' : '#D1D5DB'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Written Feedback</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              placeholder="How was the haircut, grooming quality, punctuality, and styling?"
              style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', minHeight: '120px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Attach Photo (Optional)</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'block', marginBottom: '8px' }} />
            {imageUrl && (
              <div style={{ width: '100px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Review attachment" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '14px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '12px' }}
          >
            {submitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div>Verifying review session...</div>}>
      <ReviewFormContent />
    </Suspense>
  );
}
