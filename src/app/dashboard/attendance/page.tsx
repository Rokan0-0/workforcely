'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Calendar, Clock, Plus, HelpCircle, AlertCircle } from 'lucide-react';

function calculateDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export default function AttendancePage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Leave Submit Form State (Employee only)
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Manual Attendance Logger State (Admin only)
  const [manualLog, setManualLog] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:00:00',
    clockOut: '17:00:00',
    status: 'Present'
  });
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Admin filter states
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');
  const [attSearch, setAttSearch] = useState('');

  // Fetch Attendance and Leaves
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const cacheKey = `/api/attendance-${user.role}-${user.id}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        const empUrl = '/api/employees';
        const attUrl = '/api/attendance' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '');
        const leaveUrl = '/api/leave' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '');

        const [empRes, attRes, leaveRes] = await Promise.all([
          fetch(empUrl),
          fetch(attUrl),
          fetch(leaveUrl)
        ]);

        const emps = await empRes.json();
        const atts = await attRes.json();
        const leaves = await leaveRes.json();

        const result = {
          employees: emps.employees,
          departments: emps.departments,
          attendance: atts.attendance,
          leaves: leaves.leaves,
          balances: leaves.balances // Only returned for Employee query
        };
        setData(result);
        setCachedData(cacheKey, result);

        // Set default manual employee selection for Admin
        if (user.role === 'HR Admin' && emps.employees.length > 0) {
          setManualLog(prev => ({ ...prev, employeeId: emps.employees[0].id }));
        }
      } catch (err) {
        console.error('Failed to load page data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshFlag]);

  // Submit Leave Request (Employee)
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.id,
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason
        })
      });

      const result = await res.json();
      if (result.success) {
        setFormSuccess('Leave request submitted successfully for approval.');
        setLeaveForm({ leaveType: 'Annual', startDate: '', endDate: '', reason: '' });
        triggerRefresh();
      } else {
        setFormError(result.error || 'Failed to submit request');
      }
    } catch (err) {
      setFormError('Network error, please try again.');
    }
  };

  // Submit Manual Attendance Log (Admin)
  const handleManualAttSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSuccess(null);
    setManualError(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          employeeId: manualLog.employeeId,
          date: manualLog.date,
          clockIn: manualLog.clockIn,
          clockOut: manualLog.clockOut,
          status: manualLog.status
        })
      });

      const result = await res.json();
      if (result.success) {
        setManualSuccess('Attendance log updated successfully.');
        triggerRefresh();
      } else {
        setManualError(result.error || 'Failed to log attendance');
      }
    } catch (err) {
      setManualError('Network error, please try again.');
    }
  };

  // Quick Action Approve / Reject leave
  const handleLeaveAction = async (id: string, status: 'Approved' | 'Rejected') => {
    const comment = prompt(`Add an optional comment for this ${status.toLowerCase()} action:`);
    try {
      const res = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, approvalComment: comment || '' })
      });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error('Leave action failed', err);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading attendance & leave workflows...
      </div>
    );
  }

  const { employees, leaves, attendance } = data;
  const isAdmin = user?.role === 'HR Admin';

  // Admin leaves filtering
  const filteredLeaves = leaves.filter((l: any) => {
    if (leaveStatusFilter === 'all') return true;
    return l.status === leaveStatusFilter;
  });

  // Admin attendance filtering
  const filteredAtt = attendance.filter((att: any) => {
    const emp = employees.find((e: any) => e.id === att.employeeId);
    if (!emp) return false;
    return emp.name.toLowerCase().includes(attSearch.toLowerCase()) || att.date.includes(attSearch);
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Admin calculations: leaves balances for all employees
  // Base: 20 Annual, 10 Sick, 5 Casual
  const employeeLeaveBalances = employees.map((emp: any) => {
    const empLeaves = leaves.filter((l: any) => l.employeeId === emp.id && l.status === 'Approved');
    let annualUsed = 0, sickUsed = 0, casualUsed = 0;
    empLeaves.forEach((l: any) => {
      const days = calculateDays(l.startDate, l.endDate);
      if (l.leaveType === 'Annual') annualUsed += days;
      if (l.leaveType === 'Sick') sickUsed += days;
      if (l.leaveType === 'Casual') casualUsed += days;
    });

    return {
      id: emp.id,
      name: emp.name,
      annual: 20 - annualUsed,
      sick: 10 - sickUsed,
      casual: 5 - casualUsed
    };
  });

  return (
    <div className="page-container">
      {isAdmin ? (
        // ================= HR ADMIN VIEW =================
        <>
          {/* Top sections: Manual log & leave request approval */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
            {/* Leave Requests dashboard */}
            <div className="table-card" style={{ height: '100%' }}>
              <div className="table-header-area">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="var(--primary)" />
                  <h2 className="chart-title">Leave Request Approvals</h2>
                </div>
                <select
                  className="filter-select"
                  value={leaveStatusFilter}
                  onChange={(e) => setLeaveStatusFilter(e.target.value)}
                >
                  <option value="all">All Request Statuses</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No leave requests logged.
                        </td>
                      </tr>
                    ) : (
                      filteredLeaves.map((l: any) => {
                        const emp = employees.find((e: any) => e.id === l.employeeId);
                        const days = calculateDays(l.startDate, l.endDate);
                        return (
                          <tr key={l.id}>
                            <td>
                              <div className="table-user-cell">
                                <img src={emp?.profilePhoto} alt={emp?.name} className="table-user-avatar" style={{ width: '30px', height: '30px' }} />
                                <div>
                                  <span className="table-user-name" style={{ fontSize: '13px' }}>{emp?.name}</span>
                                  <div className="table-user-email" style={{ fontSize: '11px' }}>{l.reason}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="badge badge-late">{l.leaveType}</span></td>
                            <td>
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{days} days</span>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.startDate} to {l.endDate}</div>
                            </td>
                            <td>
                              <span className={`badge ${l.status === 'Approved' ? 'badge-approved' : l.status === 'Rejected' ? 'badge-absent' : 'badge-late'}`}>
                                {l.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {l.status === 'Pending' ? (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--success)' }} onClick={() => handleLeaveAction(l.id, 'Approved')}>Approve</button>
                                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleLeaveAction(l.id, 'Rejected')}>Reject</button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  {l.approvalComment ? `"${l.approvalComment}"` : '-'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual Logger Form */}
            <div className="card">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Clock size={18} color="var(--primary)" />
                Correct Attendance Log
              </h3>
              
              {manualSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px', border: '1px solid var(--success)' }}>{manualSuccess}</div>}
              {manualError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px', border: '1px solid var(--danger)' }}>{manualError}</div>}

              <form onSubmit={handleManualAttSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select
                    className="form-control"
                    value={manualLog.employeeId}
                    onChange={(e) => setManualLog({ ...manualLog, employeeId: e.target.value })}
                  >
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={manualLog.date}
                    onChange={(e) => setManualLog({ ...manualLog, date: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Clock In</label>
                    <input
                      type="text"
                      placeholder="HH:MM:SS"
                      className="form-control"
                      value={manualLog.clockIn}
                      onChange={(e) => setManualLog({ ...manualLog, clockIn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Clock Out</label>
                    <input
                      type="text"
                      placeholder="HH:MM:SS"
                      className="form-control"
                      value={manualLog.clockOut}
                      onChange={(e) => setManualLog({ ...manualLog, clockOut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Attendance Status</label>
                  <select
                    className="form-control"
                    value={manualLog.status}
                    onChange={(e) => setManualLog({ ...manualLog, status: e.target.value })}
                  >
                    <option value="Present">Present (On Time)</option>
                    <option value="Late">Late Check-in</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Update Record
                </button>
              </form>
            </div>
          </div>

          {/* Bottom sections: Leaves balances & logs history */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Leave balances grid */}
            <div className="table-card">
              <div className="table-header-area">
                <h3 className="chart-title">Remaining Leave Balances</h3>
              </div>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th style={{ textAlign: 'center' }}>Annual</th>
                      <th style={{ textAlign: 'center' }}>Sick</th>
                      <th style={{ textAlign: 'center' }}>Casual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeLeaveBalances.map((bal: any) => (
                      <tr key={bal.id}>
                        <td style={{ fontWeight: 600 }}>{bal.name}</td>
                        <td style={{ textAlign: 'center', color: bal.annual < 5 ? 'var(--danger)' : 'inherit' }}>{bal.annual}d</td>
                        <td style={{ textAlign: 'center' }}>{bal.sick}d</td>
                        <td style={{ textAlign: 'center' }}>{bal.casual}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance logs history */}
            <div className="table-card">
              <div className="table-header-area">
                <h3 className="chart-title">Historical Attendance Log</h3>
                <div className="search-input-wrapper" style={{ width: '200px' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search name/date..."
                    style={{ padding: '8px 12px 8px 12px' }}
                    value={attSearch}
                    onChange={(e) => setAttSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAtt.slice(0, 100).map((att: any) => {
                      const emp = employees.find((e: any) => e.id === att.employeeId);
                      return (
                        <tr key={att.id}>
                          <td><strong>{emp?.name || 'Unknown'}</strong></td>
                          <td>{att.date}</td>
                          <td>{att.clockIn || '-'}</td>
                          <td>{att.clockOut || '-'}</td>
                          <td>
                            <span className={`badge ${att.status === 'Present' ? 'badge-approved' : att.status === 'Late' ? 'badge-late' : 'badge-absent'}`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        // ================= EMPLOYEE VIEW =================
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left column: submit request */}
          <div className="card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Calendar size={18} color="var(--primary)" />
              Submit Leave Request
            </h3>
            
            {formSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px', border: '1px solid var(--success)' }}>{formSuccess}</div>}
            {formError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px', border: '1px solid var(--danger)' }}>{formError}</div>}

            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  className="form-control"
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                >
                  <option value="Annual">Annual (Holiday)</option>
                  <option value="Sick">Sick (Medical)</option>
                  <option value="Casual">Casual (Personal)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for request</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide details..."
                  className="form-control"
                  style={{ fontFamily: 'inherit' }}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                Submit Request
              </button>
            </form>
          </div>

          {/* Right column: status tracking & attendance log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Status tracking table */}
            <div className="table-card">
              <div className="table-header-area">
                <h3 className="chart-title">My Leave Applications</h3>
              </div>
              <div className="table-responsive">
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Dates</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Admin Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                          No leave applications recorded.
                        </td>
                      </tr>
                    ) : (
                      leaves.map((l: any) => {
                        const days = calculateDays(l.startDate, l.endDate);
                        return (
                          <tr key={l.id}>
                            <td>
                              <strong>{days} days</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.startDate} to {l.endDate}</div>
                            </td>
                            <td><span className="badge badge-enrolled">{l.leaveType}</span></td>
                            <td>{l.reason}</td>
                            <td>
                              <span className={`badge ${l.status === 'Approved' ? 'badge-approved' : l.status === 'Rejected' ? 'badge-absent' : 'badge-late'}`}>
                                {l.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                {l.approvalComment || '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* personal clock logs */}
            <div className="table-card">
              <div className="table-header-area">
                <h3 className="chart-title">My Personal Clock History</h3>
              </div>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                          No personal attendance logs found.
                        </td>
                      </tr>
                    ) : (
                      attendance.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((att: any) => (
                        <tr key={att.id}>
                          <td>{att.date}</td>
                          <td>{att.clockIn || '-'}</td>
                          <td>{att.clockOut || '-'}</td>
                          <td>
                            <span className={`badge ${att.status === 'Present' ? 'badge-approved' : att.status === 'Late' ? 'badge-late' : 'badge-absent'}`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
