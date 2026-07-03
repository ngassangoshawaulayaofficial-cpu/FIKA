import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface ProviderData {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  bio?: string;
  is_verified: boolean;
  verification_document_url?: string;
  is_premium: boolean;
  is_featured: boolean;
}

const Providers: React.FC = () => {
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    // Fetch all profiles of role 'provider' and join with provider_profiles
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        email,
        provider_profiles (
          bio,
          is_verified,
          verification_document_url,
          is_premium,
          is_featured
        )
      `)
      .eq('role', 'provider');

    if (error) {
      alert(`Error loading providers: ${error.message}`);
    } else if (data) {
      const formatted: ProviderData[] = data.map((item: any) => {
        const prov = item.provider_profiles;
        return {
          id: item.id,
          full_name: item.full_name,
          phone: item.phone || '',
          email: item.email || '',
          bio: prov?.bio || '',
          is_verified: prov?.is_verified ?? false,
          verification_document_url: prov?.verification_document_url || '',
          is_premium: prov?.is_premium ?? false,
          is_featured: prov?.is_featured ?? false,
        };
      });
      setProviders(formatted);
    }
    setLoading(false);
  };

  const handleToggleVerification = async (id: string, currentVal: boolean) => {
    const { error } = await supabase
      .from('provider_profiles')
      .update({ is_verified: !currentVal })
      .eq('id', id);

    if (error) {
      alert(`Error updating verification: ${error.message}`);
    } else {
      setProviders(providers.map(p => p.id === id ? { ...p, is_verified: !currentVal } : p));
    }
  };

  const handleTogglePremium = async (id: string, currentVal: boolean) => {
    const { error } = await supabase
      .from('provider_profiles')
      .update({ is_premium: !currentVal })
      .eq('id', id);

    if (error) {
      alert(`Error updating premium status: ${error.message}`);
    } else {
      setProviders(providers.map(p => p.id === id ? { ...p, is_premium: !currentVal } : p));
    }
  };

  const handleToggleFeatured = async (id: string, currentVal: boolean) => {
    const { error } = await supabase
      .from('provider_profiles')
      .update({ is_featured: !currentVal })
      .eq('id', id);

    if (error) {
      alert(`Error updating featured status: ${error.message}`);
    } else {
      setProviders(providers.map(p => p.id === id ? { ...p, is_featured: !currentVal } : p));
    }
  };

  if (loading) {
    return <div>Loading grooming professionals directory...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Grooming Professionals</h1>
        <button onClick={fetchProviders} style={{ padding: '8px 16px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Refresh List</button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Name</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Phone & Email</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Verification Doc</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Verified</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Premium</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Featured</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No providers registered yet.</td>
              </tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '20px 24px', fontWeight: '500' }}>{p.full_name}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{p.phone}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{p.email}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {p.verification_document_url ? (
                      <a href={p.verification_document_url} target="_blank" rel="noreferrer" style={{ color: '#0F4C81', fontWeight: '500', textDecoration: 'none' }}>View document</a>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>None uploaded</span>
                    )}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{
                      backgroundColor: p.is_verified ? '#D1FAE5' : '#FEF3C7',
                      color: p.is_verified ? '#065F46' : '#D97706',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {p.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <input type="checkbox" checked={p.is_premium} onChange={() => handleTogglePremium(p.id, p.is_premium)} />
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <input type="checkbox" checked={p.is_featured} onChange={() => handleToggleFeatured(p.id, p.is_featured)} />
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <button
                      onClick={() => handleToggleVerification(p.id, p.is_verified)}
                      style={{
                        backgroundColor: p.is_verified ? '#EF4444' : '#10B981',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}
                    >
                      {p.is_verified ? 'Revoke' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Providers;
