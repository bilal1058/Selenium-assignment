import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { patientAPI } from '../services/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emergencyContactError, setEmergencyContactError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: '',
    address: '',
    emergency_contact: '',
    medical_history: '',
    allergies: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'phone' || name === 'emergency_contact'
      ? value.replace(/\D/g, '').slice(0, 11)
      : value;

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

    if (name === 'phone') {
      setPhoneError('');
    }
    if (name === 'emergency_contact') {
      setEmergencyContactError('');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      blood_group: '',
      address: '',
      emergency_contact: '',
      medical_history: '',
      allergies: ''
    });
    setEditMode(false);
    setSelectedPatient(null);
    setPhoneError('');
    setEmergencyContactError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{11}$/.test(formData.phone)) {
      setPhoneError('Phone number must be exactly 11 digits.');
      toast.error('Phone number must be exactly 11 digits');
      return;
    }

    if (formData.emergency_contact && !/^\d{11}$/.test(formData.emergency_contact)) {
      setEmergencyContactError('Emergency contact must be exactly 11 digits.');
      toast.error('Emergency contact must be exactly 11 digits');
      return;
    }

    try {
      if (editMode) {
        await patientAPI.update(selectedPatient.id, formData);
        toast.success('Patient updated successfully');
      } else {
        await patientAPI.create(formData);
        toast.success('Patient registered successfully');
      }
      setShowModal(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email || '',
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      medical_history: patient.medical_history || '',
      allergies: patient.allergies || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientAPI.delete(id);
        toast.success('Patient deleted successfully');
        fetchPatients();
      } catch (error) {
        toast.error('Failed to delete patient');
      }
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
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
          <h2><i className="bi bi-people me-2"></i>Patient Management</h2>
          <p className="text-muted">Manage patient records and medical history</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-person-plus me-2"></i>Add Patient
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
                  placeholder="Search patients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">Total: {filteredPatients.length} patients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="card-body">
          {filteredPatients.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-people"></i>
              <p>No patients found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>#{patient.id}</td>
                      <td><strong>{patient.first_name} {patient.last_name}</strong></td>
                      <td>{patient.email || '-'}</td>
                      <td>{patient.phone}</td>
                      <td><span className="text-capitalize">{patient.gender}</span></td>
                      <td><span className="badge bg-danger">{patient.blood_group || '-'}</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(patient)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(patient.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${editMode ? 'pencil' : 'person-plus'} me-2`}></i>
                  {editMode ? 'Edit Patient' : 'Register New Patient'}
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
                      <small className="text-danger">Phone number must be exactly 11 digits, otherwise patient will not be created/updated.</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date of Birth *</label>
                      <input type="date" className="form-control" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Gender *</label>
                      <select className="form-select" name="gender" value={formData.gender} onChange={handleInputChange} required>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Blood Group</label>
                      <select className="form-select" name="blood_group" value={formData.blood_group} onChange={handleInputChange}>
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Emergency Contact</label>
                      <input
                        type="tel"
                        className={`form-control ${emergencyContactError ? 'is-invalid' : ''}`}
                        name="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleInputChange}
                        maxLength={11}
                        inputMode="numeric"
                        placeholder="03001234567"
                      />
                      <div className="invalid-feedback">{emergencyContactError || 'Emergency contact must be exactly 11 digits.'}</div>
                      <small className="text-danger">If provided, emergency contact must be exactly 11 digits.</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Allergies</label>
                      <input type="text" className="form-control" name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="e.g., Penicillin, Pollen" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Address</label>
                      <textarea className="form-control" name="address" value={formData.address} onChange={handleInputChange} rows="2"></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Medical History</label>
                      <textarea className="form-control" name="medical_history" value={formData.medical_history} onChange={handleInputChange} rows="3" placeholder="Previous conditions, surgeries, etc."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi bi-${editMode ? 'check' : 'plus'} me-2`}></i>
                    {editMode ? 'Update' : 'Register'}
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

export default Patients;
