'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, Briefcase, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminAccounts = [
    {
      id: 'emp-2',
      name: 'Olumide Sowore',
      role: 'HR Admin',
      email: 'olumide.sowore@workforcely.com',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop',
      desc: 'Full administrative access to manage personnel, payroll overrides, incidents, and company memos.'
    }
  ];

  const employeeAccounts = [
    {
      id: 'emp-3',
      name: 'Fatima Abubakar',
      role: 'Employee',
      email: 'fatima.abubakar@workforcely.com',
      avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=100&auto=format&fit=crop',
      desc: 'Access self-service payslips with manual adjustments, request leaves, and log safety incidents.'
    },
    {
      id: 'emp-19',
      name: 'Taiwo Adeyemi',
      role: 'Employee (Recent Hire)',
      email: 'taiwo.adeyemi@workforcely.com',
      avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=100&auto=format&fit=crop',
      desc: 'Access personal profile, onboarding checkilists, and check training course enrollments.'
    }
  ];

  const handleLogin = async (employeeId: string) => {
    setLoadingId(employeeId);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
        setLoadingId(null);
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      setLoadingId(null);
    }
  };

  return (
    <main className="welcome-container" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="login-card" style={{ width: '100%', maxWidth: '850px', padding: '36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--shadow-lg)' }}>
        <header className="login-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="login-logo" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="brand-dot" style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }}></span>
            Workforcely
          </h1>
          <p className="login-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>HR Management & Scoped AI Analytics Portal</p>
        </header>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            border: '1px solid var(--danger)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* HR Admin Column */}
          <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <Shield size={20} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>HR Admin Login</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Access full administrative features. Authorize leave requests, compute payroll runs, publish memos, review incidents, and query org-wide metrics.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {adminAccounts.map(account => (
                <button
                  key={account.id}
                  className="demo-account-btn"
                  disabled={loadingId !== null}
                  onClick={() => handleLogin(account.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background-alt)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    opacity: loadingId && loadingId !== account.id ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={account.avatar}
                    alt={account.name}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{account.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)' }}>{account.role}</div>
                  </div>
                  {loadingId === account.id ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entering...</span>
                  ) : (
                    <ChevronRight size={16} color="var(--text-muted)" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <User size={20} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Employee Login</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Access employee self-service features. Request time-off, view processed payslips, complete training reviews, and chat with a scoped AI assistant.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {employeeAccounts.map(account => (
                <button
                  key={account.id}
                  className="demo-account-btn"
                  disabled={loadingId !== null}
                  onClick={() => handleLogin(account.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background-alt)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    opacity: loadingId && loadingId !== account.id ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={account.avatar}
                    alt={account.name}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{account.name}</div>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>{account.role}</div>
                  </div>
                  {loadingId === account.id ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entering...</span>
                  ) : (
                    <ChevronRight size={16} color="var(--text-muted)" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recruitment Link Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid var(--border-color)', marginTop: '32px', paddingTop: '20px', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Looking for work? Browse open roles on our careers site.</p>
          <a
            href="/recruitment"
            className="btn-primary"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Briefcase size={16} /> View Open Positions
          </a>
        </div>

        <footer style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          Workforcely Demo Co • Nigerian Retail & FinTech SME Hybrid
        </footer>
      </div>
    </main>
  );
}
