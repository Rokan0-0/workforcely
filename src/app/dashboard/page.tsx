'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from './session-provider';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
  AreaChart, Area
} from 'recharts';
import { CheckSquare, Calendar, Award, BookOpen, Clock, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Clock state (for Employee view)
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [todayLog, setTodayLog] = useState<any>(null);
  const [clockActionLoading, setClockActionLoading] = useState(false);

  // Base date for matching data: 2026-06-14
  const TODAY_STR = '2026-06-14';

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all DB details
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      const cacheKey = `/api/dashboard-${user.role}-${user.id}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        // Fetch APIs concurrently
        const [empRes, attRes, leaveRes, payRes, perfRes, trainRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/attendance'),
          fetch('/api/leave' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '')),
          fetch('/api/payroll' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '')),
          fetch('/api/performance' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '')),
          fetch('/api/training')
        ]);

        const emps = await empRes.json();
        const atts = await attRes.json();
        const leaves = await leaveRes.json();
        const pay = await payRes.json();
        const perf = await perfRes.json();
        const train = await trainRes.json();

        const result = {
          employees: emps.employees,
          departments: emps.departments,
          attendance: atts.attendance,
          leaves: leaves.leaves,
          balances: leaves.balances,
          payroll: pay.payroll,
          reviews: perf.reviews,
          courses: train.courses,
          enrollments: train.enrollments
        };
        setData(result);
        setCachedData(cacheKey, result);

        // If employee, find today's clock in log
        if (user.role === 'Employee') {
          const matched = atts.attendance.find((a: any) => a.employeeId === user.id && a.date === TODAY_STR);
          setTodayLog(matched || null);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, refreshFlag]);

  // Clock-in / Clock-out Action
  const handleClockAction = async (action: 'clockIn' | 'clockOut') => {
    if (!user) return;
    setClockActionLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          action,
          date: TODAY_STR // Clocking relative to our mock date
        })
      });
      if (res.ok) {
        const result = await res.json();
        setTodayLog(result.log);
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed clock action', err);
    } finally {
      setClockActionLoading(false);
    }
  };

  // Toggle onboarding checklist completion status
  const handleChecklistToggle = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateChecklist',
          employeeId: user.id,
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

  // Quick Action Approve / Reject leave
  const handleLeaveAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
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
        Loading dashboard metrics and analytical charts...
      </div>
    );
  }

  // --- HR ADMIN CALCULATIONS ---
  const employees = data.employees || [];
  const departments = data.departments || [];
  const attendanceLogs = data.attendance || [];
  const leaveRequests = data.leaves || [];
  const payrollLogs = data.payroll || [];
  const reviews = data.reviews || [];
  const enrollments = data.enrollments || [];
  const courses = data.courses || [];

  const totalHeadcount = employees.length;
  const pendingLeaves = leaveRequests.filter((l: any) => l.status === 'Pending');

  // Today's Attendance calculation (using latest logged date in DB, which is 2026-06-12)
  const LATEST_WORK_DATE = '2026-06-12';
  const latestAttLogs = attendanceLogs.filter((a: any) => a.date === LATEST_WORK_DATE);
  const presentCount = latestAttLogs.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;
  const activeEmpCount = employees.filter((e: any) => new Date(e.hireDate) <= new Date(LATEST_WORK_DATE)).length;
  const attendanceRate = activeEmpCount > 0 ? Math.round((presentCount / activeEmpCount) * 100) : 100;

  // Last Month Payroll Cost: May 2026
  const lastMonthPayroll = payrollLogs.filter((p: any) => p.month === '2026-05');
  const lastMonthCost = lastMonthPayroll.reduce((sum: number, p: any) => sum + p.netPay, 0);

  // Department Headcount Chart Data
  const deptColors = ['#1e3a5f', '#14b8a6', '#f59e0b', '#10b981', '#6366f1'];
  const headcountChartData = departments.map((d: any) => ({
    name: d.name,
    value: employees.filter((e: any) => e.departmentId === d.id).length
  }));

  // Attendance Trends Chart Data (last 8 business days up to June 12, 2026)
  const attTrendDates = Array.from(new Set(attendanceLogs.map((a: any) => a.date)))
    .sort()
    .slice(-8) as string[];

  const attendanceTrendData = attTrendDates.map((date: any) => {
    const dayLogs = attendanceLogs.filter((a: any) => a.date === date);
    const present = dayLogs.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;
    const rate = dayLogs.length > 0 ? Math.round((present / dayLogs.length) * 100) : 0;
    return {
      date: date.substring(5), // MM-DD
      Rate: rate
    };
  });

  // Payroll Cost Breakdown
  const payrollMonths = Array.from(new Set(payrollLogs.map((p: any) => p.month))).sort() as string[];
  const payrollTrendData = payrollMonths.map((m: any) => {
    const monthPays = payrollLogs.filter((p: any) => p.month === m);
    return {
      month: m,
      Cost: monthPays.reduce((sum: number, p: any) => sum + p.netPay, 0)
    };
  });

  // Performance Rating Distribution
  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0-4 represents rating 1-5
  reviews.forEach((r: any) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });
  const performanceChartData = ratingCounts.map((count, index) => ({
    rating: `★ ${index + 1}`,
    Count: count
  }));

  // --- EMPLOYEE CALCULATIONS ---
  const myProfile = employees.find((e: any) => e.id === user?.id);
  const myEnrollments = enrollments.filter((e: any) => e.employeeId === user?.id)
    .map((e: any) => {
      const c = courses.find((c: any) => c.id === e.courseId);
      return {
        ...e,
        title: c?.title || 'Unknown Course'
      };
    });

  return (
    <div className="page-container">
      {user?.role === 'HR Admin' ? (
        // ================= HR ADMIN VIEW =================
        <>
          {/* Top Metrics Grid */}
          <div className="dashboard-grid">
            <div className="card">
              <h3 className="card-title">Total Headcount</h3>
              <div className="card-value">{totalHeadcount}</div>
              <div className="card-footer">
                <span className="trend-up">Active Employees</span>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Attendance Rate</h3>
              <div className="card-value">{attendanceRate}%</div>
              <div className="card-footer">
                <span className="trend-up">On latest date ({LATEST_WORK_DATE})</span>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Pending Leave Requests</h3>
              <div className="card-value">{pendingLeaves.length}</div>
              <div className="card-footer">
                <span className="trend-down">{pendingLeaves.length > 0 ? 'Action required' : 'All caught up'}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Payroll Cost (May)</h3>
              <div className="card-value">₦{lastMonthCost.toLocaleString()}</div>
              <div className="card-footer">
                <span className="trend-up">Total net paid</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Headcount by Dept */}
            <div className="chart-card">
              <div className="chart-header">
                <h4 className="chart-title">Headcount by Department</h4>
                <p className="chart-subtitle">Distribution across active departments</p>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={headcountChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {headcountChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={deptColors[index % deptColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Employees`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance trends */}
            <div className="chart-card">
              <div className="chart-header">
                <h4 className="chart-title">Attendance Trends (%)</h4>
                <p className="chart-subtitle">Daily present/late rate for last 8 workdays</p>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[50, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Rate" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payroll trends */}
            <div className="chart-card">
              <div className="chart-header">
                <h4 className="chart-title">Payroll Monthly Trend (₦ Net Cost)</h4>
                <p className="chart-subtitle">Overall net payments history log</p>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payrollTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => [`₦${Number(v).toLocaleString()}`]} />
                    <Area type="monotone" dataKey="Cost" stroke="var(--primary)" fill="rgba(30, 58, 95, 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance rating distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <h4 className="chart-title">Performance Rating Distribution</h4>
                <p className="chart-subtitle">Number of employee reviews by rating score (1-5)</p>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="rating" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Count" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pending Leave Requests Module */}
          <div className="table-card">
            <div className="table-header-area">
              <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--primary)" />
                Pending Leaves Requiring HR Action
              </h2>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No pending leave requests needing attention.
                      </td>
                    </tr>
                  ) : (
                    pendingLeaves.map((l: any) => {
                      const emp = employees.find((e: any) => e.id === l.employeeId);
                      return (
                        <tr key={l.id}>
                          <td>
                            <div className="table-user-cell">
                              <img src={emp?.profilePhoto} alt={emp?.name} className="table-user-avatar" />
                              <div>
                                <span className="table-user-name">{emp?.name}</span>
                                <div className="table-user-email">{emp?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-late">{l.leaveType}</span></td>
                          <td>{l.startDate}</td>
                          <td>{l.endDate}</td>
                          <td>{l.reason}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)' }}
                                onClick={() => handleLeaveAction(l.id, 'Approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                onClick={() => handleLeaveAction(l.id, 'Rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // ================= EMPLOYEE VIEW =================
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Clock-in card */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="var(--primary)" />
                  Attendance Clocking Widget
                </h3>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px', marginTop: '6px' }}>
                  {currentTime || '--:--:--'}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{currentDate}</p>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  {todayLog ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '13px' }}>
                        Clocked In: <strong>{todayLog.clockIn}</strong> {todayLog.status === 'Late' && <span className="badge badge-late">Late</span>}
                      </span>
                      {todayLog.clockOut ? (
                        <span style={{ fontSize: '13px' }}>
                          Clocked Out: <strong>{todayLog.clockOut}</strong>
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In progress. Remember to clock out.</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No clock-in record found for today.</span>
                  )}
                </div>
              </div>

              <div>
                {!todayLog ? (
                  <button
                    className="clock-btn clock-btn-in"
                    disabled={clockActionLoading}
                    onClick={() => handleClockAction('clockIn')}
                  >
                    Clock In
                  </button>
                ) : !todayLog.clockOut ? (
                  <button
                    className="clock-btn clock-btn-out"
                    disabled={clockActionLoading}
                    onClick={() => handleClockAction('clockOut')}
                  >
                    Clock Out
                  </button>
                ) : (
                  <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    Completed
                  </div>
                )}
              </div>
            </div>

            {/* Leave balances */}
            <div className="card">
              <h3 className="card-title">My Leave Balances</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                {['Annual', 'Sick', 'Casual'].map(type => {
                  const bal = data.balances?.[type] || { allocated: 0, used: 0, remaining: 0 };
                  return (
                    <div key={type} style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{type}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--primary)' }}>
                        {bal.remaining} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>left</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Used: {bal.used} / {bal.allocated}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Training list */}
            <div className="card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} color="var(--primary)" />
                My Enrolled Courses
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {myEnrollments.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You are not currently enrolled in any training courses.</p>
                ) : (
                  myEnrollments.map((enr: any) => (
                    <div key={enr.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{enr.title}</span>
                        <span className={`badge ${enr.status === 'Completed' ? 'badge-completed' : 'badge-inprogress'}`}>{enr.status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${enr.progress}%`, backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, width: '32px', textAlign: 'right' }}>{enr.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar: Onboarding checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={16} color="var(--accent)" />
                Onboarding Checklist
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 16px 0' }}>Complete pending tasks below</p>
              
              {myProfile?.onboardingChecklist && myProfile.onboardingChecklist.length > 0 ? (
                <div className="onboarding-list">
                  {myProfile.onboardingChecklist.map((task: any) => (
                    <div key={task.id} className="onboarding-item">
                      <input
                        type="checkbox"
                        className="onboarding-item-checkbox"
                        checked={task.completed}
                        onChange={() => handleChecklistToggle(task.id, task.completed)}
                      />
                      <div className="onboarding-item-details">
                        <div className={`onboarding-item-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
                        <div className="onboarding-item-date">Due: {task.dueDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <Award size={18} />
                  <div style={{ fontSize: '12px' }}>
                    <strong>Onboarding completed!</strong> All checklist items are checked off.
                  </div>
                </div>
              )}
            </div>

            {/* Performance Goals summary */}
            <div className="card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} color="var(--primary)" />
                Goals & Review Snapshot
              </h3>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.reviews && data.reviews.length > 0 ? (
                  (() => {
                    const latest = data.reviews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>Last Cycle Review Rating:</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--warning)' }}>★ {latest.rating} / 5</span>
                        </div>
                        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '12px', borderLeft: '3px solid var(--primary)' }}>
                          <em>"{latest.comments}"</em>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>Active Review Goals:</div>
                        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          {latest.goals.map((g: any) => (
                            <li key={g.id} style={{ color: g.status === 'Completed' ? 'var(--success)' : 'var(--text-primary)' }}>
                              {g.title} ({g.weight}%) — <strong>{g.status}</strong>
                            </li>
                          ))}
                        </ul>
                      </>
                    );
                  })()
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>No review goals currently assigned.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
