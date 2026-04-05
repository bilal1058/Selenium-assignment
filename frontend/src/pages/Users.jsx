import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'receptionist',
    doctor_id: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDoctors();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors/');
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetch doctors');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 11) : value;
    setFormData({ ...formData, [name]: sanitizedValue });

    if (name === 'phone') {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.phone && !/^\d{11}$/.test(formData.phone)) {
      setPhoneError('Phone number must be exactly 11 digits.');
      toast.error('Phone number must be exactly 11 digits');
      return;
    }

    try {
      const payload = { ...formData };
      if (payload.role !== 'doctor') {
        delete payload.doctor_id;
      } else {
        payload.doctor_id = parseInt(payload.doctor_id);
      }
      
      await api.post('/auth/users', payload);
      toast.success('User created successfully!');
      setShowModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'receptionist',
        doctor_id: ''
      });
      setPhoneError('');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/auth/users/${userId}`, { is_active: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'bg-danger';
      case 'doctor': return 'bg-success';
      case 'receptionist': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-people-fill me-2"></i>
          User Management
        </h4>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-1"></i> Add User
        </button>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info mb-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Role Permissions:</strong>
        <ul className="mb-0 mt-2">
          <li><strong>Admin:</strong> Full access to all modules, can manage users</li>
          <li><strong>Doctor:</strong> Can only view/manage own appointments and own prescriptions</li>
          <li><strong>Receptionist:</strong> Can manage appointments and billing only</li>
        </ul>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((user) => user.role !== 'admin').map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadge(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                      {user.doctor_id && (
                        <small className="text-muted ms-2">(Doctor ID: {user.doctor_id})</small>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleString() 
                        : 'Never'}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'} me-2`}
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`bi bi-${user.is_active ? 'pause' : 'play'}`}></i>
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(user.id, user.username)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Add New User
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                      <small className="text-muted">Use letters, numbers, dot, underscore, or hyphen.</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="03001234567"
                        maxLength={11}
                        inputMode="numeric"
                      />
                      <div className="invalid-feedback">{phoneError || 'Phone number must be exactly 11 digits.'}</div>
                      <small className="text-danger">Phone number must be exactly 11 digits, otherwise account will not be created.</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={6}
                        required
                      />
                      <small className="text-muted">Min 6 chars, must include letters & numbers</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Role *</label>
                      <select
                        className="form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                      >
                        <option value="receptionist">Receptionist</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {formData.role === 'doctor' && (
                      <div className="col-12 mb-3">
                        <label className="form-label">Link to Doctor Profile *</label>
                        <select
                          className="form-select"
                          name="doctor_id"
                          value={formData.doctor_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">-- Select Doctor --</option>
                          {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>
                              Dr. {doc.first_name} {doc.last_name} - {doc.specialization}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">
                          Doctor users must be linked to a doctor profile to access their appointments
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-1"></i> Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
