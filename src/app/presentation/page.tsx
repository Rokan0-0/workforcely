'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, Play, ArrowLeft,
  Users, Banknote, Shield, Briefcase, Bot, CheckCircle, CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(9, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalSlides = 10;

  const nextSlide = () => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(0, prev - 1));

  // Recharts Market Size Chart Data (Slide 8)
  const marketData = [
    { year: '2023', SMEs: 37.0 },
    { year: '2024', SMEs: 38.5 },
    { year: '2025', SMEs: 39.6 },
    { year: '2026 (Est)', SMEs: 41.2 }
  ];

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Bar Navigation */}
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '18px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#14b8a6', boxShadow: '0 0 8px #14b8a6' }}></span>
          Workforcely <span style={{ color: '#14b8a6', fontWeight: 400, fontSize: '13px', marginLeft: '6px' }}>Pitch Deck</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
            Slide {currentSlide + 1} of {totalSlides}
          </span>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>
            <ArrowLeft size={12} /> Exit to Demo
          </Link>
        </div>
      </header>

      {/* Main Slide Contents */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Slide 1: Title */}
        {currentSlide === 0 && (
          <div style={{ textAlign: 'center', maxWidth: '800px', animation: 'fadeIn 0.5s ease' }}>
            <h1 style={{ fontSize: '64px', fontWeight: 800, color: '#ffffff', letterSpacing: '-2px', lineHeight: '1.1' }}>
              Powering the African <br />
              <span style={{ color: '#14b8a6' }}>Workforce</span>
            </h1>
            <p style={{ fontSize: '20px', color: '#94a3b8', marginTop: '24px', fontWeight: 500 }}>
              Next-Gen HR Operations & AI Analytics for Emerging Market SMEs
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px' }}>
                <strong>Presenter A:</strong> General Strategy
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px' }}>
                <strong>Presenter B:</strong> Product & AI Live Demo
              </div>
            </div>
          </div>
        )}

        {/* Slide 2: Problem */}
        {currentSlide === 1 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '40px', textAlign: 'center' }}>
              The Problem: SME HR is Fragmented & Manual
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '12px' }}>
                <h3 style={{ color: '#ef4444', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Compliance Headaches</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', color: '#cbd5e1', paddingLeft: '20px' }}>
                  <li>Manual PAYE Tax computations waste hours of executive time.</li>
                  <li>Pension PRA Laws (8% employee contribution deductions) calculated on spreadsheets.</li>
                  <li>Frequent audit penalties due to calculation inaccuracies.</li>
                </ul>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '32px', borderRadius: '12px' }}>
                <h3 style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Zero Operational Insights</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', color: '#cbd5e1', paddingLeft: '20px' }}>
                  <li>Attendance tracking done on paper registers or scattered WhatsApp groups.</li>
                  <li>No centralized analytics on headcount distribution, payroll cost growth, or reviews.</li>
                  <li>SMEs spend 120+ hours/year solely on internal workforce coordination.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Slide 3: The Solution */}
        {currentSlide === 2 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease', textAlign: 'center' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
              The Solution: Workforcely
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '40px' }}>
              A single unified SaaS platform built for localized payroll compliance, self-service tracking, and instant AI analytics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div style={{ backgroundColor: 'rgba(30, 58, 95, 0.2)', border: '1px solid #1e3a5f', padding: '24px', borderRadius: '12px' }}>
                <Users size={32} color="#38bdf8" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Unified Employee Lifecycle</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Job posting, applicant pipeline board, onboarding checklists, and profile management.</p>
              </div>
              <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', border: '1px solid #14b8a6', padding: '24px', borderRadius: '12px' }}>
                <Banknote size={32} color="#14b8a6" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Localized Compliance</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Auto-calculates Nigerian PAYE and Pension deductions. Generate and print payslips in 1 click.</p>
              </div>
              <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', padding: '24px', borderRadius: '12px' }}>
                <Bot size={32} color="#818cf8" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Gemini-Powered AI</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Ask natural language questions about attendance, payroll costs, and leaves. Get instant charts.</p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 4: Self Service */}
        {currentSlide === 3 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textAlign: 'center' }}>
              Product Tour: Employee Self-Service
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '40px', textAlign: 'center' }}>
              Eliminating the HR bottleneck. Empowering staff with mobile check-ins and direct payslip printouts.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#14b8a6', marginBottom: '6px' }}>1-Tap Attendance Clock</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Saves location and timestamps on click, automatically classifying Late vs Present check-ins.</p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#14b8a6', marginBottom: '6px' }}>Dynamic Leave Requests</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Staff view remaining Annual, Sick, and Casual leave balances. Submit forms straight to HR approval.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  backgroundColor: '#131c2e',
                  border: '2px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  width: '300px',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Employee Widget</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', margin: '12px 0' }}>08:14:23 AM</div>
                  <button className="clock-btn clock-btn-in" style={{ width: '100px', height: '100px', margin: '0 auto', fontSize: '14px' }}>
                    Clock In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 5: Local Compliance */}
        {currentSlide === 4 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textAlign: 'center' }}>
              Compliance-First Payroll Ledger
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '40px', textAlign: 'center' }}>
              Built for Nigerian SMEs. Handles consolidated relief allowances, progressive tax bands, and pension codes.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', padding: '8px', borderRadius: '6px', color: '#14b8a6' }}><CheckCircle size={18} /></div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Pension Act Reform Compliance</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Auto-deducts 8% of Basic + Housing + Transport components directly to PFAs.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', padding: '8px', borderRadius: '6px', color: '#14b8a6' }}><CheckCircle size={18} /></div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Progressive PAYE Taxing</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Calculates tax brackets progressively from 5% up to 20% on gross wages automatically.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', padding: '8px', borderRadius: '6px', color: '#14b8a6' }}><CheckCircle size={18} /></div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Printable Payslips</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Clean print layouts showing itemized earnings, deductions, and net payouts.</p>
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: 'white', color: '#0f172a', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-lg)', fontSize: '11px' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', fontWeight: 800, color: '#1e3a5f', fontSize: '12px' }}>
                  WORKFORCELY PAYSLIP PREVIEW
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Basic Base Pay:</span>
                  <strong>₦450,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Housing Allowance:</span>
                  <strong>₦130,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Transport Allowance:</span>
                  <strong>₦70,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#ef4444', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                  <span>PAYE Income Tax:</span>
                  <strong>-₦102,500.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#ef4444' }}>
                  <span>Pension PFA (8%):</span>
                  <strong>-₦52,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: '8px', fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                  <span>Net Monthly Pay:</span>
                  <span>₦495,500.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 6: Kanban & Onboarding Checklists */}
        {currentSlide === 5 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textAlign: 'center' }}>
              Recruitment Kanban & Checklist Onboarding
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '40px', textAlign: 'center' }}>
              Manage candidates from screening to fully onboarding within the same browser dashboard.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
                <Briefcase size={24} color="#38bdf8" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Job Postings Creator</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Create vacancies, assign target departments, draft descriptions, and toggle postings between open and closed.</p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
                <Users size={24} color="#14b8a6" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Kanban Stage Board</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Progress applicants dynamically through columns: Applied → Interview → Offer → Hired or Rejected.</p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
                <CheckSquare size={24} color="#f59e0b" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Automatic Onboarding</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Hired status triggers new hire checklists. Staff sign off contract tasks via their own portal widgets.</p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 7: AI HR Assistant */}
        {currentSlide === 6 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textAlign: 'center' }}>
              The Secret Sauce: Google Gemini Assistant
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '40px', textAlign: 'center' }}>
              Stop generating static reports. Ask your database questions in natural language and get immediate answers.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: '#131c2e', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #14b8a6' }}>
                  <span style={{ fontSize: '11px', color: '#14b8a6', fontWeight: 700 }}>USER INQUIRY</span>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>"What's our total payroll cost this month?"</p>
                </div>
                <div style={{ backgroundColor: '#131c2e', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>GEMINI AI ANSWER</span>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                    "For May 2026, the total payroll gross cost is ₦12,350,000, with a net paid amount of ₦9,450,230 across 25 active employees."
                  </p>
                </div>
              </div>
              <div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#cbd5e1', listStyleType: 'none' }}>
                  <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#14b8a6' }}>✔</span> Fully understands context dates (June 2026).</li>
                  <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#14b8a6' }}>✔</span> Formats complex tables and lists directly in chat bubbles.</li>
                  <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#14b8a6' }}>✔</span> Fuzzy searches details for single employee query requests.</li>
                  <li style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#14b8a6' }}>✔</span> Includes robust local keyword matcher fallback.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Slide 8: Market Opportunity */}
        {currentSlide === 7 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textAlign: 'center' }}>
              Massive Underserved SME Market
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px', textAlign: 'center' }}>
              Nigeria is home to over 39 million micro, small, and medium enterprises needing digital transformation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>NIGERIAN SME WAGE SPEND</span>
                  <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#14b8a6' }}>$35 Billion+</h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Estimated annual operational salary transaction volume.</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>PRODUCT VIRALITY LOOP</span>
                  <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8' }}>Free Under 5 Staff</h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Lowers acquisition costs, driving rapid grassroots adoption.</p>
                </div>
              </div>
              <div style={{ height: '280px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '10px' }}>
                  Active Micro/SMEs Growth in Nigeria (Millions)
                </span>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[30, 45]} />
                    <Tooltip contentStyle={{ backgroundColor: '#131c2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="SMEs" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Slide 9: Business Model */}
        {currentSlide === 8 && (
          <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease', textAlign: 'center' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '40px' }}>
              Pricing & Scalable Business Model
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>Free Classroom</h4>
                <div style={{ fontSize: '28px', fontWeight: 800, margin: '12px 0' }}>₦0</div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>For teams under 5 staff</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#cbd5e1', listStyleType: 'none', padding: 0 }}>
                  <li>✔ Clock In/Out widget</li>
                  <li>✔ Onboarding checklists</li>
                  <li>✔ Basic profiles directory</li>
                </ul>
              </div>
              <div style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', border: '2px solid #14b8a6', padding: '32px 24px', borderRadius: '12px', transform: 'scale(1.05)' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                  RECOMMENDED
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Pro SME Hybrid</h4>
                <div style={{ fontSize: '28px', fontWeight: 800, margin: '12px 0', color: '#14b8a6' }}>₦1,200 <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>/ employee / mo</span></div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>For growing SME business operations</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#cbd5e1', listStyleType: 'none', padding: 0 }}>
                  <li>✔ Automated compliant payroll</li>
                  <li>✔ Leave requests approval workflows</li>
                  <li>✔ Kanban recruiter pipelines</li>
                  <li>✔ <strong>Google Gemini AI assistant</strong></li>
                </ul>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>Enterprise</h4>
                <div style={{ fontSize: '28px', fontWeight: 800, margin: '12px 0' }}>Custom</div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>For larger multi-region corporations</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#cbd5e1', listStyleType: 'none', padding: 0 }}>
                  <li>✔ Custom API integrations</li>
                  <li>✔ Multi-entity group rollups</li>
                  <li>✔ Dedicated SLA account managers</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Slide 10: Ask */}
        {currentSlide === 9 && (
          <div style={{ textAlign: 'center', maxWidth: '800px', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#14b8a6', letterSpacing: '-1px' }}>
              Building the Future of Work
            </h2>
            <p style={{ fontSize: '20px', color: '#94a3b8', marginTop: '16px', fontWeight: 500 }}>
              Join us in digitizing operational management for 39 Million Nigerian SMEs.
            </p>
            <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <Link href="/dashboard" className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '8px' }}>
                Launch Live App Demo
              </Link>
            </div>
            <div style={{ marginTop: '48px', fontSize: '13px', color: '#64748b' }}>
              Email: pitch@workforcely.com • Website: www.workforcely.com
            </div>
          </div>
        )}
      </main>

      {/* Navigation Controls Overlay */}
      <footer style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#070a12',
        zIndex: 10
      }}>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Use <strong>Left/Right Arrows</strong> or <strong>Spacebar</strong> to navigate.
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{ padding: '8px 12px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-secondary"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            style={{ padding: '8px 12px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* Global CSS transition animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
