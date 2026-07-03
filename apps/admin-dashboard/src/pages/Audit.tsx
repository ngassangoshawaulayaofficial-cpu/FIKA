import React from 'react';

const Audit: React.FC = () => {
  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', marginBottom: '24px' }}>System Audit Logs</h1>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Timestamp</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Actor</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Action</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Table</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Record ID</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E5E7EB', fontFamily: 'monospace', fontSize: '13px' }}>
              <td style={{ padding: '16px 24px' }}>2026-07-01 23:14:10</td>
              <td style={{ padding: '16px 24px' }}>admin_service</td>
              <td style={{ padding: '16px 24px', color: '#10B981' }}>UPDATE_VERIFICATION</td>
              <td style={{ padding: '16px 24px' }}>provider_profiles</td>
              <td style={{ padding: '16px 24px' }}>ae42-88f1-c309</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
