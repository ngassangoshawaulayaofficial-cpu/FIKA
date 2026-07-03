import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <header style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#D4AF37' }}></div>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F4C81', letterSpacing: '0.5px' }}>FIKA</span>
        </div>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <Link href="/auth/login" style={{ color: '#0F4C81', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/auth/register" style={{ backgroundColor: '#0F4C81', color: 'white', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', textDecoration: 'none' }}>Get Started</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <span style={{ color: '#D4AF37', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', display: 'inline-block' }}>On-Demand Beauty & Grooming</span>
        <h1 style={{ fontSize: '56px', fontWeight: '800', color: '#0F4C81', lineHeight: '1.2', maxWidth: '800px', marginBottom: '24px' }}>
          Premium Grooming delivered directly to your doorstep.
        </h1>
        <p style={{ fontSize: '18px', color: '#4B5563', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6' }}>
          Connect instantly with verified barbers, hairstylists, and beauty experts traveling directly to your home, hotel, or office in Dar es Salaam.
        </p>

        {/* Portal Entry Blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', width: '100%', maxWidth: '900px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '8px' }}>Book a Service</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Looking for professional grooming at your place? Start browsing experts.</p>
            <Link href="/auth/login" style={{ display: 'block', textAlign: 'center', padding: '12px', backgroundColor: '#0F4C81', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Customer Portal</Link>
          </div>

          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F4C81', marginBottom: '8px' }}>Join as Provider</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Are you a barber, braider, or hairstylist? Set your prices and earn.</p>
            <Link href="/auth/register" style={{ display: 'block', textAlign: 'center', padding: '12px', backgroundColor: '#D4AF37', color: 'black', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Provider Portal</Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: '14px' }}>
        &copy; {new Date().getFullYear()} FIKA Marketplace. All rights reserved.
      </footer>
    </div>
  );
}
