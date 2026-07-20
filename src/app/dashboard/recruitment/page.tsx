'use client';

import React, { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Briefcase, CheckSquare, Plus, FileText, ChevronRight, Check, X } from 'lucide-react';

export default function RecruitmentPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'onboarding'>('jobs');
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalCredentials, setModalCredentials] = useState<any>(null);

  const handleUpdateStage = async (applicantId: string, newStage: string) => {
    setModalMessage(null);
    setModalCredentials(null);
    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateApplicantStage',
          applicantId,
          status: newStage
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        triggerRefresh();
        setSelectedApplicant(result.applicant);
        
        let msg = `Stage updated to ${newStage}.`;
        if (result.notification) {
          msg += ` ${result.notification}`;
        }
        setModalMessage(msg);
        
        if (result.credentials) {
          setModalCredentials(result.credentials);
        }
      } else {
        setModalMessage(result.error || 'Failed to update stage.');
      }
    } catch (err) {
      console.error(err);
      setModalMessage('Error updating stage.');
    }
  };

  // Job creation state
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    departmentId: '',
    description: '',
    closingDate: ''
  });

  useEffect(() => {
    async function fetchData() {
      const cached = getCachedData('/api/recruitment-dashboard');
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        const recRes = await fetch('/api/recruitment');
        const empRes = await fetch('/api/employees');
        if (recRes.ok && empRes.ok) {
          const recData = await recRes.json();
          const empData = await empRes.json();
          const result = {
            postings: recData.jobPostings,
            applicants: recData.jobApplicants,
            employees: empData.employees,
            departments: empData.departments
          };
          setData(result);
          setCachedData('/api/recruitment-dashboard', result);
        }
      } catch (err) {
        console.error('Failed to load recruitment data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshFlag]);

  // Toggle onboarding checklist completion status
  const handleChecklistToggle = async (employeeId: string, taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateChecklist',
          employeeId,
          taskId,
          completed: !currentStatus
        })
      });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error('Checklist update failed', err);
    }
  };

    // Create a new job posting
    const handleJobSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/recruitment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createJob',
            title: jobForm.title,
            departmentId: jobForm.departmentId,
            description: jobForm.description,
            closingDate: jobForm.closingDate
          })
        });
        if (res.ok) {
          setIsCreatingJob(false);
          setJobForm({ title: '', departmentId: '', description: '', closingDate: '' });
          triggerRefresh();
        }
      } catch (err) {
        console.error('Job creation failed', err);
      }
    };

    // Close a job posting
    const handleJobClose = async (jobId: string) => {
      try {
        const res = await fetch('/api/recruitment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'closeJob', jobId })
        });
        if (res.ok) triggerRefresh();
      } catch (err) {
        console.error('Failed to close job', err);
      }
    };

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantFilterJobId, setApplicantFilterJobId] = useState('');
  const [applicantFilterStatus, setApplicantFilterStatus] = useState('');
  const [applicantFilterDate, setApplicantFilterDate] = useState('');

  const handleApplicantSelect = (applicant: any) => {
    setSelectedApplicant(applicant);
  };

  const handleJobSelect = (job: any) => {
    setSelectedJob(selectedJob?.id === job.id ? null : job);
  };

  const handleCopyLink = async (jobId: string) => {
    try {
      const url = `${window.location.origin}/recruitment/${jobId}`;
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(jobId);
      window.setTimeout(() => setCopiedLinkId(null), 3000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const closeApplicantModal = () => {
    setSelectedApplicant(null);
    setModalMessage(null);
    setModalCredentials(null);
  };

  const getApplicantAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=ffffff&size=128&rounded=true`;
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading recruitment pipelines and checklists...
      </div>
    );
  }

  const { postings, applicants, employees, departments } = data;

  // Render check for Admin
  if (user?.role !== 'HR Admin') {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Access Denied</h3>
          <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view the Recruitment module.</p>
        </div>
      </div>
    );
  }

  // Kanban stage collections
  const stages = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];
  const filteredApplicants = applicants.filter((a: any) => {
    const search = applicantSearch.trim().toLowerCase();
    const job = postings.find((j: any) => j.id === a.jobId);
    const jobTitle = job?.title?.toLowerCase() || '';
    const matchesSearch = !search || a.name.toLowerCase().includes(search) || a.email.toLowerCase().includes(search) || jobTitle.includes(search);
    const matchesJob = !applicantFilterJobId || a.jobId === applicantFilterJobId;
    const matchesStatus = !applicantFilterStatus || a.status === applicantFilterStatus;
    const matchesDate = !applicantFilterDate || a.appliedDate === applicantFilterDate;
    return matchesSearch && matchesJob && matchesStatus && matchesDate;
  });
  const stageApplicants = (stage: string) => filteredApplicants.filter((a: any) => a.status === stage);

  // Employees with onboarding checklists
  const onboardingChecklistEmployees = employees.filter((e: any) => e.onboardingChecklist && e.onboardingChecklist.length > 0);

  return (
    <div className="page-container">
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`btn-secondary ${activeTab === 'jobs' ? 'btn-primary' : ''}`}
          style={{ padding: '8px 16px', fontSize: '13px', border: 'none' }}
          onClick={() => setActiveTab('jobs')}
        >
          Job Postings ({postings.length})
        </button>
        <button
          className={`btn-secondary ${activeTab === 'applicants' ? 'btn-primary' : ''}`}
          style={{ padding: '8px 16px', fontSize: '13px', border: 'none' }}
          onClick={() => setActiveTab('applicants')}
        >
          Applicant Board (Kanban)
        </button>
        <button
          className={`btn-secondary ${activeTab === 'onboarding' ? 'btn-primary' : ''}`}
          style={{ padding: '8px 16px', fontSize: '13px', border: 'none' }}
          onClick={() => setActiveTab('onboarding')}
        >
          Onboarding Checklists ({onboardingChecklistEmployees.length})
        </button>
      </div>

      {stageMessage && (
        <div style={{ margin: '16px 0', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', border: '1px solid var(--success)' }}>
          {stageMessage}
        </div>
      )}

      {/* Tab Content: Jobs */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
          <div className="table-card">
            <div className="table-header-area">
              <h3 className="chart-title">Current Job Postings</h3>
              {!isCreatingJob && (
                <button className="btn-primary" onClick={() => { setSelectedJob(null); setIsCreatingJob(true); }}>
                  <Plus size={16} /> Create Job Posting
                </button>
              )}
            </div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Date Posted</th>
                    <th>Dossier Description</th>
                    <th>Applicants</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {postings.map((job: any) => {
                    const dept = departments.find((d: any) => d.id === job.departmentId);
                    const jobApplicants = applicants.filter((a: any) => a.jobId === job.id);
                    const count = jobApplicants.length;
                    const isOpen = selectedJob?.id === job.id;
                    return (
                      <React.Fragment key={job.id}>
                        <tr key={job.id} onClick={() => handleJobSelect(job)} style={{ cursor: 'pointer', background: isOpen ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong>{job.title}</strong>
                              <a
                                href={`${typeof window !== 'undefined' ? window.location.origin : ''}/recruitment?jobId=${job.id}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'underline' }}
                              >
                                View
                              </a>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCopyLink(job.id); }}
                                className="btn-secondary"
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              >
                                {copiedLinkId === job.id ? 'Copied' : 'Copy Link'}
                              </button>
                            </div>
                          </td>
                          <td>{dept?.name || 'Unknown'}</td>
                          <td>{job.createdDate}</td>
                          <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.description}
                          </td>
                          <td>
                            <span className="badge badge-applied">{count} applied</span>
                          </td>
                          <td>
                            <span className={`badge ${job.status === 'Open' ? 'badge-approved' : 'badge-absent'}`}>
                              {job.status}
                            </span>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                              <div style={{ position: 'relative', margin: '0 0 16px', padding: '20px 18px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <button
                                  type="button"
                                  className="close-btn"
                                  onClick={(e) => { e.stopPropagation(); setSelectedJob(null); }}
                                  style={{ position: 'absolute', right: 12, top: 12 }}
                                >
                                  <X size={18} />
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.12)', display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                                    {count}
                                  </div>
                                  <div>
                                    <h4 style={{ margin: 0 }}>{job.title}</h4>
                                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                      {dept?.name || 'Unknown department'} • Posted {job.createdDate}
                                      {job.closingDate ? ` • Closes ${job.closingDate}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                                  {job.status === 'Open' && (
                                    <button
                                      type="button"
                                      onClick={() => handleJobClose(job.id)}
                                      style={{ fontSize: '12px', padding: '8px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px' }}
                                    >
                                      Close Posting
                                    </button>
                                  )}
                                </div>

                                <div style={{ marginTop: 12 }}>
                                  <strong style={{ display: 'block', marginBottom: '10px' }}>Applicants</strong>
                                  {jobApplicants.length === 0 ? (
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>No applicants yet for this posting.</p>
                                  ) : (
                                    jobApplicants.map((app: any) => (
                                      <button
                                        key={app.id}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleApplicantSelect(app); }}
                                        className="btn-secondary"
                                        style={{ width: '100%', textAlign: 'left', marginBottom: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 700 }}>{app.name}</div>
                                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.status}</div>
                                        </div>
                                        <ChevronRight size={16} />
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {isCreatingJob && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="chart-title">New Posting</h3>
                <button className="close-btn" style={{ cursor: 'pointer' }} onClick={() => setIsCreatingJob(false)}>Cancel</button>
              </div>
              <form onSubmit={handleJobSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Product Designer"
                    className="form-control"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-control"
                    value={jobForm.departmentId}
                    onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })}
                    required
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details..."
                    className="form-control"
                    style={{ fontFamily: 'inherit' }}
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={jobForm.closingDate}
                    onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })}
                  />
                  <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Optional: automatically close this posting on the selected date.
                  </p>
                </div>
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Publish Posting
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Applicants Board */}
      {activeTab === 'applicants' && (
        <div>
          <div style={{ margin: '16px 0', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Search applicants</label>
              <input
                type="text"
                placeholder="Name, email, job title"
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Filter by job</label>
              <select
                className="form-control"
                value={applicantFilterJobId}
                onChange={(e) => setApplicantFilterJobId(e.target.value)}
              >
                <option value="">All jobs</option>
                {postings.map((job: any) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Filter by status</label>
              <select
                className="form-control"
                value={applicantFilterStatus}
                onChange={(e) => setApplicantFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Applied date</label>
              <input
                type="date"
                className="form-control"
                value={applicantFilterDate}
                onChange={(e) => setApplicantFilterDate(e.target.value)}
              />
            </div>
          </div>

          <div className="kanban-board">
            {stages.map(stage => {
              const list = stageApplicants(stage);
              return (
                <div key={stage} className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title">{stage}</span>
                    <span className="kanban-column-count">{list.length}</span>
                  </div>

                  {list.length === 0 ? (
                    <div style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                      Empty Column
                    </div>
                  ) : (
                    list.map((app: any) => {
                      const job = postings.find((j: any) => j.id === app.jobId);
                      return (
                        <div key={app.id} className="kanban-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={getApplicantAvatar(app.name)}
                              alt={app.name}
                              style={{ width: '44px', height: '44px', borderRadius: '999px', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div className="kanban-card-name">{app.name}</div>
                              <div className="kanban-card-job">{job?.title || 'Unknown Job'}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Applied: {app.appliedDate}</span>
                            <span className={`badge ${app.status === 'Applied' ? 'badge-applied' : app.status === 'Hired' ? 'badge-approved' : 'badge-primary'}`}>
                              {app.status}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ marginTop: '12px', width: '100%', fontSize: '11px', padding: '8px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => handleApplicantSelect(app)}
                          >
                            <ChevronRight size={14} />
                            Details
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Onboarding Checklists */}
      {activeTab === 'onboarding' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {onboardingChecklistEmployees.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
              No employees currently in onboarding.
            </div>
          ) : (
            onboardingChecklistEmployees.map((emp: any) => {
              const dept = departments.find((d: any) => d.id === emp.departmentId);
              const completedCount = emp.onboardingChecklist.filter((t: any) => t.completed).length;
              const totalCount = emp.onboardingChecklist.length;
              const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

              return (
                <div key={emp.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={emp.profilePhoto} alt={emp.name} className="user-avatar" style={{ width: '44px', height: '44px' }} />
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{emp.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {emp.role} • {dept?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                      <span>Progress</span>
                      <span>{completedCount} / {totalCount} ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--accent)', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  {/* Checklist Items list */}
                  <div className="onboarding-list">
                    {emp.onboardingChecklist.map((task: any) => (
                      <div key={task.id} className="onboarding-item" style={{ padding: '8px 12px' }}>
                        <input
                          type="checkbox"
                          className="onboarding-item-checkbox"
                          checked={task.completed}
                          onChange={() => handleChecklistToggle(emp.id, task.id, task.completed)}
                        />
                        <div className="onboarding-item-details">
                          <div className={`onboarding-item-title ${task.completed ? 'completed' : ''}`} style={{ fontSize: '12px' }}>
                            {task.title}
                          </div>
                          <div className="onboarding-item-date" style={{ fontSize: '10px' }}>Due: {task.dueDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedApplicant && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000
          }}
          onClick={closeApplicantModal}
        >
          <div
            className="card"
            style={{
              width: 'min(940px, 100%)',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              position: 'relative',
              padding: '28px',
              borderRadius: '24px'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-btn"
              onClick={closeApplicantModal}
              style={{ position: 'absolute', top: '18px', right: '18px' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <img
                src={getApplicantAvatar(selectedApplicant.name)}
                alt={selectedApplicant.name}
                style={{ width: '88px', height: '88px', borderRadius: '999px', objectFit: 'cover', border: '2px solid rgba(59, 130, 246, 0.16)' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedApplicant.name}</h2>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Applied for {postings.find((j: any) => j.id === selectedApplicant.jobId)?.title || 'Unknown role'} • {selectedApplicant.appliedDate}
                    </p>
                  </div>
                  <span className={`badge ${selectedApplicant.status === 'Applied' ? 'badge-applied' : selectedApplicant.status === 'Hired' ? 'badge-approved' : 'badge-primary'}`}>
                    {selectedApplicant.status}
                  </span>
                </div>

                <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>Email</p>
                      <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{selectedApplicant.email}</p>
                    </div>
                    {selectedApplicant.phone && (
                      <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)' }}>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>Phone</p>
                        <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{selectedApplicant.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Stage Transition Control */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Move Applicant Stage Pipeline</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {stages.map(stg => (
                        <button
                          key={stg}
                          type="button"
                          onClick={() => handleUpdateStage(selectedApplicant.id, stg)}
                          className="btn-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            backgroundColor: selectedApplicant.status === stg ? 'var(--primary)' : 'var(--bg-primary)',
                            color: selectedApplicant.status === stg ? '#ffffff' : 'var(--text-primary)',
                            borderColor: selectedApplicant.status === stg ? 'var(--primary)' : 'var(--border-color)',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: selectedApplicant.status === stg ? 'bold' : 'normal'
                          }}
                        >
                          {stg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {modalMessage && (
                    <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '13px', fontWeight: 600 }}>
                      {modalMessage}
                    </div>
                  )}

                  {modalCredentials && (
                    <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>Onboarding Credentials Generated:</strong>
                      <div><strong>Email:</strong> {modalCredentials.email}</div>
                      <div><strong>Username:</strong> {modalCredentials.username}</div>
                      <div><strong>Password:</strong> {modalCredentials.password}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>(These credentials have been saved to the database. The candidate has been added to the employees roster)</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>Resume Text</p>
                      <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', fontSize: '13px', color: selectedApplicant.resumeText ? 'inherit' : 'var(--text-muted)' }}>
                        {selectedApplicant.resumeText || 'Resume transcript not available.'}
                      </p>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>Cover Note</p>
                      <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', fontSize: '13px', color: selectedApplicant.coverNote ? 'inherit' : 'var(--text-muted)' }}>
                        {selectedApplicant.coverNote || 'No cover note provided.'}
                      </p>
                    </div>
                  </div>

                  {selectedApplicant.resumeUrl && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>Resume Upload</p>
                      <a
                        href={selectedApplicant.resumeUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        download={selectedApplicant.resumeUrl.startsWith('data:') ? `${selectedApplicant.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf` : undefined}
                        className="btn-primary"
                        style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '13px' }}
                      >
                        <FileText size={16} />
                        View / Download Resume
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
