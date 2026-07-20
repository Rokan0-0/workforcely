'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { AlertTriangle, FileText, Plus, X, ChevronRight, Clock, User, CheckCircle, AlertCircle, ShieldAlert, Timer, Send } from 'lucide-react';

export default function IncidentsPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'incidents' | 'disciplinary-queries'
  const [activeTab, setActiveTab] = useState<'incidents' | 'disciplinary-queries'>('disciplinary-queries');

  // Query Authoring Form (HR)
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryEmpId, setQueryEmpId] = useState('');
  const [queryTitle, setQueryTitle] = useState('');
  const [queryCategory, setQueryCategory] = useState<'Absence' | 'Negligence' | 'Misconduct' | 'Performance' | 'Policy Violation'>('Absence');
  const [queryDescription, setQueryDescription] = useState('');
  const [queryMessage, setQueryMessage] = useState<string | null>(null);

  // Defense Submission (Employee)
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [defenseText, setDefenseText] = useState('');
  const [defenseMsg, setDefenseMsg] = useState<string | null>(null);

  // Report Modal (Employee)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [category, setCategory] = useState('Safety');
  const [description, setDescription] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Admin details modal
  const [activeReport, setActiveReport] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('Under Review');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const [empRes, incRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/incidents')
        ]);
        const emps = await empRes.json();
        const incs = await incRes.json();

        setData({
          employees: emps.employees || [],
          departments: emps.departments || [],
          incidents: incs.incidents || [],
          queries: incs.queries || []
        });

        if (emps.employees?.length > 0) {
          setQueryEmpId(emps.employees[0].id);
        }
      } catch (err) {
        console.error('Failed to load incidents data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshFlag]);

  const handleIssueQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryTitle || !queryDescription) {
      setQueryMessage('Title and query description are required.');
      return;
    }
    setQueryMessage(null);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issueQuery',
          employeeId: queryEmpId,
          title: queryTitle,
          category: queryCategory,
          description: queryDescription,
          issuedBy: user?.name || 'HR Admin'
        })
      });
      const result = await res.json();
      if (result.success) {
        setQueryMessage('Official Query issued successfully (48-hour deadline set).');
        setQueryTitle('');
        setQueryDescription('');
        setShowQueryModal(false);
        triggerRefresh();
      } else {
        setQueryMessage(result.error || 'Failed to issue query.');
      }
    } catch (err) {
      setQueryMessage('Network error, please try again.');
    }
  };

  const handleSubmitDefense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery || !defenseText) return;
    setDefenseMsg(null);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitDefense',
          queryId: selectedQuery.id,
          defenseText
        })
      });
      const result = await res.json();
      if (result.success) {
        setDefenseMsg('Defense submitted successfully to HR.');
        setDefenseText('');
        setSelectedQuery(null);
        triggerRefresh();
      } else {
        setDefenseMsg(result.error || 'Failed to submit defense.');
      }
    } catch (err) {
      setDefenseMsg('Network error, please try again.');
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Disciplinary & Incident Registry...
      </div>
    );
  }

  const { employees, departments, incidents, queries } = data;
  const isAdmin = user?.role === 'HR Admin';
  const myQueries = queries ? queries.filter((q: any) => q.employeeId === user?.id) : [];

  return (
    <div className="page-container">
      {/* Top Header Widget */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={22} color="var(--primary)" />
            Disciplinary Queries & Workplace Incident Studio
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Issue official queries with 48-hour response countdowns, record employee defenses, and maintain an audit-proof disciplinary registry.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin ? (
            <button className="btn-primary" onClick={() => setShowQueryModal(true)}>
              <Plus size={16} /> Issue Official HR Query
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>
              <Plus size={16} /> File New Safety / Incident Report
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`btn-secondary ${activeTab === 'disciplinary-queries' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('disciplinary-queries')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Timer size={16} />
          Disciplinary Queries & Show Cause Notices ({queries?.length || 0})
        </button>
        <button
          className={`btn-secondary ${activeTab === 'incidents' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('incidents')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertTriangle size={16} />
          Workplace Incident Reports ({incidents?.length || 0})
        </button>
      </div>

      {/* TAB 1: DISCIPLINARY QUERIES HUB */}
      {activeTab === 'disciplinary-queries' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Employee Outstanding Queries Box */}
          {!isAdmin && myQueries.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                <Timer size={18} />
                Action Required: Official Query Issued to You ({myQueries.filter((q: any) => q.status === 'Pending Response').length} Pending)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 16px' }}>
                You have received an official HR Query. Under company policy, you must submit a written defense within 48 hours.
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                {myQueries.map((q: any) => (
                  <div key={q.id} style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <strong>{q.title}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Category: {q.category} • Issued by: {q.issuedBy}</div>
                        <p style={{ fontSize: '13px', margin: '8px 0' }}>{q.description}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-pending">{q.status}</span>
                        <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '6px', fontWeight: 600 }}>
                          Deadline: {q.deadlineDate}
                        </div>
                      </div>
                    </div>

                    {q.status === 'Pending Response' && (
                      <button className="btn-primary" style={{ fontSize: '12px', marginTop: '12px' }} onClick={() => setSelectedQuery(q)}>
                        Submit Written Defense
                      </button>
                    )}
                    {q.defenseText && (
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', marginTop: '10px', fontSize: '12px' }}>
                        <strong>Your Defense:</strong> {q.defenseText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queries Registry Table */}
          <div className="table-card">
            <div className="table-header-area">
              <h3 className="chart-title">Disciplinary Query Registry & Legal Audit Logs</h3>
            </div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Query ID</th>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Issued Date</th>
                    <th>Response Deadline</th>
                    <th>Status</th>
                    <th>Defense Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q: any) => {
                    const emp = employees.find((e: any) => e.id === q.employeeId);
                    return (
                      <tr key={q.id}>
                        <td><strong>{q.id}</strong></td>
                        <td><strong>{emp?.name || q.employeeId}</strong></td>
                        <td><span className="badge badge-applied">{q.category}</span></td>
                        <td>{q.title}</td>
                        <td>{q.issuedDate}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>48-Hour Window ({q.deadlineDate})</td>
                        <td><span className={`badge ${q.status === 'Resolved' ? 'badge-completed' : 'badge-pending'}`}>{q.status}</span></td>
                        <td>{q.defenseText ? 'Defense Submitted' : 'Awaiting Defense'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT REPORTS HUB */}
      {activeTab === 'incidents' && (
        <div className="table-card">
          <div className="table-header-area">
            <h3 className="chart-title">Logged Incident Reports ({incidents.length})</h3>
          </div>
          <div className="table-responsive">
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Incident Date</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc: any) => (
                  <tr key={inc.id}>
                    <td><strong>{inc.id}</strong></td>
                    <td>{inc.employeeId}</td>
                    <td><span className="badge badge-applied">{inc.category}</span></td>
                    <td>{inc.date}</td>
                    <td>{inc.description}</td>
                    <td><span className="badge badge-inprogress">{inc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HR Issue Query Modal */}
      {showQueryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Issue Official HR Query</h3>
              <button className="close-btn" onClick={() => setShowQueryModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleIssueQuery}>
              <div className="modal-body" style={{ display: 'grid', gap: '16px' }}>
                {queryMessage && <div style={{ fontSize: '13px', color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>{queryMessage}</div>}

                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select className="form-control" value={queryEmpId} onChange={(e) => setQueryEmpId(e.target.value)}>
                    {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Offense Category *</label>
                  <select className="form-control" value={queryCategory} onChange={(e) => setQueryCategory(e.target.value as any)}>
                    <option value="Absence">Unauthorized Absence / Tardiness</option>
                    <option value="Negligence">Duty Negligence</option>
                    <option value="Misconduct">Misconduct / Behavioral Conflict</option>
                    <option value="Performance">Substandard Performance</option>
                    <option value="Policy Violation">Company Policy Violation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Query Subject / Title *</label>
                  <input className="form-control" placeholder="e.g. Query Regarding Absence from Duty on Monday" value={queryTitle} onChange={(e) => setQueryTitle(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Query Description & Circumstances *</label>
                  <textarea className="form-control" rows={4} placeholder="Detail the specific incident, dates, and request employee's written explanation..." value={queryDescription} onChange={(e) => setQueryDescription(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowQueryModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Issue Query (Set 48h Countdown)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Submit Defense Modal */}
      {selectedQuery && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Submit Written Defense</h3>
              <button className="close-btn" onClick={() => setSelectedQuery(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitDefense}>
              <div className="modal-body" style={{ display: 'grid', gap: '16px' }}>
                {defenseMsg && <div style={{ fontSize: '13px', color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>{defenseMsg}</div>}

                <div>
                  <strong>Query: {selectedQuery.title}</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedQuery.description}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Written Explanation / Defense *</label>
                  <textarea className="form-control" rows={5} placeholder="Provide your full defense statement, explaining any mitigating circumstances..." value={defenseText} onChange={(e) => setDefenseText(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setSelectedQuery(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Defense Statement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
