'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { AlertTriangle, FileText, Plus, X, ChevronRight, Clock, User, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function IncidentsPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states for submitting new report (Employee)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [category, setCategory] = useState('Safety');
  const [description, setDescription] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Admin details modal
  const [activeReport, setActiveReport] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('Under Review');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [warningSuccess, setWarningSuccess] = useState<string | null>(null);
  const [warningError, setWarningError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Fetch incidents & employees
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const cacheKey = `/api/incidents-${user.role}-${user.id}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        const [empRes, incRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/incidents')
        ]);

        const emps = await empRes.json();
        const incs = await incRes.json();

        const result = {
          employees: emps.employees,
          departments: emps.departments,
          incidents: incs.incidents || []
        };
        setData(result);
        setCachedData(cacheKey, result);
      } catch (err) {
        console.error('Failed to load incident data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshFlag]);

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading incident logs and outcome history...
      </div>
    );
  }

  const { employees, departments, incidents } = data;
  const isAdmin = user?.role === 'HR Admin';

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, evidenceNote, targetEmployeeId: targetEmployeeId || undefined })
      });
      const result = await res.json();
      if (result.success) {
        setSubmitSuccess('Incident report submitted successfully.');
        setDescription('');
        setEvidenceNote('');
        setTargetEmployeeId('');
        triggerRefresh();
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitSuccess(null);
        }, 1500);
      } else {
        setSubmitError(result.error || 'Failed to submit report.');
      }
    } catch (err) {
      setSubmitError('Network error, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    setUpdating(true);
    setUpdateSuccess(null);
    setUpdateError(null);
    try {
      const res = await fetch('/api/incidents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeReport.id,
          status: newStatus,
          outcomeNote
        })
      });
      const result = await res.json();
      if (result.success) {
        setUpdateSuccess('Status updated and notification sent.');
        setOutcomeNote('');
        
        // Find the index of the updated incident in the current state list
        const updatedIncidents = incidents.map((inc: any) => 
          inc.id === activeReport.id ? result.incident : inc
        );
        setData((prev: any) => ({
          ...prev,
          incidents: updatedIncidents
        }));
        
        // Update active report in view
        setActiveReport(result.incident);
        triggerRefresh();
        setTimeout(() => {
          setUpdateSuccess(null);
        }, 3000);
      } else {
        setUpdateError(result.error || 'Failed to update status.');
      }
    } catch (err) {
      setUpdateError('Network error, please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    setSendingWarning(true);
    setWarningSuccess(null);
    setWarningError(null);
    try {
      const res = await fetch('/api/incidents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeReport.id,
          action: 'sendWarningToTarget',
          warningMessage: warningMsg
        })
      });
      const result = await res.json();
      if (result.success) {
        setWarningSuccess('Disciplinary warning memo sent successfully.');
        setWarningMsg('');
        setActiveReport(result.incident);
        
        const updatedIncidents = incidents.map((inc: any) => 
          inc.id === activeReport.id ? result.incident : inc
        );
        setData((prev: any) => ({
          ...prev,
          incidents: updatedIncidents
        }));
        triggerRefresh();
        setTimeout(() => {
          setWarningSuccess(null);
        }, 3000);
      } else {
        setWarningError(result.error || 'Failed to send warning notice.');
      }
    } catch (err) {
      setWarningError('Network error, please try again.');
    } finally {
      setSendingWarning(false);
    }
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find((e: any) => e.id === empId);
    return emp ? emp.name : 'Unknown Employee';
  };

  const getEmployeeDept = (empId: string) => {
    const emp = employees.find((e: any) => e.id === empId);
    if (!emp) return 'General';
    const dept = departments.find((d: any) => d.id === emp.departmentId);
    return dept ? dept.name : 'General';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Under Review': return { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
      case 'Verbal Warning': return { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316' };
      case 'Written Warning': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'Suspension': return { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' };
      case 'Resolved': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'Escalated': return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' };
      case 'Investigation Logged': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'Hazard Mitigated': return { bg: 'rgba(20, 184, 166, 0.1)', color: '#20b8a6' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' };
    }
  };

  // Disciplinary history logs grouped by employee for HR Review only
  const getDisciplinaryHistory = () => {
    const historyMap: { [key: string]: any[] } = {};
    incidents.forEach((inc: any) => {
      // Disciplinary actions include warnings, suspensions, etc.
      inc.history.forEach((h: any) => {
        if (['Verbal Warning', 'Written Warning', 'Suspension', 'Resolved', 'Escalated'].includes(h.status)) {
          if (!historyMap[inc.employeeId]) {
            historyMap[inc.employeeId] = [];
          }
          historyMap[inc.employeeId].push({
            incidentId: inc.id,
            category: inc.category,
            status: h.status,
            note: h.note,
            date: h.date
          });
        }
      });
    });
    return historyMap;
  };

  const disciplinaryHistory = getDisciplinaryHistory();

  return (
    <div className="page-container">
      {/* Header Widget */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={22} color="var(--primary)" />
            Incident Reports & Disciplinary Registry
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isAdmin 
              ? 'Review occupational safety reports, conflicts, and assign resolved outcomes or warning metrics.' 
              : 'Submit safety hazards, policy breaches, or workplace conflicts to HR securely and track status updates.'}
          </p>
        </div>
        {!isAdmin && (
          <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>
            <Plus size={16} /> File New Incident Report
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 340px' : '1fr', gap: '24px', marginTop: '24px' }}>
        {/* Incident List */}
        <div className="table-card">
          <div className="table-header-area">
            <h3 className="chart-title">Logged Workplace Incidents ({incidents.length})</h3>
          </div>
          <div className="table-responsive">
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  {isAdmin && <th>Employee</th>}
                  <th>Category</th>
                  <th>Incident Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No workplace incident reports logged.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc: any) => {
                    const statusColor = getStatusBadgeColor(inc.status);
                    return (
                      <tr key={inc.id}>
                        <td><strong>{inc.id}</strong></td>
                        {isAdmin && (
                          <td>
                            <strong>{getEmployeeName(inc.employeeId)}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getEmployeeDept(inc.employeeId)}</div>
                          </td>
                        )}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                          }}>
                            <AlertTriangle size={13} style={{ color: 'var(--text-muted)' }} />
                            {inc.category}
                          </span>
                        </td>
                        <td>{inc.date}</td>
                        <td>
                          <div style={{
                            maxWidth: '280px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {inc.description}
                          </div>
                          {inc.evidenceNote && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evid: {inc.evidenceNote}</div>}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: statusColor.bg,
                            color: statusColor.color
                          }}>
                            {inc.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => {
                              setActiveReport(inc);
                              setNewStatus(inc.status);
                              setOutcomeNote('');
                            }}
                          >
                            {isAdmin ? 'Review / Resolve' : 'View History'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* HR Disciplinary Log Sidebar (HR Admin View Only) */}
        {isAdmin && (
          <div className="card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldAlert size={18} color="var(--primary)" />
              Outcome History Log
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Summary of all warning and sanction actions recorded across employees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              {Object.keys(disciplinaryHistory).length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                  No warnings or disciplinary outcomes issued.
                </div>
              ) : (
                Object.entries(disciplinaryHistory).map(([empId, historyList]: [string, any[]]) => (
                  <div key={empId} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {getEmployeeName(empId)} ({getEmployeeDept(empId)})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {historyList.map((hist, idx) => {
                        const statusColor = getStatusBadgeColor(hist.status);
                        return (
                          <div key={idx} style={{ padding: '8px', backgroundColor: 'var(--background-alt)', borderRadius: 'var(--radius-sm)', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: statusColor.color }}>{hist.status}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{hist.date}</span>
                            </div>
                            <div style={{ color: 'var(--text-primary)' }}>{hist.note}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Ref: {hist.incidentId} • {hist.category}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Employee Submit Incident Modal */}
      {!isAdmin && showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">File Workplace Incident Report</h3>
              <button className="close-btn" onClick={() => setShowSubmitModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateIncident}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {submitSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--success)' }}>{submitSuccess}</div>}
                {submitError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--danger)' }}>{submitError}</div>}

                <div className="form-group">
                  <label className="form-label">Report Category</label>
                  <select
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Safety">Occupational Safety / Hazard</option>
                    <option value="Conflict">Workplace Conflict / Dispute</option>
                    <option value="Facility">Facility / Infrastructure Defect</option>
                    <option value="Behavior">Policy Breach / Behavior</option>
                    <option value="Other">Other Issues</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe exactly what happened, including dates, locations, and any individuals involved..."
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Evidence Details / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Attached photos sent to HR / Witness statement available"
                    className="form-control"
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Accused Employee / Person Involved (Optional)</label>
                  <select
                    className="form-control"
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                  >
                    <option value="">-- Select Employee (If applicable) --</option>
                    {employees
                      .filter((emp: any) => emp.id !== user?.id)
                      .map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Details Modal */}
      {activeReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Incident Report Details</h3>
              <button className="close-btn" onClick={() => setActiveReport(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--background-alt)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>REPORT ID</div>
                  <strong style={{ fontSize: '14px' }}>{activeReport.id}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>STATUS</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    ...getStatusBadgeColor(activeReport.status)
                  }}>
                    {activeReport.status}
                  </span>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>EMPLOYEE</div>
                  <strong>{getEmployeeName(activeReport.employeeId)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>DEPARTMENT</div>
                  <strong>{getEmployeeDept(activeReport.employeeId)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>CATEGORY</div>
                  <strong>{activeReport.category}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>DATE SUBMITTED</div>
                  <strong>{activeReport.date}</strong>
                </div>
                {activeReport.targetEmployeeId && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ACCUSED / TARGET EMPLOYEE</div>
                    <strong style={{ color: 'var(--danger)' }}>{getEmployeeName(activeReport.targetEmployeeId)} ({getEmployeeDept(activeReport.targetEmployeeId)})</strong>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Incident Description</h4>
                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '13px', lineHeight: 1.5, backgroundColor: 'var(--bg-primary)' }}>
                  {activeReport.description}
                </div>
              </div>

              {activeReport.evidenceNote && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Evidence Summary</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{activeReport.evidenceNote}</p>
                </div>
              )}

              {/* Progress timeline / history */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} />
                  Case Resolution Timeline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px solid var(--border-color)' }}>
                  {activeReport.history.map((hist: any, idx: number) => {
                    const statusColor = getStatusBadgeColor(hist.status);
                    return (
                      <div key={idx} style={{ position: 'relative', paddingLeft: '16px' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-13px',
                          top: '2px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: statusColor.color
                        }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                          <span style={{ color: statusColor.color }}>{hist.status}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{hist.date}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{hist.note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HR Review Action Box */}
              {isAdmin && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--primary)' }}>Update Incident Status & Resolution Outcome</h4>
                  
                  {updateSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--success)', marginBottom: '12px' }}>{updateSuccess}</div>}
                  {updateError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--danger)', marginBottom: '12px' }}>{updateError}</div>}

                  <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>Select Resolution Stage</label>
                        <select
                          className="form-control"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        >
                          {['Safety', 'Facility'].includes(activeReport.category) ? (
                            <>
                              <option value="Under Review">Under Review</option>
                              <option value="Investigation Logged">Investigation Logged</option>
                              <option value="Hazard Mitigated">Hazard Mitigated / Action Taken</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Escalated">Escalated</option>
                            </>
                          ) : (
                            <>
                              <option value="Under Review">Under Review</option>
                              <option value="Verbal Warning">Verbal Warning</option>
                              <option value="Written Warning">Written Warning</option>
                              <option value="Suspension">Suspension</option>
                              <option value="Resolved">Resolved (No Action)</option>
                              <option value="Escalated">Escalated</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Resolution Outcome Note (Logged to history & employee notification)</label>
                      <input
                        type="text"
                        required
                        placeholder={['Safety', 'Facility'].includes(activeReport.category) ? "Detail hazard mitigation actions taken (e.g. wet floor cleaned, warning sign installed, etc.)" : "Detail the actions taken, warnings issued, or reasons for escalation..."}
                        className="form-control"
                        value={outcomeNote}
                        onChange={(e) => setOutcomeNote(e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} disabled={updating}>
                        {updating ? 'Saving Status...' : 'Apply Status Update'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Disciplinary Warning Box */}
              {isAdmin && activeReport.targetEmployeeId && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--danger)' }}>
                    Disciplinary Action: Issue Notice to Accused Employee
                  </h4>
                  <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Send a warning memo directly to <strong>{getEmployeeName(activeReport.targetEmployeeId)}</strong> concerning this incident. This will post immediately to their notifications center.
                  </p>
                  
                  {warningSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--success)', marginBottom: '12px' }}>{warningSuccess}</div>}
                  {warningError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--danger)', marginBottom: '12px' }}>{warningError}</div>}

                  <form onSubmit={handleSendWarning} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Warning / Memo Message</label>
                      <textarea
                        required
                        rows={3}
                        placeholder={`E.g., HR is investigating a report of workplace conflict filed against you. Please schedule a meeting...`}
                        className="form-control"
                        value={warningMsg}
                        onChange={(e) => setWarningMsg(e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px', resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={sendingWarning}>
                        {sendingWarning ? 'Sending Notice...' : `Send Warning Memo to ${getEmployeeName(activeReport.targetEmployeeId).split(' ')[0]}`}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
