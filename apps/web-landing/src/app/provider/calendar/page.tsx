'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

interface BookingDay {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  status: string;
}

export default function ProviderCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Record<string, BookingDay[]>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Fetch this month's bookings
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        scheduled_time,
        booking_services (
          provider_services (
            name
          )
        ),
        profiles!bookings_customer_id_fkey (
          full_name
        )
      `)
      .eq('provider_id', session.user.id)
      .gte('scheduled_time', startOfMonth)
      .lte('scheduled_time', endOfMonth);

    if (error) {
      alert(`Error loading calendar: ${error.message}`);
    } else if (data) {
      const grouped: Record<string, BookingDay[]> = {};
      data.forEach((item: unknown) => {
        const u = item as Record<string, unknown>;
        const dateObj = new Date(String(u.scheduled_time));
        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        const bookingDay: BookingDay = {
          id: String(u.id),
          customerName: String((u.profiles as Record<string, unknown>)?.full_name || 'Client'),
          serviceName: String((u.booking_services as Array<Record<string, unknown>>)?.[0]?.provider_services && ((u.booking_services as Array<Record<string, unknown>>)[0].provider_services as Record<string, unknown>)?.name || 'Grooming Service'),
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: String(u.status),
        };

        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(bookingDay);
      });
      setBookings(grouped);

      const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      setSelectedDateKey(todayKey);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(true);
      fetchBookings();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const activeDayBookings = bookings[selectedDateKey] || [];

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Link href="/provider" style={{ color: '#0F4C81', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>← Back to Dashboard</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        {/* Calendar Grid */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={prevMonth} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}>Prev</button>
              <button onClick={nextMonth} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}>Next</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>Loading schedules...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {days.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} style={{ height: '70px' }}></div>;
                }

                const dayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasBookings = bookings[dayKey] && bookings[dayKey].length > 0;
                const isSelected = selectedDateKey === dayKey;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDateKey(dayKey)}
                    style={{
                      height: '70px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? '#EFF6FF' : 'white',
                      borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#2563EB' : '#374151' }}>{day}</span>
                    {hasBookings && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4AF37', alignSelf: 'center' }}></span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Details */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '20px', marginTop: 0 }}>
            Schedule for {selectedDateKey ? new Date(selectedDateKey).toLocaleDateString([], { dateStyle: 'long' }) : 'Selected Day'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeDayBookings.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>No grooming sessions scheduled for this day.</p>
            ) : (
              activeDayBookings.map((b) => (
                <div key={b.id} style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>{b.customerName}</strong>
                    <span style={{ fontSize: '12px', color: '#0F4C81', fontWeight: 'bold' }}>{b.time}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>Service: {b.serviceName}</span>
                  <span style={{
                    backgroundColor: b.status === 'completed' ? '#D1FAE5' : b.status === 'confirmed' ? '#DBEAFE' : '#FEF3C7',
                    color: b.status === 'completed' ? '#065F46' : b.status === 'confirmed' ? '#1E40AF' : '#D97706',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    {b.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
