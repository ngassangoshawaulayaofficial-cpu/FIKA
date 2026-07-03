import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface ReportAuditLog {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_name: string;
  review_id: string;
  review_comment: string;
  review_rating: number;
}

const Reviews: React.FC = () => {
  const [reports, setReports] = useState<ReportAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    // Fetch review reports joining review details and reporter profiles
    const { data, error } = await supabase
      .from('review_reports')
      .select(`
        id,
        reason,
        status,
        created_at,
        profiles!review_reports_reporter_id_fkey (
          full_name
        ),
        reviews (
          id,
          comment,
          rating
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      alert(`Error loading reports queue: ${error.message}`);
    } else if (data) {
      const formatted: ReportAuditLog[] = data.map((item: any) => ({
        id: item.id,
        reason: item.reason,
        status: item.status,
        created_at: item.created_at,
        reporter_name: item.profiles?.full_name || 'Reporter Client',
        review_id: item.reviews?.id || '',
        review_comment: item.reviews?.comment || 'Empty review comment',
        review_rating: item.reviews?.rating || 5,
      }));
      setReports(formatted);
    }
    setLoading(false);
  };

  const handleDismissReport = async (reportId: string) => {
    // Mark status resolved in reports table
    const { error } = await supabase
      .from('review_reports')
      .update({ status: 'dismissed' })
      .eq('id', reportId);

    if (error) {
      alert(`Error dismissing: ${error.message}`);
    } else {
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
      alert('Report dismissed successfully.');
    }
  };

  const handleDeleteReview = async (reviewId: string, reportId: string) => {
    // Delete the review from reviews table. Triggers recalculation automatically!
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      alert(`Error deleting review: ${error.message}`);
    } else {
      // Mark report resolved
      await supabase.from('review_reports').update({ status: 'resolved' }).eq('id', reportId);
      setReports(reports.filter(r => r.review_id !== reviewId));
      alert('Review deleted successfully from platform.');
    }
  };

  if (loading && reports.length === 0) {
    return <div>Loading reviews moderation desk...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Review Flag Reports</h1>
        <button onClick={fetchReports} style={{ padding: '8px 16px', backgroundColor: '#0F4C81', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Refresh Queue</button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Reporter</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Reason</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Review Details</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No reviews flagged or reported.</td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{r.reporter_name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '14px', color: '#991B1B', fontWeight: '500' }}>{r.reason}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: '14px', color: '#F59E0B', fontWeight: 'bold', marginBottom: '4px' }}>{'★'.repeat(r.review_rating)}</div>
                    <div style={{ fontSize: '13px', color: '#4B5563' }}>"{r.review_comment}"</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{
                      backgroundColor: r.status === 'pending' ? '#FEF3C7' : '#F3F4F6',
                      color: r.status === 'pending' ? '#D97706' : '#374151',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDismissReport(r.id)}
                          style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleDeleteReview(r.review_id, r.id)}
                          style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          Delete Review
                        </button>
                      </div>
                    )}
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

export default Reviews;
