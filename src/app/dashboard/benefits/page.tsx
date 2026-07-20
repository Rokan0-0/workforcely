'use client';

import { useState, useEffect } from 'react';
import { useSession } from '../session-provider';
import { Shield, Users, Plus, CheckCircle, Heart, Hospital } from 'lucide-react';

export default function BenefitsPage() {
  const { user, triggerRefresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Enrollment Form
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [dependants, setDependants] = useState<{ name: string; relationship: 'Spouse' | 'Child'; dob: string }[]>([]);
  const [depName, setDepName] = useState('');
  const [depRel, setDepRel] = useState<'Spouse' | 'Child'>('Spouse');
  const [depDob, setDepDob] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBenefits() {
      try {
        const res = await fetch('/api/benefits');
        const json = await res.json();
        setData(json);
        if (json.hmoPlans?.length > 0) {
          setSelectedPlanId(json.hmoPlans[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch benefits data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBenefits();
  }, []);

  const handleAddDependant = () => {
    if (!depName || !depDob) {
      setMessage('Dependant name and date of birth are required.');
      return;
    }
    setDependants(prev => [...prev, { name: depName, relationship: depRel, dob: depDob }]);
    setDepName('');
    setDepDob('');
    setMessage(null);
  };

  const handleRemoveDependant = (idx: number) => {
    setDependants(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    try {
      const res = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enrollHmo',
          employeeId: user.id,
          planId: selectedPlanId,
          dependants
        })
      });
      const result = await res.json();
      if (result.success) {
        setMessage('HMO Plan enrollment saved successfully!');
        const refRes = await fetch('/api/benefits');
        const refJson = await refRes.json();
        setData(refJson);
      } else {
        setMessage(result.error || 'Failed to save HMO enrollment.');
      }
    } catch (err) {
      setMessage('Network error, please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Health Benefits Portal...
      </div>
    );
  }

  const { hmoPlans, hmoEnrollments } = data;
  const myEnrollment = hmoEnrollments.find((e: any) => e.employeeId === user?.id);
  const myPlan = myEnrollment ? hmoPlans.find((p: any) => p.id === myEnrollment.planId) : null;
  const isAdmin = user?.role === 'HR Admin';

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart size={22} color="var(--accent)" />
            HMO & Healthcare Benefits Portal
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Manage health insurance plans, covered hospital networks, and family dependant registrations.
          </p>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {hmoPlans.map((plan: any) => {
          const isCurrent = myEnrollment?.planId === plan.id;
          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: isCurrent ? '0 0 14px var(--accent-light)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {isCurrent && (
                <span className="badge badge-completed" style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  Enrolled Active
                </span>
              )}
              <div>
                <span className="badge badge-applied">{plan.tier} Tier</span>
                <h3 style={{ margin: '12px 0 4px', fontSize: '18px' }}>{plan.provider}</h3>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '10px 0' }}>
                  ₦{plan.monthlyCost.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'grid', gap: '6px' }}>
                  <div>🏥 Hospitals: <strong>{plan.hospitalCount}+ nationwide</strong></div>
                  <div>🛡️ Coverage: <strong>{plan.coveredLimit}</strong></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee Enrollment & Dependant Portal */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr' : '1fr 360px', gap: '24px' }}>
        <div className="card">
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} color="var(--primary)" />
            {myEnrollment ? 'Update Your HMO & Dependant Plan' : 'Select HMO Plan & Register Dependants'}
          </h3>

          {message && (
            <div style={{ color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleEnrollSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Select Preferred HMO Tier</label>
              <select className="form-control" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                {hmoPlans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.provider} - {plan.tier} Tier (₦{plan.monthlyCost.toLocaleString()}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Dependant Registration Box */}
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Register Family Dependants (Spouse & Children)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                <input className="form-control" placeholder="Full name" value={depName} onChange={(e) => setDepName(e.target.value)} />
                <select className="form-control" value={depRel} onChange={(e) => setDepRel(e.target.value as any)}>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                </select>
                <input className="form-control" type="date" value={depDob} onChange={(e) => setDepDob(e.target.value)} />
                <button type="button" className="btn-secondary" style={{ padding: '8px 12px' }} onClick={handleAddDependant}>
                  Add
                </button>
              </div>

              {/* Dependant List */}
              {dependants.length > 0 && (
                <div style={{ display: 'grid', gap: '8px', marginTop: '14px' }}>
                  {dependants.map((dep, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                      <div>
                        <strong>{dep.name}</strong> ({dep.relationship}) • Born: {dep.dob}
                      </div>
                      <button type="button" className="btn-secondary" style={{ fontSize: '11px', color: 'var(--danger)', padding: '2px 6px' }} onClick={() => handleRemoveDependant(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
              Confirm & Save HMO Plan Registration
            </button>
          </form>
        </div>

        {/* HR Admin Company Overview */}
        {isAdmin && (
          <div className="table-card">
            <div className="table-header-area">
              <h3 className="chart-title">Company HMO Enrolled Staff</h3>
            </div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead><tr><th>Employee</th><th>HMO Provider</th><th>Dependants</th><th>Enrolled Date</th></tr></thead>
                <tbody>
                  {hmoEnrollments.map((enr: any) => {
                    const plan = hmoPlans.find((p: any) => p.id === enr.planId);
                    return (
                      <tr key={enr.id}>
                        <td><strong>{enr.employeeId}</strong></td>
                        <td><span className="badge badge-applied">{plan?.provider || 'HMO'} ({plan?.tier})</span></td>
                        <td>{enr.dependants?.length || 0} Registered</td>
                        <td>{enr.enrolledDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
