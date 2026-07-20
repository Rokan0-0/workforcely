'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Banknote, Printer, FileText, ChevronRight, X, AlertCircle, Coins, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PayrollPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab: 'payroll' | 'ewa'
  const [payrollTab, setPayrollTab] = useState<'payroll' | 'ewa'>('payroll');

  // EWA State
  const [ewaAmount, setEwaAmount] = useState('');
  const [ewaMessage, setEwaMessage] = useState<string | null>(null);
  const [ewaSubmitting, setEwaSubmitting] = useState(false);

  // Month filters & triggers
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [generateMonth, setGenerateMonth] = useState('2026-06');
  const [genSuccess, setGenSuccess] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Active viewing payslip
  const [activePayslip, setActivePayslip] = useState<any>(null);

  // Override states
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activePayslip) {
      setOverrideAmount(activePayslip.overrideAmount?.toString() || '');
      setOverrideReason(activePayslip.overrideReason || '');
      setOverrideError(null);
      setOverrideSuccess(null);
    }
  }, [activePayslip]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const empUrl = '/api/employees';
        const payUrl = '/api/payroll' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '');
        const benUrl = '/api/benefits';

        const [empRes, payRes, benRes] = await Promise.all([
          fetch(empUrl),
          fetch(payUrl),
          fetch(benUrl)
        ]);

        const emps = await empRes.json();
        const pay = await payRes.json();
        const ben = await benRes.json();

        setData({
          employees: emps.employees || [],
          departments: emps.departments || [],
          payroll: pay.payroll || [],
          ewaRequests: ben.ewaRequests || []
        });
      } catch (err) {
        console.error('Failed to load payroll data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshFlag]);

  const handleRequestEwa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ewaAmount) return;
    setEwaSubmitting(true);
    setEwaMessage(null);

    try {
      const res = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'requestEwa',
          employeeId: user.id,
          amount: Number(ewaAmount)
        })
      });
      const result = await res.json();
      if (result.success) {
        setEwaMessage(`Success! ₦${Number(ewaAmount).toLocaleString()} disbursed instantly to your salary bank account (₦500 fee applied).`);
        setEwaAmount('');
        triggerRefresh();
      } else {
        setEwaMessage(result.error || 'Failed to request EWA advance.');
      }
    } catch (err) {
      setEwaMessage('Network error, please try again.');
    } finally {
      setEwaSubmitting(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!activePayslip) return;
    setSubmittingOverride(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activePayslip.id,
          overrideAmount: Number(overrideAmount) || 0,
          overrideReason: overrideReason
        })
      });
      const result = await res.json();
      if (result.success) {
        setOverrideSuccess('Adjustment saved successfully!');
        setActivePayslip({
          ...activePayslip,
          overrideAmount: result.payroll.overrideAmount,
          overrideReason: result.payroll.overrideReason,
          netPay: result.payroll.netPay
        });
        triggerRefresh();
      }
    } catch (err) {
      setOverrideError('Failed to save adjustment.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: generateMonth })
      });
      const result = await res.json();
      if (result.success) {
        setGenSuccess(result.message);
        setSelectedMonth(generateMonth);
        triggerRefresh();
      }
    } catch (err) {
      setGenError('Failed to generate payroll.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading payroll ledgers and EWA engines...
      </div>
    );
  }

  const { employees, departments, payroll, ewaRequests } = data;
  const isAdmin = user?.role === 'HR Admin';
  const monthList = Array.from(new Set(payroll.map((p: any) => p.month))).sort().reverse() as string[];
  const currentMonthLogs = payroll.filter((p: any) => p.month === selectedMonth);

  // Current Employee Salary & EWA calculations
  const myEmp = employees.find((e: any) => e.id === user?.id);
  const myGross = myEmp ? myEmp.salary.base + myEmp.salary.housing + myEmp.salary.transport : 0;
  const myAccruedWages = Math.round(myGross * 0.5); // 15 days worked
  const myMaxEwa = Math.round(myAccruedWages * 0.5); // 50% max allowed

  return (
    <div className="page-container">
      {/* Tab Switcher Header */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${payrollTab === 'payroll' ? 'btn-primary' : ''}`}
          onClick={() => setPayrollTab('payroll')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Banknote size={16} />
          {isAdmin ? 'Monthly Payroll Ledgers' : 'My Payslips'}
        </button>
        <button
          className={`btn-secondary ${payrollTab === 'ewa' ? 'btn-primary' : ''}`}
          onClick={() => setPayrollTab('ewa')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Coins size={16} color={payrollTab === 'ewa' ? '#fff' : 'var(--accent)'} />
          Earned Wage Access (EWA) Hub
        </button>
      </div>

      {/* TAB 1: PAYROLL LEDGERS / PAYSLIPS */}
      {payrollTab === 'payroll' && (
        <>
          {isAdmin ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
              <div className="table-card">
                <div className="table-header-area">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Banknote size={18} color="var(--primary)" />
                    <h2 className="chart-title">Monthly Payroll Ledger</h2>
                  </div>
                  <div className="table-actions">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Month:</span>
                    <select className="filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                      {monthList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="custom-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Base Salary</th>
                        <th>Allowances</th>
                        <th>Tax (PAYE)</th>
                        <th>Pension</th>
                        <th>Net Paid</th>
                        <th style={{ textAlign: 'right' }}>Slip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMonthLogs.map((p: any) => {
                        const emp = employees.find((e: any) => e.id === p.employeeId);
                        const allowances = p.allowanceHousing + p.allowanceTransport;
                        return (
                          <tr key={p.id}>
                            <td><strong>{emp?.name || 'Unknown'}</strong></td>
                            <td>₦{p.basePay.toLocaleString()}</td>
                            <td>₦{allowances.toLocaleString()}</td>
                            <td style={{ color: 'var(--danger)' }}>-₦{p.tax.toLocaleString()}</td>
                            <td style={{ color: 'var(--danger)' }}>-₦{p.pension.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>₦{p.netPay.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => setActivePayslip({ ...p, employee: emp })}>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Banknote size={18} color="var(--primary)" /> Run Monthly Payroll
                </h3>
                <form onSubmit={handleGeneratePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Calculation Month</label>
                    <input type="month" required className="form-control" value={generateMonth} onChange={(e) => setGenerateMonth(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Execute Calculation</button>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
              <div className="table-card">
                <div className="table-header-area"><h3 className="chart-title">Select Month</h3></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {payroll.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePayslip({ ...p, employee: myEmp })}
                      style={{
                        background: activePayslip?.id === p.id ? 'var(--primary-light)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border-color)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{p.month}</div>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {activePayslip && (
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="chart-title">Payslip Breakdown ({activePayslip.month})</h3>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '16px', fontSize: '14px' }}>
                    <div>Base Salary: ₦{activePayslip.basePay.toLocaleString()}</div>
                    <div>Allowances: ₦{(activePayslip.allowanceHousing + activePayslip.allowanceTransport).toLocaleString()}</div>
                    <div style={{ color: 'var(--danger)' }}>PAYE Tax: -₦{activePayslip.tax.toLocaleString()}</div>
                    <div style={{ color: 'var(--danger)' }}>Pension (8%): -₦{activePayslip.pension.toLocaleString()}</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', marginTop: '10px' }}>Net Pay: ₦{activePayslip.netPay.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: EARNED WAGE ACCESS (EWA) HUB */}
      {payrollTab === 'ewa' && (
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr' : '1fr 380px', gap: '24px' }}>
          {/* Employee EWA Request Widget */}
          <div className="card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Coins size={20} color="var(--accent)" /> Real-Time Earned Wage Access (On-Demand Liquidity)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Access up to 50% of your already-earned wages before payday for emergency expenses. Disbursed instantly with no credit check.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="metric-card">
                <strong>₦{myGross.toLocaleString()}</strong>
                <p>Gross Monthly Salary</p>
              </div>
              <div className="metric-card">
                <strong>₦{myAccruedWages.toLocaleString()}</strong>
                <p>Earned Wages (Mid-Month)</p>
              </div>
              <div className="metric-card" style={{ border: '2px solid var(--accent)' }}>
                <strong style={{ color: 'var(--accent)' }}>₦{myMaxEwa.toLocaleString()}</strong>
                <p>Max Available EWA Limit (50%)</p>
              </div>
            </div>

            {ewaMessage && (
              <div style={{ color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                {ewaMessage}
              </div>
            )}

            {!isAdmin && (
              <form onSubmit={handleRequestEwa} style={{ display: 'grid', gap: '16px', backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: 0, fontSize: '14px' }}>Request On-Demand Salary Advance</h4>
                <div className="form-group">
                  <label className="form-label">Enter Amount to Withdraw (Max ₦{myMaxEwa.toLocaleString()})</label>
                  <input
                    className="form-control"
                    type="number"
                    max={myMaxEwa}
                    placeholder="e.g. 30000"
                    value={ewaAmount}
                    onChange={(e) => setEwaAmount(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ⚡ Instant Transfer Fee: <strong>₦500 flat fee</strong> • Auto-reconciled on month-end payslip.
                </div>
                <button type="submit" disabled={ewaSubmitting} className="btn-primary" style={{ justifyContent: 'center' }}>
                  {ewaSubmitting ? 'Processing Advance...' : 'Disburse Advance Instantly'}
                </button>
              </form>
            )}
          </div>

          {/* Disbursed EWA Requests History */}
          <div className="table-card">
            <div className="table-header-area">
              <h3 className="chart-title">EWA Disbursed Log ({ewaRequests.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead><tr><th>Employee</th><th>Earned</th><th>Requested</th><th>Fee</th><th>Status</th></tr></thead>
                <tbody>
                  {ewaRequests.map((req: any) => (
                    <tr key={req.id}>
                      <td><strong>{req.employeeId}</strong></td>
                      <td>₦{req.earnedAmount.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₦{req.requestedAmount.toLocaleString()}</td>
                      <td>₦{req.fee}</td>
                      <td><span className="badge badge-completed">{req.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
