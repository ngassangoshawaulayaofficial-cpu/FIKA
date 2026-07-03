import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Ticket, ShieldAlert, LogOut, CreditCard, Bell, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Mock subrole check from metadata (default superadmin, supports billing/auditing logs)
  const subrole = (user as any)?.user_metadata?.sub_role || 'superadmin';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['superadmin'] },
    { label: 'Providers', path: '/providers', icon: <Users size={20} />, roles: ['superadmin', 'support'] },
    { label: 'Payments', path: '/payments', icon: <CreditCard size={20} />, roles: ['superadmin'] },
    { label: 'Notifications', path: '/notifications', icon: <Bell size={20} />, roles: ['superadmin', 'support'] },
    { label: 'Chats', path: '/chats', icon: <MessageSquare size={20} />, roles: ['superadmin', 'support'] },
    { label: 'Reviews', path: '/reviews', icon: <Star size={20} />, roles: ['superadmin', 'support'] },
    { label: 'Support Tickets', path: '/tickets', icon: <Ticket size={20} />, roles: ['superadmin', 'support'] },
    { label: 'Audit Logs', path: '/audit', icon: <ShieldAlert size={20} />, roles: ['superadmin'] },
  ].filter(item => item.roles.includes(subrole));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', backgroundColor: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#0F4C81', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#D4AF37' }}></div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>FIKA ADMIN</span>
        </div>
        
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  color: 'white',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: isActive ? '4px solid #D4AF37' : '4px solid transparent',
                  transition: 'background-color 0.2s',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#D4AF37',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '70px', backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#4B5563' }}>Logged in as: <strong>Admin User</strong></span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0F4C81', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
