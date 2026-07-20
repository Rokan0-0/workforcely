'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Award, Plus, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function PerformancePage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // New Performance Review form state
  const [form, setForm] = useState({
    employeeId: '',
    reviewCycle: 'H1 2026 (Mid-Year)',
    rating: '4',
    comments: '',
  });
  const [cycleType, setCycleType] = useState('Semi-Annually');
  const [cyclePeriod, setCyclePeriod] = useState('H1 2026 (Mid-Year)');
  const [goalsList, setGoalsList] = useState<Array<{ title: string, weight: number, status: string }>>([
    { title: 'Achieve Q2 sprint milestones', weight: 50, status: 'In Progress' }
  ]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const getPeriodsForType = (type: string) => {
    switch (type) {
      case 'Quarterly':
        return ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
      case 'Semi-Annually':
        return ['H1 2026 (Mid-Year)', 'H2 2026 (Year-End)'];
      case 'Annually':
        return ['FY 2026 Annual Review', 'FY 2027 Annual Review'];
      default:
        return [];
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const cacheKey = `/api/performance-dashboard-${user.role}-${user.id}`;
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
        const perfUrl = '/api/performance' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '');
        const trainUrl = '/api/training';
        const attUrl = '/api/attendance' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '');
        
        const [empRes, perfRes, trainRes, attRes] = await Promise.all([
          fetch(empUrl),
          fetch(perfUrl),
          fetch(trainUrl),
          fetch(attUrl)
        ]);

        const emps = await empRes.json();
        const perf = await perfRes.json();
        const train = await trainRes.json();
        const att = await attRes.json();

        const result = {
          employees: emps.employees,
          departments: emps.departments,
          reviews: perf.reviews,
          enrollments: train.enrollments,
          attendance: att.attendance
        };
        setData(result);
        setCachedData(cacheKey, result);

        if (user.role === 'HR Admin' && emps.employees.length > 0) {
          setForm(prev => ({ ...prev, employeeId: emps.employees[0].id }));
          setSelectedEmployeeId(emps.employees[0].id);
        }
      } catch (err) {
        console.error('Failed to load performance details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshFlag]);

  const getEmployeeMetrics = (empId: string) => {
    if (!data) return null;
    const { employees, reviews, enrollments, attendance } = data;
    const emp = employees.find((e: any) => e.id === empId);
    if (!emp) return null;

    // 1. Training Completion Rate
    const myEnrollments = enrollments ? enrollments.filter((e: any) => e.employeeId === empId) : [];
    const completedEnrollments = myEnrollments.filter((e: any) => e.status === 'Completed').length;
    const trainingScore = myEnrollments.length ? Math.round((completedEnrollments / myEnrollments.length) * 100) : 100;
    const trainingRatio = `${completedEnrollments}/${myEnrollments.length}`;

    // 2. Punctuality Rate
    const myAttendance = attendance ? attendance.filter((a: any) => a.employeeId === empId) : [];
    const presentCount = myAttendance.filter((a: any) => a.status === 'Present').length;
    const totalAttendance = myAttendance.length;
    const punctualityScore = totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : 100;
    const punctualityRatio = `${presentCount}/${totalAttendance}`;

    // 3. Manager reviews rating
    const myReviews = reviews ? reviews.filter((r: any) => r.employeeId === empId) : [];
    const avgRating = myReviews.length ? Number((myReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / myReviews.length).toFixed(1)) : 4.0;
    const ratingScore = Math.round((avgRating / 5) * 100);

    // 4. Task/Goal completion rate
    const onboardingTasks = emp.onboardingChecklist || [];
    const completedOnboarding = onboardingTasks.filter((t: any) => t.completed).length;
    const reviewGoals = myReviews.flatMap((r: any) => r.goals || []);
    const completedGoals = reviewGoals.filter((g: any) => g.status === 'Completed').length;
    const totalTasks = onboardingTasks.length + reviewGoals.length;
    const completedTasks = completedOnboarding + completedGoals;
    const taskScore = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 100;
    const taskRatio = `${completedTasks}/${totalTasks}`;

    const overallScore = Math.round((trainingScore + punctualityScore + ratingScore + taskScore) / 4);

    return {
      name: emp.name,
      trainingScore,
      trainingRatio,
      punctualityScore,
      punctualityRatio,
      avgRating,
      ratingScore,
      taskScore,
      taskRatio,
      overallScore
    };
  };

  const renderScorecard = (empId: string) => {
    const metrics = getEmployeeMetrics(empId);
    if (!metrics) return null;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Overall score gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRight: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--border-color)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--primary)" strokeWidth="10" 
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - metrics.overallScore / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.overallScore}%
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>Overall Performance</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Averaged Scorecard</span>
        </div>

        {/* Breakdown grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {/* Card 1 */}
          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background-alt)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TRAINING RATE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>{metrics.trainingScore}%</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.trainingScore}%`, height: '100%', backgroundColor: 'var(--primary)' }}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Completed: {metrics.trainingRatio}</div>
          </div>

          {/* Card 2 */}
          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background-alt)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PUNCTUALITY</div>
            <div style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>{metrics.punctualityScore}%</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.punctualityScore}%`, height: '100%', backgroundColor: '#10b981' }}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>On-Time: {metrics.punctualityRatio} days</div>
          </div>

          {/* Card 3 */}
          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background-alt)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MANAGER RATING</div>
            <div style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>{metrics.avgRating} / 5</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.ratingScore}%`, height: '100%', backgroundColor: '#f59e0b' }}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Average stars</div>
          </div>

          {/* Card 4 */}
          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background-alt)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>KPI/ONBOARDING TASKS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>{metrics.taskScore}%</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.taskScore}%`, height: '100%', backgroundColor: '#a855f7' }}></div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Completed: {metrics.taskRatio}</div>
          </div>
        </div>
      </div>
    );
  };

  // Handle adding goal row in form
  const handleAddGoalRow = () => {
    setGoalsList([...goalsList, { title: '', weight: 10, status: 'Not Started' }]);
  };

  // Handle removing goal row
  const handleRemoveGoalRow = (index: number) => {
    setGoalsList(goalsList.filter((_, i) => i !== index));
  };

  const handleGoalFieldChange = (index: number, field: string, value: any) => {
    const next = [...goalsList];
    (next[index] as any)[field] = value;
    setGoalsList(next);
  };

  // Submit Performance Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validate weights sum up to 100
    const sum = goalsList.reduce((sum, g) => sum + Number(g.weight), 0);
    if (sum !== 100) {
      setErrorMsg(`Goal weights must sum up to exactly 100% (currently ${sum}%).`);
      return;
    }

    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createReview',
          employeeId: form.employeeId,
          reviewCycle: cyclePeriod,
          rating: Number(form.rating),
          comments: form.comments,
          reviewerId: user?.id,
          goals: goalsList
        })
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg('Performance review recorded successfully.');
        setForm({
          employeeId: data.employees?.[0]?.id || '',
          reviewCycle: cyclePeriod,
          rating: '4',
          comments: '',
        });
        setGoalsList([{ title: 'Achieve Q2 sprint milestones', weight: 50, status: 'In Progress' }]);
        triggerRefresh();
        setTimeout(() => {
          setShowReviewModal(false);
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(result.error || 'Failed to submit review.');
      }
    } catch (err) {
      setErrorMsg('Network error, please try again.');
    }
  };

  // Employee: Toggle goal status
  const handleGoalStatusChange = async (reviewId: string, goalId: string, currentStatus: string) => {
    const nextStatusMap: { [key: string]: string } = {
      'Not Started': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Started'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'In Progress';

    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateGoalStatus',
          reviewId,
          goalId,
          goalStatus: nextStatus
        })
      });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error('Goal update failed', err);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading performance profiles and review history logs...
      </div>
    );
  }

  const { employees, reviews } = data;
  const isAdmin = user?.role === 'HR Admin';

  return (
    <div className="page-container">
      {isAdmin ? (
        // ================= HR ADMIN VIEW =================
        <>
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="chart-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="var(--primary)" />
                Employee Performance Scorecard Dashboard
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Select Employee:</span>
                <select
                  className="filter-select"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  style={{ width: '200px' }}
                >
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {renderScorecard(selectedEmployeeId || employees[0]?.id)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
          {/* Reviews logs list */}
          <div className="table-card">
            <div className="table-header-area" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={18} color="var(--primary)" />
                <h2 className="chart-title">Completed Performance Reviews</h2>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setShowReviewModal(true);
                    setForm(prev => ({
                      ...prev,
                      employeeId: selectedEmployeeId || employees[0]?.id || ''
                    }));
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> File Review
                </button>
              )}
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No performance reviews logged in the database.
                </div>
              ) : (
                reviews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((rev: any) => {
                  const emp = employees.find((e: any) => e.id === rev.employeeId);
                  const reviewer = employees.find((e: any) => e.id === rev.reviewerId);
                  return (
                    <div key={rev.id} style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{emp?.name || 'Unknown Employee'}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cycle: {rev.reviewCycle} • Evaluated: {rev.date}</div>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--warning)' }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                        <strong>Manager Comments:</strong>
                        <p style={{ marginTop: '4px', fontStyle: 'italic' }}>"{rev.comments}"</p>
                      </div>

                      {rev.goals && rev.goals.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>KPI Goals Assigned:</div>
                          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                            {rev.goals.map((g: any) => (
                              <li key={g.id} style={{ color: g.status === 'Completed' ? 'var(--success)' : 'inherit' }}>
                                <strong>{g.status}</strong>: {g.title} (Weight: {g.weight}%)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', textAlign: 'right' }}>
                        Evaluator: {reviewer?.name || 'HR Specialist'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* File Performance Review Modal */}
        {showReviewModal && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="var(--primary)" />
                  File Performance Review
                </h3>
                <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitReview}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {successMsg && (
                    <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--success)' }}>
                      {successMsg}
                    </div>
                  )}
                  {errorMsg && (
                    <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', border: '1px solid var(--danger)' }}>
                      {errorMsg}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Employee</label>
                    <select
                      className="form-control"
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    >
                      {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Cycle Type</label>
                      <select
                        className="form-control"
                        value={cycleType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setCycleType(newType);
                          const defaultPeriod = getPeriodsForType(newType)[0];
                          setCyclePeriod(defaultPeriod);
                        }}
                      >
                        <option value="Quarterly">Quarterly</option>
                        <option value="Semi-Annually">Semi-Annually</option>
                        <option value="Annually">Annually</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Review Period</label>
                      <select
                        className="form-control"
                        value={cyclePeriod}
                        onChange={(e) => setCyclePeriod(e.target.value)}
                      >
                        {getPeriodsForType(cycleType).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <select
                        className="form-control"
                        value={form.rating}
                        onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      >
                        <option value="5">★★★★★ (5)</option>
                        <option value="4">★★★★☆ (4)</option>
                        <option value="3">★★★☆☆ (3)</option>
                        <option value="2">★★☆☆☆ (2)</option>
                        <option value="1">★☆☆☆☆ (1)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Evaluation Comments</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Feedback, achievements, areas of growth..."
                      className="form-control"
                      style={{ fontFamily: 'inherit' }}
                      value={form.comments}
                      onChange={(e) => setForm({ ...form, comments: e.target.value })}
                    />
                  </div>

                  {/* Goals list row generator */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label">Key Goals / KPIs</label>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleAddGoalRow}>
                        + Add Goal
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {goalsList.map((g, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="text"
                            required
                            placeholder="Goal title..."
                            className="form-control"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                            value={g.title}
                            onChange={(e) => handleGoalFieldChange(idx, 'title', e.target.value)}
                          />
                          <input
                            type="number"
                            required
                            placeholder="Weight %"
                            className="form-control"
                            style={{ width: '70px', padding: '6px 10px', fontSize: '12px' }}
                            value={g.weight}
                            onChange={(e) => handleGoalFieldChange(idx, 'weight', Number(e.target.value))}
                          />
                          <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} onClick={() => handleRemoveGoalRow(idx)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
      ) : (
        // ================= EMPLOYEE VIEW =================
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="chart-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--primary)" />
              My Performance Scorecard Summary
            </h3>
            {renderScorecard(user?.id || '')}
          </div>

          {reviews.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px auto' }} />
              <h3>No Reviews Filed Yet</h3>
              <p>Your manager has not filed any performance cycles for you in the database.</p>
            </div>
          ) : (
            reviews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((rev: any) => (
              <div key={rev.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Cycle: {rev.reviewCycle}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filed on: {rev.date}</p>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--warning)', backgroundColor: 'var(--warning-light)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)' }}>
                    ★ {rev.rating} / 5
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: '1.5', borderLeft: '4px solid var(--primary)' }}>
                  <strong>Manager Evaluation Comments:</strong>
                  <p style={{ marginTop: '6px', fontStyle: 'italic' }}>"{rev.comments}"</p>
                </div>

                {rev.goals && rev.goals.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>My Actionable KPI Goals</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Click on the status badges to self-update progress updates (Not Started → In Progress → Completed).
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {rev.goals.map((g: any) => (
                        <div key={g.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px'
                        }}>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{g.title}</span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Goal weight allocation: {g.weight}%</div>
                          </div>
                          <button
                            onClick={() => handleGoalStatusChange(rev.id, g.id, g.status)}
                            className={`badge ${g.status === 'Completed' ? 'badge-completed' : g.status === 'In Progress' ? 'badge-inprogress' : 'badge-absent'}`}
                            style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                          >
                            {g.status}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
