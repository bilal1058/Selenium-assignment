import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { doctorAPI } from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience_years: 0,
    consultation_fee: 0,
    available_days: '',
    available_time_start: '09:00',
    available_time_end: '17:00',
    bio: '',
    is_active: true
  });

  const specializations = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'General Medicine', 'Surgery',
    'Gynecology', 'ENT'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getAll();
      setDoctors(response.data);
    } catch (error) {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const sanitizedValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 11) : value;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : sanitizedValue
    }));

    if (name === 'phone') {
      setPhoneError('');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      specialization: '',
      qualification: '',
      experience_years: 0,
      consultation_fee: 0,
      available_days: '',
      available_time_start: '09:00',
      available_time_end: '17:00',
      bio: '',
      is_active: true
    });
    setEditMode(false);
    setSelectedDoctor(null);
    setPhoneError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{11}$/.test(formData.phone)) {
      setPhoneError('Phone number must be exactly 11 digits.');
      toast.error('Phone number must be exactly 11 digits');
      return;
    }

    try {
      const submitData = {
        ...formData,
        experience_years: parseInt(formData.experience_years),
        consultation_fee: parseFloat(formData.consultation_fee)
      };
      
      if (editMode) {
        await doctorAPI.update(selectedDoctor.id, submitData);
        toast.success('Doctor updated successfully');
      } else {
        await doctorAPI.create(submitData);
        toast.success('Doctor added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      email: doctor.email || '',
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification || '',
      experience_years: doctor.experience_years || 0,
      consultation_fee: doctor.consultation_fee || 0,
      available_days: doctor.available_days || '',
      available_time_start: doctor.available_time_start || '09:00',
      available_time_end: doctor.available_time_end || '17:00',
      bio: doctor.bio || '',
      is_active: doctor.is_active
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorAPI.delete(id);
        toast.success('Doctor deleted successfully');
        fetchDoctors();
      } catch (error) {
        toast.error('Failed to delete doctor');
      }
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2><i className="bi bi-person-badge me-2"></i>Doctor Management</h2>
          <p className="text-muted">Manage doctors and their schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-person-plus me-2"></i>Add Doctor
        </button>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search doctors by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">Total: {filteredDoctors.length} doctors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="row g-4">
        {filteredDoctors.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="empty-state">
                <i className="bi bi-person-badge"></i>
                <p>No doctors found</p>
              </div>
            </div>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="bi bi-person-circle text-primary fs-4"></i>
                      </div>
                      <div>
                        <h5 className="mb-0">Dr. {doctor.first_name} {doctor.last_name}</h5>
                        <small className="text-muted">{doctor.specialization}</small>
                      </div>
                    </div>
                    <span className={`badge ${doctor.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {doctor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="mb-1 text-break"><i className="bi bi-envelope me-2"></i>{doctor.email || 'N/A'}</p>
                    <p className="mb-1"><i className="bi bi-telephone me-2"></i>{doctor.phone}</p>
                    <p className="mb-1"><i className="bi bi-award me-2"></i>{doctor.qualification || 'N/A'}</p>
                    <p className="mb-0"><i className="bi bi-briefcase me-2"></i>{doctor.experience_years} years experience</p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                    <span className="text-success fw-bold">PKR {doctor.consultation_fee}</span>
                    <div>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(doctor)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(doctor.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${editMode ? 'pencil' : 'person-plus'} me-2`}></i>
                  {editMode ? 'Edit Doctor' : 'Add New Doctor'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input type="text" className="form-control" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input type="text" className="form-control" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone *</label>
                      <input
                        type="tel"
                        className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={11}
                        inputMode="numeric"
                        placeholder="03001234567"
                        required
                      />
                      <div className="invalid-feedback">{phoneError || 'Phone number must be exactly 11 digits.'}</div>
                      <small className="text-danger">Phone number must be exactly 11 digits, otherwise doctor will not be created/updated.</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Specialization *</label>
                      <select className="form-select" name="specialization" value={formData.specialization} onChange={handleInputChange} required>
                        <option value="">Select Specialization</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Qualification</label>
                      <input type="text" className="form-control" name="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g., MD, MBBS" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Experience (Years)</label>
                      <input type="number" className="form-control" name="experience_years" value={formData.experience_years} onChange={handleInputChange} min="0" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Consultation Fee (PKR)</label>
                      <input type="number" className="form-control" name="consultation_fee" value={formData.consultation_fee} onChange={handleInputChange} min="0" step="0.01" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <div className="form-check mt-2">
                        <input type="checkbox" className="form-check-input" name="is_active" checked={formData.is_active} onChange={handleInputChange} id="isActive" />
                        <label className="form-check-label" htmlFor="isActive">Active</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Available Days</label>
                      <input type="text" className="form-control" name="available_days" value={formData.available_days} onChange={handleInputChange} placeholder="Mon,Tue,Wed" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-control" name="available_time_start" value={formData.available_time_start} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-control" name="available_time_end" value={formData.available_time_end} onChange={handleInputChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Bio</label>
                      <textarea className="form-control" name="bio" value={formData.bio} onChange={handleInputChange} rows="3"></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi bi-${editMode ? 'check' : 'plus'} me-2`}></i>
                    {editMode ? 'Update' : 'Add Doctor'}
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

export default Doctors;
