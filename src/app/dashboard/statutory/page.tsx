'use client';

import { useState, useEffect } from 'react';
import { useSession } from '../session-provider';
import { Building2, Download, ShieldCheck, FileCheck, FileSpreadsheet, Percent } from 'lucide-react';

export default function StatutoryPage() {
  const { user } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('All');

  useEffect(() => {
    async function fetchStatutory() {
      try {
        const res = await fetch('/api/statutory');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch statutory data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStatutory();
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const items = selectedState === 'All' ? data.statutoryBreakdown : data.statutoryBreakdown.filter((i: any) => i.stateAuthority === selectedState);
    const headers = ['Employee Name', 'Department', 'State Authority', 'Gross Salary (N)', 'PAYE Tax (N)', 'Pension Emp 8% (N)', 'Pension Employer 10% (N)', 'NHF 2.5% (N)', 'NSITF 1% (N)', 'ITF 1% (N)'];
    const rows = items.map((i: any) => [
      `"${i.employeeName}"`,
      `"${i.department}"`,
      `"${i.stateAuthority}"`,
      i.grossSalary,
      i.payeTax,
      i.pensionEmployee,
      i.pensionEmployer,
      i.nhfDeduction,
      i.nsitfContribution,
      i.itfContribution
    ]);

    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statutory_Remittance_Schedule_${selectedState.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Nigerian Statutory Compliance Hub...
      </div>
    );
  }

  const { statutoryBreakdown, totals } = data;
  const filteredItems = selectedState === 'All' ? statutoryBreakdown : statutoryBreakdown.filter((i: any) => i.stateAuthority === selectedState);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={22} color="var(--primary)" />
            Nigerian Statutory & Compliance Hub
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Automated statutory tax, pension, NHF, NSITF, and ITF compliance schedules for Nigerian tax authorities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="form-control" style={{ width: '180px' }} value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
            <option value="All">All Tax Authorities</option>
            <option value="Lagos (LIRS)">Lagos (LIRS)</option>
            <option value="Abuja (FCT-IRS)">Abuja (FCT-IRS)</option>
            <option value="Enugu (EIRS)">Enugu (EIRS)</option>
          </select>
          <button className="btn-primary" onClick={exportCSV}>
            <Download size={16} /> Export Schedule (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="metric-card">
          <strong>₦{totals.totalPaye.toLocaleString()}</strong>
          <p>PAYE Income Tax</p>
        </div>
        <div className="metric-card">
          <strong>₦{(totals.totalPensionEmployee + totals.totalPensionEmployer).toLocaleString()}</strong>
          <p>PenCom Total (18%)</p>
        </div>
        <div className="metric-card">
          <strong>₦{totals.totalNhf.toLocaleString()}</strong>
          <p>NHF Fund (2.5%)</p>
        </div>
        <div className="metric-card">
          <strong>₦{totals.totalNsitf.toLocaleString()}</strong>
          <p>NSITF Insurance (1%)</p>
        </div>
        <div className="metric-card">
          <strong>₦{totals.totalItf.toLocaleString()}</strong>
          <p>ITF Levy (1%)</p>
        </div>
      </div>

      {/* Statutory Breakdown Table */}
      <div className="table-card">
        <div className="table-header-area">
          <h3 className="chart-title">Employee Statutory Breakdown ({filteredItems.length} Staff)</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Authority</th>
                <th>Gross Salary</th>
                <th>PAYE Tax</th>
                <th>Pension (8%)</th>
                <th>NHF (2.5%)</th>
                <th>NSITF (1%)</th>
                <th>ITF (1%)</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: any) => (
                <tr key={item.employeeId}>
                  <td><strong>{item.employeeName}</strong></td>
                  <td>{item.department}</td>
                  <td><span className="badge badge-applied">{item.stateAuthority}</span></td>
                  <td>₦{item.grossSalary.toLocaleString()}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>₦{item.payeTax.toLocaleString()}</td>
                  <td>₦{item.pensionEmployee.toLocaleString()}</td>
                  <td>₦{item.nhfDeduction.toLocaleString()}</td>
                  <td>₦{item.nsitfContribution.toLocaleString()}</td>
                  <td>₦{item.itfContribution.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
