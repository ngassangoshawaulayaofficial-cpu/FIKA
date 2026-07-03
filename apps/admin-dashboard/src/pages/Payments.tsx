import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface PaymentAuditLog {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  transaction_id?: string;
  completed_at?: string;
  customer_name: string;
  provider_name: string;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    // Fetch payments, joining customer & provider profiles
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        created_at,
        payment_method,
        transaction_id,
        completed_at,
        bookings (
          profiles!bookings_customer_id_fkey (
            full_name
          ),
          provider:profiles!bookings_provider_id_fkey (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      alert(`Error loading payment logs: ${error.message}`);
    } else if (data) {
      const formatted: PaymentAuditLog[] = data.map((item: any) => ({
        id: item.id,
        amount: Number(item.amount),
        status: item.status,
        created_at: item.created_at,
        payment_method: item.payment_method || 'mpesa_tz',
        transaction_id: item.transaction_id || 'N/A',
        completed_at: item.completed_at || '',
        customer_name: item.bookings?.profiles?.full_name || 'Client',
        provider_name: item.bookings?.provider?.full_name || 'Professional',
      }));
      setPayments(formatted);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    if (payments.length === 0) {
      alert('No payment logs to export.');
      return;
    }
    const headers = ['Date', 'Customer', 'Groomer', 'Method', 'Transaction ID', 'Amount', 'Status'];
    const rows = payments.map(p => [
      `"${new Date(p.created_at).toLocaleString()}"`,
      `"${p.customer_name}"`,
      `"${p.provider_name}"`,
      `"${p.payment_method || 'mpesa_tz'}"`,
      `"${p.transaction_id || 'N/A'}"`,
      p.amount,
      `"${p.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FIKA_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'mpesa_tz': return 'M-Pesa';
      case 'airtel_money_tz': return 'Airtel Money';
      case 'halopesa_tz': return 'HaloPesa';
      case 'mixx_yas_tz': return 'Mixx by Yas';
      case 'card': return 'Visa/Mastercard';
      default: return method || 'Cashless';
    }
  };

  const totalCommissions = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount * 0.15), 0);

  const totalVolume = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return <div>Loading financial audit logs...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Financial Transactions</h1>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={exportToCSV} style={{ padding: '8px 16px', backgroundColor: '#D4AF37', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Export CSV</button>
          <button onClick={fetchPayments} style={{ padding: '8px 16px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Refresh Audit</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>Total Transaction Volume (Completed)</span>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981', marginTop: '8px', margin: 0 }}>TZS {totalVolume.toLocaleString()}</h3>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>Estimated Platform Commissions (15%)</span>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F4C81', marginTop: '8px', margin: 0 }}>TZS {totalCommissions.toLocaleString()}</h3>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Date</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Customer</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Groomer</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Method</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Transaction ID</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Amount</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No transactions recorded.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '20px 24px' }}>{new Date(p.created_at).toLocaleString()}</td>
                  <td style={{ padding: '20px 24px', fontWeight: '500' }}>{p.customer_name}</td>
                  <td style={{ padding: '20px 24px' }}>{p.provider_name}</td>
                  <td style={{ padding: '20px 24px' }}>{getMethodLabel(p.payment_method)}</td>
                  <td style={{ padding: '20px 24px', color: '#4B5563', fontFamily: 'monospace' }}>{p.transaction_id}</td>
                  <td style={{ padding: '20px 24px', fontWeight: 'bold', color: '#0F4C81' }}>TZS {p.amount.toLocaleString()}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{
                      backgroundColor: p.status === 'completed' ? '#D1FAE5' : p.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                      color: p.status === 'completed' ? '#065F46' : p.status === 'pending' ? '#D97706' : '#991B1B',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {p.status.toUpperCase()}
                    </span>
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

export default Payments;
