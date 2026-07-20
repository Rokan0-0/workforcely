'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { Search, Plus, Edit2, Check, X, Users, MapPin, Phone, Shield, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  
  const getEmployeeAvatar = (name: string, photoUrl?: string) => {
    if (photoUrl && photoUrl.trim() !== '') return photoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=ffffff&size=128&rounded=true`;
  };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingProfileEmployee, setViewingProfileEmployee] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    departmentId: '',
    hireDate: '',
    baseSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    phone: '',
    address: '',
    nextOfKin: '',
    profilePhoto: ''
  });

  // Load employees and departments
  useEffect(() => {
    async function fetchData() {
      const cached = getCachedData('/api/employees');
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        const res = await fetch('/api/employees');
        if (res.ok) {
          const result = await res.json();
          setData(result);
          setCachedData('/api/employees', result);
        }
      } catch (err) {
        console.error('Failed to load employee list', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshFlag]);

  // Open Modal to Create
  const handleOpenCreate = () => {
    setEditEmployee(null);
    setFormData({
      name: '',
      email: '',
      role: 'Employee',
      departmentId: data?.departments?.[0]?.id || '',
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: 300000,
      housingAllowance: 100000,
      transportAllowance: 50000,
      phone: '',
      address: '',
      nextOfKin: '',
      profilePhoto: ''
    });
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (emp: any) => {
    setEditEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      departmentId: emp.departmentId,
      hireDate: emp.hireDate,
      baseSalary: emp.salary.base,
      housingAllowance: emp.salary.housing,
      transportAllowance: emp.salary.transport,
      phone: emp.contactInfo.phone,
      address: emp.contactInfo.address,
      nextOfKin: emp.contactInfo.nextOfKin,
      profilePhoto: emp.profilePhoto
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editEmployee?.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        departmentId: formData.departmentId,
        hireDate: formData.hireDate,
        salary: {
          base: Number(formData.baseSalary),
          housing: Number(formData.housingAllowance),
          transport: Number(formData.transportAllowance)
        },
        contactInfo: {
          phone: formData.phone,
          address: formData.address,
          nextOfKin: formData.nextOfKin
        },
        profilePhoto: formData.profilePhoto
      };

      const endpoint = '/api/employees';
      const method = editEmployee ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        triggerRefresh();
      }
    } catch (err) {
      console.error('Submit error', err);
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the directory?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete employee.');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading employee directory details...
      </div>
    );
  }

  const { employees, departments } = data;
  const isAdmin = user?.role === 'HR Admin';

  // Filters calculation
  const filteredEmployees = employees.filter((emp: any) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.departmentId === deptFilter;
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  // Get single employee profile for Employee View
  const employeeProfile = employees.find((emp: any) => emp.id === user?.id);
  const employeeDept = departments.find((d: any) => d.id === employeeProfile?.departmentId);

  return (
    <div className="page-container">
      {isAdmin ? (
        // ================= HR ADMIN VIEW =================
        <>
          {/* Table Directory Card */}
          <div className="table-card">
            <div className="table-header-area">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={20} color="var(--primary)" />
                <h2 className="chart-title">Employee Directory ({filteredEmployees.length})</h2>
              </div>
              <div className="table-actions">
                <div className="search-input-wrapper">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="HR Admin">HR Admin</option>
                  <option value="Employee">Employee</option>
                </select>

                <button className="btn-primary" onClick={handleOpenCreate}>
                  <Plus size={16} />
                  Add Employee
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Hire Date</th>
                    <th>Salary (Gross)</th>
                    <th>Phone</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp: any) => {
                      const dept = departments.find((d: any) => d.id === emp.departmentId);
                      const gross = emp.salary.base + emp.salary.housing + emp.salary.transport;
                      return (
                        <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => setViewingProfileEmployee(emp)}>
                          <td>
                            <div className="table-user-cell">
                              <img src={getEmployeeAvatar(emp.name, emp.profilePhoto)} alt={emp.name} className="table-user-avatar" />
                              <div>
                                <span className="table-user-name">{emp.name}</span>
                                <div className="table-user-email">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ fontWeight: 500 }}>{dept?.name || 'Unknown'}</span></td>
                          <td>
                            <span className={`badge ${emp.role === 'HR Admin' ? 'badge-present' : 'badge-applied'}`}>
                              {emp.role}
                            </span>
                          </td>
                          <td>{emp.hireDate}</td>
                          <td>₦{gross.toLocaleString()}</td>
                          <td>{emp.contactInfo.phone || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '6px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(emp);
                                }}
                                title="Edit Employee"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(emp.id, emp.name);
                                }}
                                title="Delete Employee"
                              >
                                <Trash2 size={14} />
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

          {/* Org Chart Visualization */}
          <div className="card">
            <h3 className="chart-title" style={{ marginBottom: '8px' }}>Interactive Organization Chart</h3>
            <p className="chart-subtitle" style={{ marginBottom: '24px' }}>Hierarchical reporting structure based on department managers.</p>
            
            <div className="org-chart-wrapper">
              <div className="org-chart-container">
                {/* Level 1: CEO/Admins */}
                <div className="org-chart-root">
                  <div className="org-node org-node-manager" style={{ borderColor: 'var(--primary)', borderWidth: '3px' }}>
                    <Shield size={16} color="var(--primary)" style={{ position: 'absolute', top: '8px', right: '8px' }} />
                    <img src={getEmployeeAvatar(employees[0]?.name || '', employees[0]?.profilePhoto)} alt={employees[0]?.name} className="org-node-avatar" />
                    <span className="org-node-name">{employees[0]?.name}</span>
                    <span className="org-node-role">{employees[0]?.role}</span>
                    <span className="org-node-dept">Executive Director</span>
                  </div>
 
                  {/* Level 2: Department Managers */}
                  <div className="org-chart-children">
                    {departments.map((dept: any) => {
                      const mgr = employees.find((e: any) => e.id === dept.managerId);
                      const deptStaff = employees.filter((e: any) => e.departmentId === dept.id && e.id !== dept.managerId);
                      
                      return (
                        <div key={dept.id} className="org-chart-node-wrapper">
                          <div className="org-node org-node-manager">
                            <img src={getEmployeeAvatar(mgr?.name || 'Vacant Manager', mgr?.profilePhoto)} alt={mgr?.name || 'Vacant'} className="org-node-avatar" />
                            <span className="org-node-name">{mgr?.name || 'Vacant Manager'}</span>
                            <span className="org-node-role">Dept Manager</span>
                            <span className="org-node-dept">{dept.name}</span>
                          </div>
 
                          {/* Level 3: Department Staff */}
                          {deptStaff.length > 0 && (
                            <div className="org-chart-children">
                              {deptStaff.slice(0, 3).map((staff: any) => (
                                <div key={staff.id} className="org-node" style={{ width: '160px', padding: '10px' }}>
                                  <img src={getEmployeeAvatar(staff.name, staff.profilePhoto)} alt={staff.name} className="org-node-avatar" style={{ width: '36px', height: '36px' }} />
                                  <span className="org-node-name" style={{ fontSize: '12px' }}>{staff.name}</span>
                                  <span className="org-node-role" style={{ fontSize: '10px' }}>{staff.role}</span>
                                </div>
                              ))}
                              {deptStaff.length > 3 && (
                                <div className="org-node" style={{ width: '160px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderStyle: 'dashed' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    + {deptStaff.length - 3} More Staff
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form CRUD Modal */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">{editEmployee ? `Edit ${editEmployee.name}` : 'Add New Employee'}</h3>
                  <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          required
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <select
                          className="form-control"
                          value={formData.departmentId}
                          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        >
                          {departments.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">User Role</label>
                        <select
                          className="form-control"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="Employee">Employee (Self-Service)</option>
                          <option value="HR Admin">HR Admin (Full Access)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Hire Date</label>
                        <input
                          type="date"
                          required
                          className="form-control"
                          value={formData.hireDate}
                          onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Profile Photo Upload</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {formData.profilePhoto && (
                            <img
                              src={formData.profilePhoto}
                              alt="Preview"
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            style={{ padding: '4px' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setFormData({ ...formData, profilePhoto: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              } catch (err) {
                                console.error('Image upload error', err);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                      Salary Components (₦ Monthly)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Basic Base</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.baseSalary}
                          onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Housing</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.housingAllowance}
                          onChange={(e) => setFormData({ ...formData, housingAllowance: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Transport</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.transportAllowance}
                          onChange={(e) => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                      Contact & Emergency Info
                    </h4>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+234..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Residential Address</label>
                      <textarea
                        rows={2}
                        className="form-control"
                        style={{ fontFamily: 'inherit' }}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next of Kin (Name & Relation)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Grace Obi (Wife)"
                        value={formData.nextOfKin}
                        onChange={(e) => setFormData({ ...formData, nextOfKin: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Employee
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Profile Detail Modal */}
          {viewingProfileEmployee && (
            <div className="modal-overlay" onClick={() => setViewingProfileEmployee(null)}>
              <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Employee Profile Details</h3>
                  <button className="close-btn" onClick={() => setViewingProfileEmployee(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                    <img
                      src={getEmployeeAvatar(viewingProfileEmployee.name, viewingProfileEmployee.profilePhoto)}
                      alt={viewingProfileEmployee.name}
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{viewingProfileEmployee.name}</h3>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginTop: '4px', marginBottom: 0 }}>
                        {viewingProfileEmployee.role} • {departments.find((d: any) => d.id === viewingProfileEmployee.departmentId)?.name || 'Unknown Department'}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>Hired Date: {viewingProfileEmployee.hireDate}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    {/* Contact Block */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} /> Contact Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Email:</span>
                          <span>{viewingProfileEmployee.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number:</span>
                          <span>{viewingProfileEmployee.contactInfo.phone || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Residential Address:</span>
                          <span style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{viewingProfileEmployee.contactInfo.address || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '4px', marginTop: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Next of Kin:</span>
                          <span>{viewingProfileEmployee.contactInfo.nextOfKin || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Salary Structure Block */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} /> Salary Structure
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', backgroundColor: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Base Salary:</span>
                          <span style={{ fontWeight: 600 }}>₦{viewingProfileEmployee.salary.base.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Housing Allowance:</span>
                          <span style={{ fontWeight: 600 }}>₦{viewingProfileEmployee.salary.housing.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Transport Allowance:</span>
                          <span style={{ fontWeight: 600 }}>₦{viewingProfileEmployee.salary.transport.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', fontWeight: 700, color: 'var(--primary)' }}>
                          <span>Gross Monthly Pay:</span>
                          <span>₦{((viewingProfileEmployee.salary.base || 0) + (viewingProfileEmployee.salary.housing || 0) + (viewingProfileEmployee.salary.transport || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setViewingProfileEmployee(null)}>
                    Close
                  </button>
                  {isAdmin && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const targetEmp = viewingProfileEmployee;
                        setViewingProfileEmployee(null);
                        handleOpenEdit(targetEmp);
                      }}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // ================= EMPLOYEE VIEW (READ-ONLY) =================
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', flexWrap: 'wrap' }}>
              <img
                src={getEmployeeAvatar(employeeProfile?.name || '', employeeProfile?.profilePhoto)}
                alt={employeeProfile?.name}
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
              />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>{employeeProfile?.name}</h2>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', marginTop: '4px' }}>
                  {employeeProfile?.role} • {employeeDept?.name || 'Unknown Department'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Hired Date: {employeeProfile?.hireDate}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* Contact Block */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} /> Contact Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Email:</span>
                    <p style={{ marginTop: '2px' }}>{employeeProfile?.email}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number:</span>
                    <p style={{ marginTop: '2px' }}>{employeeProfile?.contactInfo.phone || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Residential Address:</span>
                    <p style={{ marginTop: '2px', lineHeight: '1.4' }}>{employeeProfile?.contactInfo.address || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Next of Kin:</span>
                    <p style={{ marginTop: '2px' }}>{employeeProfile?.contactInfo.nextOfKin || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Salary Structure Block */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} /> Confirmed Salary Structure
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Salary:</span>
                    <span style={{ fontWeight: 600 }}>₦{employeeProfile?.salary.base.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Housing Allowance:</span>
                    <span style={{ fontWeight: 600 }}>₦{employeeProfile?.salary.housing.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transport Allowance:</span>
                    <span style={{ fontWeight: 600 }}>₦{employeeProfile?.salary.transport.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '6px', fontWeight: 700, color: 'var(--primary)', fontSize: '15px' }}>
                    <span>Gross Monthly Pay:</span>
                    <span>₦{((employeeProfile?.salary.base || 0) + (employeeProfile?.salary.housing || 0) + (employeeProfile?.salary.transport || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
