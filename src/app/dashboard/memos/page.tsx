'use client';

import { useEffect, useState } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Plus, Trash2, FileText, CheckCircle2, X } from 'lucide-react';

interface MemoItem {
  id: string;
  title: string;
  body: string;
  targetAudience: 'All Staff' | 'Specific Department';
  departmentId?: string;
  createdDate: string;
}

interface Department {
  id: string;
  name: string;
  managerId: string;
}

export default function MemosPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const [memos, setMemos] = useState<MemoItem[]>(() => getCachedData('/api/memos') || []);
  const [departments, setDepartments] = useState<Department[]>(() => getCachedData('/api/departments') || []);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetAudience: 'All Staff',
    departmentId: ''
  });
  const [filter, setFilter] = useState({
    search: '',
    audience: 'All',
    departmentId: ''
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    async function fetchMemos() {
      const cachedMemos = getCachedData('/api/memos');
      const cachedDepts = getCachedData('/api/departments');
      if (cachedMemos && cachedDepts) {
        setLoading(false);
      }
      try {
        const [memoRes, empRes] = await Promise.all([
          fetch('/api/memos'),
          fetch('/api/employees')
        ]);
        const memoData = await memoRes.json();
        const empData = await empRes.json();

        setMemos(memoData.memos || []);
        setDepartments(empData.departments || []);
        setCachedData('/api/memos', memoData.memos || []);
        setCachedData('/api/departments', empData.departments || []);
      } catch (err) {
        console.error('Failed to fetch memos or departments', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMemos();
  }, [refreshFlag]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.title.trim() || !form.content.trim()) {
      setError('Please provide a title and content for the memo.');
      return;
    }

    if (form.targetAudience === 'Specific Department' && !form.departmentId) {
      setError('Please select a department for a specific department memo.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createMemo',
          title: form.title,
          content: form.content,
          targetAudience: form.targetAudience,
          departmentId: form.departmentId || undefined
        })
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || 'Failed to create memo.');
        return;
      }

      setMemos(result.memos || [result.memo, ...memos]);
      setForm({ title: '', content: '', targetAudience: 'All Staff', departmentId: '' });
      setMessage('Memo published successfully.');
      triggerRefresh();
      setTimeout(() => {
        setShowPublishModal(false);
        setMessage(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to save memo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteMemo', id })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || 'Unable to delete memo.');
        return;
      }
      setMemos(result.memos || memos.filter((memo) => memo.id !== id));
      setMessage('Memo deleted successfully.');
      triggerRefresh();
    } catch (err) {
      console.error(err);
      setError('Unable to delete memo.');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading memos...
      </div>
    );
  }

  const lowerSearch = filter.search.trim().toLowerCase();
  const filteredMemos = memos.filter((memo) => {
    if (user.role === 'Employee') {
      if (memo.targetAudience === 'Specific Department' && memo.departmentId !== user.departmentId) {
        return false;
      }
    }

    const matchesSearch = !lowerSearch || memo.title.toLowerCase().includes(lowerSearch) || memo.body.toLowerCase().includes(lowerSearch);
    const matchesAudience = filter.audience === 'All' || memo.targetAudience === filter.audience;
    const matchesDepartment = !filter.departmentId || memo.departmentId === filter.departmentId;

    return matchesSearch && matchesAudience && matchesDepartment;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="table-card">
          <div className="table-header-area" style={{ alignItems: 'center', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 className="chart-title">Company Memos</h3>
                {user.role === 'HR Admin' && (
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Plus size={14} /> Publish Memo
                  </button>
                )}
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                View company announcements and department-specific notices.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '220px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Search memos
                </label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Search by title or body"
                  value={filter.search}
                  onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <div style={{ minWidth: '180px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Audience
                </label>
                <select
                  className="form-control"
                  value={filter.audience}
                  onChange={(e) => setFilter((prev) => ({ ...prev, audience: e.target.value }))}
                >
                  <option value="All">All Audiences</option>
                  <option value="All Staff">All Staff</option>
                  <option value="Specific Department">Specific Department</option>
                </select>
              </div>
              {user.role === 'HR Admin' && (
                <div style={{ minWidth: '180px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Department
                  </label>
                  <select
                    className="form-control"
                    value={filter.departmentId}
                    onChange={(e) => setFilter((prev) => ({ ...prev, departmentId: e.target.value }))}
                  >
                    <option value="">All departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading memos...</div>
          ) : filteredMemos.length === 0 ? (
            <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
              No memos match the current search or visibility filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredMemos.map((memo) => {
                const department = departments.find((d) => d.id === memo.departmentId);
                return (
                  <div key={memo.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <FileText size={18} />
                          <h4 style={{ margin: 0 }}>{memo.title}</h4>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {memo.createdDate} • {memo.targetAudience}
                          {memo.targetAudience === 'Specific Department' && department ? ` • ${department.name}` : ''}
                        </div>
                      </div>
                      {user.role === 'HR Admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(memo.id)}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '8px 12px' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                    <p style={{ margin: '18px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{memo.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Publish Memo Modal */}
        {user.role === 'HR Admin' && showPublishModal && (
          <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
            <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Publish a New Memo</h3>
                <button className="close-btn" onClick={() => setShowPublishModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {message && (
                    <div style={{ padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '13px' }}>
                      {message}
                    </div>
                  )}
                  {error && (
                    <div style={{ padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '13px' }}>
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Memo Title</label>
                    <input
                      className="form-control"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a short, clear title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Audience</label>
                    <select
                      className="form-control"
                      value={form.targetAudience}
                      onChange={(e) => setForm((prev) => ({ ...prev, targetAudience: e.target.value as 'All Staff' | 'Specific Department', departmentId: '' }))}
                    >
                      <option value="All Staff">All Staff</option>
                      <option value="Specific Department">Specific Department</option>
                    </select>
                  </div>

                  {form.targetAudience === 'Specific Department' && (
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-control"
                        value={form.departmentId}
                        onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                        required
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Memo Body</label>
                    <textarea
                      className="form-control"
                      rows={6}
                      value={form.content}
                      onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Write the memo message here."
                      required
                      style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowPublishModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Plus size={16} /> {saving ? 'Publishing...' : 'Publish Memo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
