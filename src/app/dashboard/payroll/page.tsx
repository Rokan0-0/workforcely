'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Banknote, Printer, FileText, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function PayrollPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSaveOverride = async () => {
    if (!activePayslip) return;
    setSubmittingOverride(true);
    setOverrideError(null);
    setOverrideSuccess(null);
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
      } else {
        setOverrideError(result.error || 'Failed to save adjustment.');
      }
    } catch (err) {
      setOverrideError('Network error, please try again.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const cacheKey = `/api/payroll-${user.role}-${user.id}`;
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
        const payUrl = '/api/payroll' + (user.role === 'Employee' ? `?employeeId=${user.id}` : '');
        
        const [empRes, payRes] = await Promise.all([
          fetch(empUrl),
          fetch(payUrl)
        ]);

        const emps = await empRes.json();
        const pay = await payRes.json();

        const result = {
          employees: emps.employees,
          departments: emps.departments,
          payroll: pay.payroll
        };
        setData(result);
        setCachedData(cacheKey, result);
      } catch (err) {
        console.error('Failed to load payroll data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshFlag]);

  // Run new payroll calculation
  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenSuccess(null);
    setGenError(null);
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
      } else {
        setGenError(result.error || 'Failed to generate payroll.');
      }
    } catch (err) {
      setGenError('Network error, please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading payroll ledgers and payslip archives...
      </div>
    );
  }

  const { employees, departments, payroll } = data;
  const isAdmin = user?.role === 'HR Admin';

  const monthList = Array.from(new Set(payroll.map((p: any) => p.month))).sort().reverse() as string[];
  const currentMonthLogs = payroll.filter((p: any) => p.month === selectedMonth);

  return (
    <div className="page-container">
      {isAdmin ? (
        // ================= HR ADMIN VIEW =================
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            {/* Ledger logs */}
            <div className="table-card">
              <div className="table-header-area">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Banknote size={18} color="var(--primary)" />
                  <h2 className="chart-title">Monthly Payroll Ledger</h2>
                </div>
                <div className="table-actions">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Selected Month:</span>
                  <select
                    className="filter-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {monthList.length === 0 ? (
                      <option value="2026-05">2026-05 (Default)</option>
                    ) : (
                      monthList.map(m => <option key={m} value={m}>{m}</option>)
                    )}
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
                    {currentMonthLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No payroll record found for {selectedMonth}. Generate it using the sidebar widget.
                        </td>
                      </tr>
                    ) : (
                      currentMonthLogs.map((p: any) => {
                        const emp = employees.find((e: any) => e.id === p.employeeId);
                        const allowances = p.allowanceHousing + p.allowanceTransport;
                        return (
                          <tr key={p.id}>
                            <td>
                              <strong>{emp?.name || 'Unknown'}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp?.role}</div>
                            </td>
                            <td>₦{p.basePay.toLocaleString()}</td>
                            <td>₦{allowances.toLocaleString()}</td>
                            <td style={{ color: 'var(--danger)' }}>-₦{p.tax.toLocaleString()}</td>
                            <td style={{ color: 'var(--danger)' }}>-₦{p.pension.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>₦{p.netPay.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                                onClick={() => setActivePayslip({ ...p, employee: emp })}
                              >
                                View
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

            {/* Generate payroll form */}
            <div className="card">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Banknote size={18} color="var(--primary)" />
                Run Monthly Payroll
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                This runs calculated deductions (Simplified PAYE & 8% Pension PRA) for all active employees.
              </p>

              {genSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px', border: '1px solid var(--success)' }}>{genSuccess}</div>}
              {genError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px', border: '1px solid var(--danger)' }}>{genError}</div>}

              <form onSubmit={handleGeneratePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Calculation Month</label>
                  <input
                    type="month"
                    required
                    className="form-control"
                    value={generateMonth}
                    onChange={(e) => setGenerateMonth(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Execute Calculation
                </button>
              </form>
            </div>
          </div>

          {/* Core active salary rates grid */}
          <div className="table-card">
            <div className="table-header-area">
              <h3 className="chart-title">Confirmed Employee Compensation Structures</h3>
            </div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic base</th>
                    <th>Housing Allowance</th>
                    <th>Transport Allowance</th>
                    <th>Gross Monthly Rate</th>
                    <th>Pension deduction (8%)</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => {
                    const gross = emp.salary.base + emp.salary.housing + emp.salary.transport;
                    const pension = gross * 0.08;
                    return (
                      <tr key={emp.id}>
                        <td><strong>{emp.name}</strong></td>
                        <td>₦{emp.salary.base.toLocaleString()}</td>
                        <td>₦{emp.salary.housing.toLocaleString()}</td>
                        <td>₦{emp.salary.transport.toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>₦{gross.toLocaleString()}</td>
                        <td>₦{pension.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // ================= EMPLOYEE VIEW =================
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left panel: List past months */}
          <div className="table-card">
            <div className="table-header-area">
              <h3 className="chart-title">Select Month</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {payroll.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>No payslips generated.</div>
              ) : (
                payroll.sort((a: any, b: any) => b.month.localeCompare(a.month)).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const emp = employees.find((e: any) => e.id === p.employeeId);
                      setActivePayslip({ ...p, employee: emp });
                    }}
                    style={{
                      background: activePayslip?.id === p.id ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={18} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{p.month}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paid on: {p.paymentDate}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Active preview */}
          <div>
            {activePayslip ? (
              <div className="card" style={{ padding: '0px', border: 'none', background: 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button className="btn-primary" onClick={handlePrint}>
                    <Printer size={16} />
                    Print / Download PDF
                  </button>
                </div>

                {/* Payslip body template */}
                <div className="payslip-container">
                  <div className="payslip-header">
                    <div className="payslip-logo-area">
                      <span className="payslip-logo">WORKFORCELY</span>
                      <span className="payslip-company">Workforcely Demo Co • Nigeria SME Retail/Fintech</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="payslip-title">Payslip</span>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Period: {activePayslip.month}</div>
                    </div>
                  </div>

                  <div className="payslip-grid">
                    <div className="payslip-block">
                      <div className="payslip-row">
                        <span className="payslip-label">Employee ID:</span>
                        <span className="payslip-value">{activePayslip.employee?.id}</span>
                      </div>
                      <div className="payslip-row">
                        <span className="payslip-label">Employee Name:</span>
                        <span className="payslip-value">{activePayslip.employee?.name}</span>
                      </div>
                      <div className="payslip-row">
                        <span className="payslip-label">Designation:</span>
                        <span className="payslip-value">{activePayslip.employee?.role}</span>
                      </div>
                    </div>

                    <div className="payslip-block">
                      <div className="payslip-row">
                        <span className="payslip-label">Bank Payment:</span>
                        <span className="payslip-value">Cleared</span>
                      </div>
                      <div className="payslip-row">
                        <span className="payslip-label">Paid Date:</span>
                        <span className="payslip-value">{activePayslip.paymentDate}</span>
                      </div>
                    </div>
                  </div>

                  <table className="payslip-table">
                    <thead>
                      <tr>
                        <th>Earnings Breakdown</th>
                        <th className="payslip-table-right">Amount (₦)</th>
                        <th>Deductions Breakdown</th>
                        <th className="payslip-table-right">Amount (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Basic Base Pay</td>
                        <td className="payslip-table-right">{activePayslip.basePay.toLocaleString()}</td>
                        <td>PAYE Income Tax</td>
                        <td className="payslip-table-right" style={{ color: '#ef4444' }}>{activePayslip.tax.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Housing Allowance</td>
                        <td className="payslip-table-right">{activePayslip.allowanceHousing.toLocaleString()}</td>
                        <td>Pension PRA Contribution (8%)</td>
                        <td className="payslip-table-right" style={{ color: '#ef4444' }}>{activePayslip.pension.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Transport Allowance</td>
                        <td className="payslip-table-right">{activePayslip.allowanceTransport.toLocaleString()}</td>
                        <td></td>
                        <td className="payslip-table-right"></td>
                      </tr>
                      {activePayslip.overrideAmount !== 0 && (
                        <tr>
                          {activePayslip.overrideAmount > 0 ? (
                            <>
                              <td>
                                <div><strong>Adjustment (Earning)</strong></div>
                                {activePayslip.overrideReason && <div style={{ fontSize: '11px', color: '#475569' }}>Note: {activePayslip.overrideReason}</div>}
                              </td>
                              <td className="payslip-table-right" style={{ color: '#10b981' }}>
                                +₦{activePayslip.overrideAmount.toLocaleString()}
                              </td>
                              <td></td>
                              <td className="payslip-table-right"></td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td className="payslip-table-right"></td>
                              <td>
                                <div><strong>Adjustment (Deduction)</strong></div>
                                {activePayslip.overrideReason && <div style={{ fontSize: '11px', color: '#475569' }}>Note: {activePayslip.overrideReason}</div>}
                              </td>
                              <td className="payslip-table-right" style={{ color: '#ef4444' }}>
                                -₦{Math.abs(activePayslip.overrideAmount).toLocaleString()}
                              </td>
                            </>
                          )}
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="payslip-summary">
                    <div style={{ display: 'flex', gap: '32px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#475569' }}>Total Deductions: </span>
                        <span>₦{(activePayslip.tax + activePayslip.pension + (activePayslip.overrideAmount < 0 ? Math.abs(activePayslip.overrideAmount) : 0)).toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', color: '#475569' }}>Net Monthly Pay: </span>
                        <span style={{ color: '#10b981', fontSize: '18px' }}>₦{activePayslip.netPay.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ marginBottom: '12px' }} />
                <p>Select a payslip month from the sidebar list to view detail.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin details payslip Modal popup */}
      {isAdmin && activePayslip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Employee Payslip Detailed Archive</h3>
              <button className="close-btn" onClick={() => setActivePayslip(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px 24px 0 24px' }}>
              <div className="payslip-container">
                <div className="payslip-header">
                  <div className="payslip-logo-area">
                    <span className="payslip-logo">WORKFORCELY</span>
                    <span className="payslip-company">Workforcely Demo Co • Nigeria SME Retail/Fintech</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="payslip-title">Payslip</span>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Period: {activePayslip.month}</div>
                  </div>
                </div>

                <div className="payslip-grid">
                  <div className="payslip-block">
                    <div className="payslip-row">
                      <span className="payslip-label">Employee ID:</span>
                      <span className="payslip-value">{activePayslip.employee?.id}</span>
                    </div>
                    <div className="payslip-row">
                      <span className="payslip-label">Employee Name:</span>
                      <span className="payslip-value">{activePayslip.employee?.name}</span>
                    </div>
                    <div className="payslip-row">
                      <span className="payslip-label">Designation:</span>
                      <span className="payslip-value">{activePayslip.employee?.role}</span>
                    </div>
                  </div>

                  <div className="payslip-block">
                    <div className="payslip-row">
                      <span className="payslip-label">Bank Payment:</span>
                      <span className="payslip-value">Cleared</span>
                    </div>
                    <div className="payslip-row">
                      <span className="payslip-label">Paid Date:</span>
                      <span className="payslip-value">{activePayslip.paymentDate}</span>
                    </div>
                  </div>
                </div>

                <table className="payslip-table">
                  <thead>
                    <tr>
                      <th>Earnings Breakdown</th>
                      <th className="payslip-table-right">Amount (₦)</th>
                      <th>Deductions Breakdown</th>
                      <th className="payslip-table-right">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Base Pay</td>
                      <td className="payslip-table-right">{activePayslip.basePay.toLocaleString()}</td>
                      <td>PAYE Income Tax</td>
                      <td className="payslip-table-right" style={{ color: '#ef4444' }}>{activePayslip.tax.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Housing Allowance</td>
                      <td className="payslip-table-right">{activePayslip.allowanceHousing.toLocaleString()}</td>
                      <td>Pension PRA Contribution (8%)</td>
                      <td className="payslip-table-right" style={{ color: '#ef4444' }}>{activePayslip.pension.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Transport Allowance</td>
                      <td className="payslip-table-right">{activePayslip.allowanceTransport.toLocaleString()}</td>
                      <td></td>
                      <td className="payslip-table-right"></td>
                    </tr>
                    {activePayslip.overrideAmount !== 0 && (
                      <tr>
                        {activePayslip.overrideAmount > 0 ? (
                          <>
                            <td>
                              <div><strong>Adjustment (Earning)</strong></div>
                              {activePayslip.overrideReason && <div style={{ fontSize: '11px', color: '#475569' }}>Note: {activePayslip.overrideReason}</div>}
                            </td>
                            <td className="payslip-table-right" style={{ color: '#10b981' }}>
                              +₦{activePayslip.overrideAmount.toLocaleString()}
                            </td>
                            <td></td>
                            <td className="payslip-table-right"></td>
                          </>
                        ) : (
                          <>
                            <td></td>
                            <td className="payslip-table-right"></td>
                            <td>
                              <div><strong>Adjustment (Deduction)</strong></div>
                              {activePayslip.overrideReason && <div style={{ fontSize: '11px', color: '#475569' }}>Note: {activePayslip.overrideReason}</div>}
                            </td>
                            <td className="payslip-table-right" style={{ color: '#ef4444' }}>
                              -₦{Math.abs(activePayslip.overrideAmount).toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="payslip-summary">
                  <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Total Deductions: </span>
                      <span>₦{(activePayslip.tax + activePayslip.pension + (activePayslip.overrideAmount < 0 ? Math.abs(activePayslip.overrideAmount) : 0)).toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Net Monthly Pay: </span>
                      <span style={{ color: '#10b981', fontSize: '18px' }}>₦{activePayslip.netPay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual adjustment section */}
              <div style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background-alt)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Apply Manual Override / Adjustment</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Adjustment Amount (₦)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000 or -25000"
                      className="form-control"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Reason / Note</label>
                    <input
                      type="text"
                      placeholder="Bonus, deduction, correction..."
                      className="form-control"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={handleSaveOverride}
                    style={{ height: '34px', fontSize: '12px', padding: '0 16px' }}
                    disabled={submittingOverride}
                  >
                    {submittingOverride ? 'Saving...' : 'Apply'}
                  </button>
                </div>
                {overrideError && <div style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px' }}>{overrideError}</div>}
                {overrideSuccess && <div style={{ color: 'var(--success)', fontSize: '11px', marginTop: '6px' }}>{overrideSuccess}</div>}
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', padding: '16px 24px 24px 24px' }}>
              <button className="btn-secondary" onClick={() => setActivePayslip(null)}>Close</button>
              <button className="btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
