'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Sliders, CheckCircle2, AlertCircle, RefreshCw, Shield, Layers, Bot, GraduationCap, FileText, AlertTriangle, Banknote, CalendarClock, Briefcase, Award } from 'lucide-react';
import { SessionContext } from '../session-provider';
import { DEFAULT_FEATURE_FLAGS, getStoredFeatureFlags, setStoredFeatureFlags, FeatureFlags } from '../../../config/features';

export default function SettingsPage() {
  const session = useContext(SessionContext);
  const user = session?.user;
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [mounted, setMounted] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setFlags(getStoredFeatureFlags());
    setMounted(true);
  }, []);

  const handleToggle = (key: keyof FeatureFlags) => {
    const currentFlags = flags || DEFAULT_FEATURE_FLAGS;
    const updated = { ...currentFlags, [key]: !currentFlags[key] };
    setFlags(updated);
    setStoredFeatureFlags(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
    // Sync sidebar layout
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const isAdmin = user?.role === 'HR Admin';

  if (!mounted) {
    return (
      <div className="page-container" style={{ padding: '32px', color: 'var(--text-muted)' }}>
        Loading platform mode settings...
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders style={{ color: 'var(--primary)' }} />
            WorkforceMS Feature Toggle Control Center
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Modular Architecture Settings: Enable or disable platform verticals dynamically without touching core database schema.
          </p>
        </div>

        {savedToast && (
          <div className="badge badge-approved" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            Feature configuration saved! Sidebar updated.
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-light)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <strong style={{ fontSize: '14px' }}>Admin Permission Required</strong>
              <p style={{ fontSize: '13px', margin: 0 }}>
                You are currently logged in as an Employee. Use the top bar role switcher to switch to <strong>HR Admin (Olumide)</strong> to modify platform feature toggles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Single WorkforceMS Standalone Mode Toggle */}
      <div className="card" style={{ borderLeft: '4px solid #00D600', backgroundColor: '#091f09', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ backgroundColor: '#00D600', color: '#000000', fontWeight: 800 }}>PRIMARY MODE TOGGLE</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>WorkforceMS Standalone Mode</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#a3a3a3', marginTop: '6px', maxWidth: '640px' }}>
              When enabled (default), the platform operates in <strong>WorkforceMS Standalone Mode</strong> — filtering the interface strictly to your unique <strong>AI LMS Software + HMO Benefits Portal + AI Assistant</strong>.
            </p>
          </div>

          <button
            onClick={() => isAdmin && handleToggle('workforceMSMode')}
            style={{
              padding: '10px 20px',
              borderRadius: '24px',
              border: flags.workforceMSMode !== false ? '1px solid #00D600' : '1px solid #444',
              backgroundColor: flags.workforceMSMode !== false ? '#00D600' : '#1f1f1f',
              color: flags.workforceMSMode !== false ? '#000000' : '#ffffff',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isAdmin ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: flags.workforceMSMode !== false ? '#000000' : '#666' }} />
            {flags.workforceMSMode !== false ? 'WorkforceMS Mode: ACTIVE' : 'Full HR Suite Mode'}
          </button>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        
        {/* Core LMS Module */}
        <div className="card" style={{ opacity: isAdmin ? 1 : 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>AI LMS & Certificates</h3>
                <span className="badge badge-approved" style={{ marginTop: '2px' }}>Killer Differentiator</span>
              </div>
            </div>

            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={flags.enableLMS} 
                onChange={() => isAdmin && handleToggle('enableLMS')}
                disabled={!isAdmin}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: flags.enableLMS ? 'var(--accent)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: flags.enableLMS ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            AI Course Generator, YouTube video player, sequential quiz locks, and verified printable WorkforceMS certificates.
          </p>
        </div>

        {/* AI HR Assistant */}
        <div className="card" style={{ opacity: isAdmin ? 1 : 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent)' }}>
                <Bot size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>AI HR Assistant Copilot</h3>
                <span className="badge badge-approved" style={{ marginTop: '2px' }}>Killer Differentiator</span>
              </div>
            </div>

            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={flags.enableAIAssistant} 
                onChange={() => isAdmin && handleToggle('enableAIAssistant')}
                disabled={!isAdmin}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: flags.enableAIAssistant ? 'var(--accent)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: flags.enableAIAssistant ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Conversational natural-language query engine answering questions on leave schedules, payroll spend, and policy rules.
          </p>
        </div>

        {/* HMO & Health Benefits */}
        <div className="card" style={{ opacity: isAdmin ? 1 : 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>HMO Digital Card & Claims</h3>
                <span className="badge badge-enrolled" style={{ marginTop: '2px' }}>Governance Module</span>
              </div>
            </div>

            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={flags.enableHMO} 
                onChange={() => isAdmin && handleToggle('enableHMO')}
                disabled={!isAdmin}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: flags.enableHMO ? 'var(--accent)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: flags.enableHMO ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Digital HMO Membership ID cards, dependant enrolment, emergency medical refund claims, and hospital directory.
          </p>
        </div>

        {/* Disciplinary Query Studio */}
        <div className="card" style={{ opacity: isAdmin ? 1 : 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Disciplinary Query Studio</h3>
                <span className="badge badge-enrolled" style={{ marginTop: '2px' }}>Governance Module</span>
              </div>
            </div>

            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={flags.enableDisciplinary} 
                onChange={() => isAdmin && handleToggle('enableDisciplinary')}
                disabled={!isAdmin}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: flags.enableDisciplinary ? 'var(--accent)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: flags.enableDisciplinary ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Formal query creation, 48-hour statutory countdown timer, written employee defense submission, and sanction warning letters.
          </p>
        </div>

        {/* Payroll & EWA */}
        <div className="card" style={{ opacity: isAdmin ? 1 : 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <Banknote size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Payroll & Earned Wage Access</h3>
                <span className="badge badge-applied" style={{ marginTop: '2px' }}>Finance Module</span>
              </div>
            </div>

            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={flags.enablePayroll} 
                onChange={() => isAdmin && handleToggle('enablePayroll')}
                disabled={!isAdmin}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: flags.enablePayroll ? 'var(--accent)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: flags.enablePayroll ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Automated PAYE/Pension tax engine, 50% Earned Wage Access simulator, and statutory tax schedule exporters.
          </p>
        </div>

        {/* Attendance & Leave */}
        <div className="card" style={{ opacity: isAdmin ? 1 : 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <CalendarClock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Attendance & Leave Hub</h3>
                <span className="badge badge-applied" style={{ marginTop: '2px' }}>Operations Module</span>
              </div>
            </div>

            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={flags.enableAttendance} 
                onChange={() => isAdmin && handleToggle('enableAttendance')}
                disabled={!isAdmin}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: flags.enableAttendance ? 'var(--accent)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: flags.enableAttendance ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Geofenced check-in punch clock, dynamic leave balances, and leave request approval workflows.
          </p>
        </div>

      </div>

      {/* Segregation Handoff Info Box */}
      <div className="card" style={{ marginTop: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: 'var(--primary)' }} />
          Developer Hand-Off Guidance ("The Main Guy")
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          All features above are strictly segregated into independent routes and tables in <code>db.json</code>. You can hand off any combination of modules (e.g. <strong>AI LMS + Assistant</strong>) to your backend lead without causing schema conflicts in existing tables.
        </p>
      </div>
    </div>
  );
}
