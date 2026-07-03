import React from 'react';

const Tickets: React.FC = () => {
  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', marginBottom: '24px' }}>Tickets & Complaints</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#0F4C81' }}>Disputes & Complaints</h2>
          <div style={{ padding: '16px', border: '1px solid #F3F4F6', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>Booking #BK-9321</strong>
              <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 'bold' }}>UNDER REVIEW</span>
            </div>
            <p style={{ fontSize: '14px', color: '#4B5563', margin: '0 0 12px 0' }}>Client complains provider did not show up on time and wants a full refund.</p>
            <button style={{ backgroundColor: '#F3F4F6', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Resolve Dispute</button>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#D4AF37' }}>Support Tickets</h2>
          <div style={{ padding: '16px', border: '1px solid #F3F4F6', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>Issue: Payment Pending</strong>
              <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 'bold' }}>OPEN</span>
            </div>
            <p style={{ fontSize: '14px', color: '#4B5563', margin: '0 0 12px 0' }}>Provider reporting unable to withdraw earnings. Triggered Snippe api callback check.</p>
            <button style={{ backgroundColor: '#F3F4F6', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Mark Resolved</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tickets;
