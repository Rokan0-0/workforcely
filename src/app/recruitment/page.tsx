"use client";

import React, { useEffect, useState } from 'react';
import { Briefcase, Mail, Phone, FileText, User, X, CheckCircle, Info } from 'lucide-react';

export default function PublicRecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', resumeText: '', coverNote: '', resumeFile: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/recruitment');
        const empRes = await fetch('/api/employees');
        if (res.ok && empRes.ok) {
          const data = await res.json();
          const empData = await empRes.json();
          
          const openJobs = (data.jobPostings || []).filter((job: any) => job.status === 'Open');
          setJobs(openJobs);
          setDepartments(empData.departments || []);
        }
      } catch (err) {
        console.error('Failed to load jobs', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOpenApply = (job: any) => {
    setSelectedJob(job);
    setForm({ name: '', email: '', phone: '', resumeText: '', coverNote: '', resumeFile: '' });
    setError(null);
    setMessage(null);
  };

  const handleCloseApply = () => {
    setSelectedJob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.name || !form.email || !selectedJob) {
      setError('Please provide your name and email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          name: form.name,
          email: form.email,
          phone: form.phone,
          jobId: selectedJob.id,
          resumeText: form.resumeText,
          coverNote: form.coverNote,
          resumeFile: form.resumeFile
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('Application submitted successfully! Our team will contact you shortly.');
        setForm({ name: '', email: '', phone: '', resumeText: '', coverNote: '', resumeFile: '' });
        // Close modal after 2.5 seconds
        setTimeout(() => {
          setSelectedJob(null);
        }, 2500);
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Apply error', err);
      setError('Network error, please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#0f172a',
      paddingBottom: 64
    }}>
      {/* Decorative top header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
        color: '#ffffff',
        padding: '80px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effects */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(40px)' }} />
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: '1.2' }}>
          Shape the Future of SME Operations
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: 12, maxWidth: 600, margin: '12px auto 0', fontWeight: 500 }}>
          Join the Workforcely team and build cutting-edge solutions for retail and FinTech SMEs in Nigeria.
        </p>
      </div>

      <main style={{ maxWidth: 1100, margin: '48px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Open Career Opportunities</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Find a role that matches your skills and passions.</p>
          </div>
          <span style={{ fontSize: '0.875rem', padding: '6px 12px', background: '#e2e8f0', color: '#475569', borderRadius: 999, fontWeight: 600 }}>
            {jobs.length} Active {jobs.length === 1 ? 'Job' : 'Jobs'}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <span>Fetching career listings...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '64px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <Briefcase size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>No Openings Right Now</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: 8, maxWidth: 450, margin: '8px auto 0' }}>
              We don't have any vacancies open at this instant. Please check back later or submit your details for our talent pool.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24
          }}>
            {jobs.map(job => {
              const dept = departments.find((d: any) => d.id === job.departmentId);
              return (
                <div key={job.id} style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.006)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.006)';
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        padding: '4px 10px',
                        borderRadius: 999,
                        textTransform: 'uppercase'
                      }}>
                        {dept?.name || 'General'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Posted {job.createdDate}</span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 10px 0', lineHeight: 1.3, color: '#1e293b' }}>
                      {job.title}
                    </h3>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      margin: '0 0 20px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {job.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenApply(job)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    <Briefcase size={16} /> Apply for this Role
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal dialog for application */}
      {selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }} onClick={handleCloseApply}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative',
            animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            <style>{`
              @keyframes modalSlideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  Apply for Position
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600 }}>
                  {selectedJob.title}
                </p>
              </div>
              <button
                onClick={handleCloseApply}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f1f5f9',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px' }}>
              {message ? (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                  color: '#15803d',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  margin: '12px 0'
                }}>
                  <CheckCircle size={32} />
                  <span style={{ fontWeight: 600 }}>{message}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
                  {error && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: '#991b1b',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <Info size={16} />
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                        <input
                          required
                          placeholder="Chioma Sowore"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 10,
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        Email Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                        <input
                          required
                          type="email"
                          placeholder="candidate@workforcely.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 10,
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Phone Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                      <input
                        placeholder="+234 803 111 2222"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          border: '1px solid #cbd5e1',
                          borderRadius: 10,
                          fontSize: '0.9rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Upload Resume (PDF or TXT)
                    </label>
                    <div style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 12,
                      padding: '16px 20px',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <FileText size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, display: 'block' }}>
                        {form.resumeFile ? 'Resume file selected' : 'Choose a file or drag it here'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>PDF, TXT up to 5MB</span>
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setForm(f => ({ ...f, resumeFile: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          } catch (err) {
                            console.error('File read error', err);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Or Paste Resume text
                    </label>
                    <textarea
                      placeholder="Paste your professional experience, work history, and education details here..."
                      value={form.resumeText}
                      onChange={e => setForm({ ...form, resumeText: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Cover Note
                    </label>
                    <textarea
                      placeholder="Introduce yourself and explain why you're a great fit for this position..."
                      value={form.coverNote}
                      onChange={e => setForm({ ...form, coverNote: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={handleCloseApply}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 2,
                        padding: '12px 16px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        opacity: submitting ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                      onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#2563eb')}
                    >
                      {submitting ? 'Submitting Application…' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
