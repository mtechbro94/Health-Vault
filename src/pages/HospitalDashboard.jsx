import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getPatientByPatientId,
    getPatientRecords,
    addMedicalRecord,
    logAccess,
    searchPatients,
    updatePatientProfile,
    broadcastBloodRequest,
    triggerCriticalAlert
} from '../utils/api';
import { formatDate, getFileIcon, getFileType, fileToBase64, BLOOD_GROUPS } from '../utils/helpers';
import Header from '../components/Header';

const HospitalDashboard = () => {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState('search');

    // Blood Request State
    const REQUEST_TYPES = {
        ACCIDENT: 'Accident / Trauma (Base: 90)',
        SURGERY: 'Emergency Surgery (Base: 75)',
        CHILDBIRTH: 'Childbirth / Obstetric (Base: 80)',
        THALASSEMIA: 'Chronic (Thalassemia) (Base: 60)'
    };

    const BASE_SCORES = {
        ACCIDENT: 90,
        SURGERY: 75,
        CHILDBIRTH: 80,
        THALASSEMIA: 60
    };

    const [requestForm, setRequestForm] = useState({
        bloodGroup: '',
        units: 1,
        requestType: 'ACCIDENT',
        timeLimit: 30 // Default 30 minutes
    });
    const [requestStatus, setRequestStatus] = useState({ loading: false, result: null, error: '' });
    const [activeRequests, setActiveRequests] = useState([]); // Store live requests

    const handleRequestBroadcast = async (e) => {
        e.preventDefault();
        if (!requestForm.bloodGroup) {
            setRequestStatus({ loading: false, result: null, error: 'Please select a blood group' });
            return;
        }

        setRequestStatus({ loading: true, result: null, error: '' });
        try {
            const result = await broadcastBloodRequest({
                hospitalId: user.id,
                hospitalName: profile?.name || 'Hospital',
                ...requestForm
            });
            setRequestStatus({ loading: false, result: result, error: '' });
            // Clear form after success
            if (result.success) {
                // Add timestamp for local timer calculation if not present
                const newRequest = { ...result.request, createdAt: new Date().toISOString() };
                setActiveRequests(prev => [newRequest, ...prev]);
                alert(`Broadcast Sent!\nUrgency Score: ${result.request.urgencyScore}\nDonors Notified: ${result.request.donorsNotified}`);
            }
        } catch (error) {
            setRequestStatus({ loading: false, result: null, error: error.message });
        }
    };

    const [searchId, setSearchId] = useState('');
    const [searchError, setSearchError] = useState('');
    const [patient, setPatient] = useState(null);
    const [patientRecords, setPatientRecords] = useState([]);

    // Blood donor search state
    const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
    const [donors, setDonors] = useState([]);

    // File upload state
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // Blood donation edit state
    const [editingBloodDonation, setEditingBloodDonation] = useState(false);
    const [bloodDonationForm, setBloodDonationForm] = useState({
        bloodDonationStatus: 'available',
        bloodDonationReason: '',
        bloodDonationDisease: ''
    });
    const [bloodDonationMessage, setBloodDonationMessage] = useState({ type: '', text: '' });

    // Donor info modal state
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showDonorInfo, setShowDonorInfo] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchError('');
        setPatient(null);
        setPatientRecords([]);

        if (!searchId.trim()) {
            setSearchError('Please enter a Patient ID');
            return;
        }

        try {
            const foundPatient = await getPatientByPatientId(searchId.trim());

            if (!foundPatient) {
                setSearchError('No patient found with this ID');
                return;
            }

            if (!foundPatient.hospitalAccessConsent) {
                setSearchError('This patient has not allowed hospital access to their records');
                return;
            }

            // Log the access
            await logAccess(foundPatient.patientId, 'hospital', user.id, profile?.name || 'Hospital');

            setPatient(foundPatient);
            const records = await getPatientRecords(foundPatient.patientId);
            setPatientRecords(records);
        } catch (error) {
            setSearchError('Error searching for patient. Please try again.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !patient) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setUploadMessage({ type: 'error', text: 'Please upload a PDF or image file' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadMessage({ type: 'error', text: 'File size must be less than 5MB' });
            return;
        }

        setUploading(true);
        setUploadMessage({ type: '', text: '' });

        try {
            const fileData = await fileToBase64(file);

            await addMedicalRecord({
                patientId: patient.patientId,
                fileName: file.name,
                fileData,
                fileType: getFileType(file.name),
                uploadedBy: user.id,
                uploadedByType: 'hospital',
                uploadedByName: profile?.name || 'Hospital',
                uploadDate: new Date().toISOString()
            });

            setUploadMessage({ type: 'success', text: 'Record uploaded successfully!' });
            const records = await getPatientRecords(patient.patientId);
            setPatientRecords(records);
        } catch (error) {
            setUploadMessage({ type: 'error', text: 'Failed to upload file' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const searchBloodDonors = async () => {
        if (!selectedBloodGroup) {
            setDonors([]);
            return;
        }
        const foundDonors = await searchPatients(selectedBloodGroup, true);
        setDonors(foundDonors);
    };

    const openFile = (record) => {
        const newWindow = window.open();
        if (record.fileType === 'pdf') {
            newWindow.document.write(`
        <html>
          <head><title>${record.fileName}</title></head>
          <body style="margin:0">
            <embed src="${record.fileData}" type="application/pdf" width="100%" height="100%">
          </body>
        </html>
      `);
        } else {
            newWindow.document.write(`
        <html>
          <head><title>${record.fileName}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1f2937">
            <img src="${record.fileData}" style="max-width:100%;max-height:100vh" alt="${record.fileName}">
          </body>
        </html>
      `);
        }
    };

    const startEditBloodDonation = () => {
        if (patient) {
            setBloodDonationForm({
                bloodDonationStatus: patient.bloodDonationStatus || 'available',
                bloodDonationReason: patient.bloodDonationReason || '',
                bloodDonationDisease: patient.bloodDonationDisease || ''
            });
            setEditingBloodDonation(true);
            setBloodDonationMessage({ type: '', text: '' });
        }
    };

    const handleBloodDonationFormChange = (e) => {
        const { name, value } = e.target;
        setBloodDonationForm(prev => {
            const updated = { ...prev, [name]: value };

            // Reset dependent fields
            if (name === 'bloodDonationStatus') {
                if (value === 'available' || value === 'unavailable') {
                    updated.bloodDonationReason = '';
                    updated.bloodDonationDisease = '';
                }
            }
            if (name === 'bloodDonationReason' && value !== 'diseased') {
                updated.bloodDonationDisease = '';
            }

            return updated;
        });
    };

    const saveBloodDonation = () => {
        try {
            updatePatientProfile(patient.patientId, {
                bloodDonationStatus: bloodDonationForm.bloodDonationStatus,
                bloodDonationReason: bloodDonationForm.bloodDonationReason,
                bloodDonationDisease: bloodDonationForm.bloodDonationDisease,
                bloodDonationStatusDate: new Date().toISOString()
            });

            // Refresh patient data
            const updatedPatient = getPatientByPatientId(patient.patientId);
            setPatient(updatedPatient);
            setEditingBloodDonation(false);
            setBloodDonationMessage({ type: 'success', text: 'Blood donation status updated!' });
        } catch (error) {
            setBloodDonationMessage({ type: 'error', text: 'Failed to update status' });
        }
    };

    // Medical Info Editing State (Allergies, Conditions, Medications)
    const [editingMedicalInfo, setEditingMedicalInfo] = useState(false);
    const [medicalInfoForm, setMedicalInfoForm] = useState({
        allergies: '',
        conditions: '',
        medications: ''
    });

    const startEditMedicalInfo = () => {
        if (patient) {
            setMedicalInfoForm({
                allergies: patient.allergies || '',
                conditions: patient.conditions || '',
                medications: patient.medications || ''
            });
            setEditingMedicalInfo(true);
        }
    };

    const handleMedicalInfoChange = (e) => {
        const { name, value } = e.target;
        setMedicalInfoForm(prev => ({ ...prev, [name]: value }));
    };

    const saveMedicalInfo = () => {
        try {
            updatePatientProfile(patient.patientId, {
                allergies: medicalInfoForm.allergies,
                conditions: medicalInfoForm.conditions,
                medications: medicalInfoForm.medications
            });

            // Refresh patient data
            const updatedPatient = getPatientByPatientId(patient.patientId);
            setPatient(updatedPatient);
            setEditingMedicalInfo(false);
            alert('Medical details updated successfully!');
        } catch (error) {
            alert('Failed to update medical details');
        }
    };

    const clearPatient = () => {
        setPatient(null);
        setPatientRecords([]);
        setSearchId('');
        setSearchError('');
        setEditingBloodDonation(false);
    };

    return (
        <>
            <Header />
            <div className="page">
                <div className="container">
                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">🏥 Hospital Dashboard</h1>
                        <p className="page-subtitle">
                            {profile?.name || 'Hospital'} - Access patient records and manage blood donations
                        </p>
                    </div>

                    {/* Blood Request Section (New Feature) */}
                    <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ef4444' }}>
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>📢 Emergency Blood Broadcast</h2>
                        <form onSubmit={handleRequestBroadcast} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div className="form-group">
                                <label className="form-label">Blood Group Needed</label>
                                <select
                                    className="form-select"
                                    value={requestForm.bloodGroup}
                                    onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                                >
                                    <option value="">Select Group</option>
                                    {BLOOD_GROUPS.map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Context / Type</label>
                                <select
                                    className="form-select"
                                    value={requestForm.requestType}
                                    onChange={(e) => setRequestForm({ ...requestForm, requestType: e.target.value })}
                                >
                                    {Object.entries(REQUEST_TYPES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Units Required</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="form-input"
                                    value={requestForm.units}
                                    onChange={(e) => setRequestForm({ ...requestForm, units: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time Limit (Mins)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="120"
                                    className="form-input"
                                    value={requestForm.timeLimit}
                                    onChange={(e) => setRequestForm({ ...requestForm, timeLimit: parseInt(e.target.value) })}
                                    style={{ borderColor: '#f87171' }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ background: '#ef4444', height: '42px' }}
                                disabled={requestStatus.loading}
                            >
                                {requestStatus.loading ? 'Calculating...' : '🚨 Broadcast Alert'}
                            </button>
                        </form>

                        {requestStatus.result && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid #22c55e' }}>
                                <p style={{ margin: 0, fontWeight: 'bold', color: '#22c55e' }}>✅ {requestStatus.result.message}</p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#fff' }}>
                                    Urgency Score: <strong>{requestStatus.result.request.urgencyScore}/100</strong>
                                    {requestStatus.result.request.isCritical && <span style={{ marginLeft: '1rem', padding: '0.2rem 0.5rem', background: '#ef4444', borderRadius: '4px', fontSize: '0.8rem' }}>CRITICAL</span>}
                                </p>
                            </div>
                        )}

                        {/* Active Requests List with Live Timer */}
                        {activeRequests.length > 0 && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>📡 Live Active Broadcasts</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {activeRequests.map((req) => (
                                        <ActiveRequestCard key={req.id} request={req} baseScores={BASE_SCORES} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {requestStatus.error && (
                            <div style={{ marginTop: '1rem', color: '#ef4444' }}>âŒ {requestStatus.error}</div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="tabs" style={{ marginBottom: '2rem' }}>
                        <button
                            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('search'); clearPatient(); }}
                        >
                            🔍 Patient Search
                        </button>
                        <button
                            className={`tab ${activeTab === 'blood' ? 'active' : ''}`}
                            onClick={() => setActiveTab('blood')}
                        >
                            🩸 Blood Donation
                        </button>
                    </div>

                    {/* Patient Search Tab */}
                    {activeTab === 'search' && (
                        <div className="glass-card fade-in">
                            {!patient ? (
                                <>
                                    <div className="section-header">
                                        <h2 className="section-title">🔍 Search Patient by ID</h2>
                                    </div>
                                    <p style={{ color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                                        Enter a patient's unique ID to access their emergency profile and medical records.
                                    </p>

                                    {searchError && (
                                        <div className="alert alert-error">
                                            <span>⚠️</span>
                                            <span>{searchError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSearch}>
                                        <div className="search-box">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter Patient ID (e.g., ABC-123-XYZ)"
                                                value={searchId}
                                                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                                                style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                                            />
                                            <button type="submit" className="btn btn-primary">
                                                Search
                                            </button>
                                        </div>
                                    </form>

                                    <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
                                        <span>ℹ️</span>
                                        <span>You can only search patients using their unique Patient ID. Patients must have enabled hospital access for you to view their records.</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Patient Found - Show Details */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 className="section-title">Patient Profile</h2>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span className="read-only-badge">🔍’ Read Only</span>
                                            <button className="btn btn-secondary btn-sm" onClick={clearPatient}>
                                                ← Back to Search
                                            </button>
                                        </div>
                                    </div>

                                    {/* Patient ID Display */}
                                    <div className="patient-id-display" style={{ marginBottom: '2rem' }}>
                                        <div className="patient-id-label">Patient ID</div>
                                        <div className="patient-id-value">{patient.patientId}</div>
                                    </div>

                                    {/* Emergency Profile (Read Only) */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🏥 Emergency Profile
                                            <span className="badge badge-warning">View Only</span>
                                        </h3>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '1rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '1.5rem',
                                            borderRadius: 'var(--radius-xl)'
                                        }}>
                                            <div>
                                                <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Blood Group</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                                                    {patient.bloodGroup || 'Not specified'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Patient Contact</div>
                                                <div style={{ fontWeight: 600 }}>{patient.contactNumber || 'Not specified'}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Emergency Contact</div>
                                                <div style={{ fontWeight: 600 }}>{patient.emergencyContact || 'Not specified'}</div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Blood Donation Status</div>
                                                    {patient.bloodDonation && !editingBloodDonation && (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={startEditBloodDonation}
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                                                        >
                                                            âœï¸ Edit Status
                                                        </button>
                                                    )}
                                                </div>

                                                {bloodDonationMessage.text && (
                                                    <div className={`alert ${bloodDonationMessage.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem' }}>
                                                        <span>{bloodDonationMessage.text}</span>
                                                    </div>
                                                )}

                                                {!patient.bloodDonation ? (
                                                    <span className="badge badge-warning">✗ Not a Donor</span>
                                                ) : editingBloodDonation ? (
                                                    <div style={{
                                                        background: 'rgba(220, 38, 38, 0.1)',
                                                        border: '1px solid rgba(220, 38, 38, 0.3)',
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: '1rem'
                                                    }}>
                                                        {/* Status Selection */}
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <label style={{ color: 'var(--gray-300)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Availability Status</label>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                    <input type="radio" name="bloodDonationStatus" value="available"
                                                                        checked={bloodDonationForm.bloodDonationStatus === 'available'}
                                                                        onChange={handleBloodDonationFormChange} style={{ accentColor: '#22c55e' }} />
                                                                    <span style={{ color: '#22c55e' }}>✓ Available</span>
                                                                </label>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                    <input type="radio" name="bloodDonationStatus" value="temporarily_unavailable"
                                                                        checked={bloodDonationForm.bloodDonationStatus === 'temporarily_unavailable'}
                                                                        onChange={handleBloodDonationFormChange} style={{ accentColor: '#f59e0b' }} />
                                                                    <span style={{ color: '#f59e0b' }}>⏳ Temporarily Unavailable</span>
                                                                </label>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                    <input type="radio" name="bloodDonationStatus" value="unavailable"
                                                                        checked={bloodDonationForm.bloodDonationStatus === 'unavailable'}
                                                                        onChange={handleBloodDonationFormChange} style={{ accentColor: '#ef4444' }} />
                                                                    <span style={{ color: '#ef4444' }}>✗ Unavailable</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Reason Selection - Only for temporarily_unavailable */}
                                                        {bloodDonationForm.bloodDonationStatus === 'temporarily_unavailable' && (
                                                            <div style={{ marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                                                <label style={{ color: '#f59e0b', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Reason</label>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                        <input type="radio" name="bloodDonationReason" value="donated_recently"
                                                                            checked={bloodDonationForm.bloodDonationReason === 'donated_recently'}
                                                                            onChange={handleBloodDonationFormChange} style={{ accentColor: '#f59e0b' }} />
                                                                        <span style={{ color: 'white' }}>Blood Donated Recently</span>
                                                                    </label>
                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                        <input type="radio" name="bloodDonationReason" value="diseased"
                                                                            checked={bloodDonationForm.bloodDonationReason === 'diseased'}
                                                                            onChange={handleBloodDonationFormChange} style={{ accentColor: '#f59e0b' }} />
                                                                        <span style={{ color: 'white' }}>Diseased / Medical Condition</span>
                                                                    </label>
                                                                </div>

                                                                {bloodDonationForm.bloodDonationReason === 'diseased' && (
                                                                    <input type="text" name="bloodDonationDisease" className="form-input"
                                                                        placeholder="Specify disease/condition..."
                                                                        value={bloodDonationForm.bloodDonationDisease}
                                                                        onChange={handleBloodDonationFormChange}
                                                                        style={{ marginTop: '0.5rem', fontSize: '0.875rem' }} />
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Save/Cancel Buttons */}
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-success btn-sm" onClick={saveBloodDonation}>
                                                                💾 Save
                                                            </button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingBloodDonation(false)}>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : patient.bloodDonationStatus === 'available' ? (
                                                    <span className="badge badge-success">✓ Available</span>
                                                ) : patient.bloodDonationStatus === 'temporarily_unavailable' ? (
                                                    <div>
                                                        <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>⏳ Temporarily Unavailable</span>
                                                        {patient.bloodDonationReason === 'donated_recently' && (
                                                            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                                                                Reason: Donated Recently
                                                            </span>
                                                        )}
                                                        {patient.bloodDonationReason === 'diseased' && patient.bloodDonationDisease && (
                                                            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                                                                Reason: {patient.bloodDonationDisease}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge badge-error">✗ Unavailable</span>
                                                )}
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Allergies</div>
                                                    {!editingMedicalInfo && (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={startEditMedicalInfo}
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                        >
                                                            âœï¸ Edit Med Info
                                                        </button>
                                                    )}
                                                </div>
                                                {editingMedicalInfo ? (
                                                    <textarea
                                                        name="allergies"
                                                        className="form-input"
                                                        value={medicalInfoForm.allergies}
                                                        onChange={handleMedicalInfoChange}
                                                        rows="2"
                                                        placeholder="List allergies..."
                                                    />
                                                ) : (
                                                    <div>{patient.allergies || 'None reported'}</div>
                                                )}
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Chronic Conditions</div>
                                                {editingMedicalInfo ? (
                                                    <textarea
                                                        name="conditions"
                                                        className="form-input"
                                                        value={medicalInfoForm.conditions}
                                                        onChange={handleMedicalInfoChange}
                                                        rows="2"
                                                        placeholder="List chronic conditions..."
                                                    />
                                                ) : (
                                                    <div>{patient.conditions || 'None reported'}</div>
                                                )}
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Medications</div>
                                                {editingMedicalInfo ? (
                                                    <textarea
                                                        name="medications"
                                                        className="form-input"
                                                        value={medicalInfoForm.medications}
                                                        onChange={handleMedicalInfoChange}
                                                        rows="2"
                                                        placeholder="List current medications..."
                                                    />
                                                ) : (
                                                    <div>{patient.medications || 'None reported'}</div>
                                                )}

                                                {editingMedicalInfo && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                        <button className="btn btn-success btn-sm" onClick={saveMedicalInfo}>
                                                            💾 Save Changes
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingMedicalInfo(false)}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload New Record */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ marginBottom: '1rem' }}>📤 Upload Medical Record</h3>

                                        {uploadMessage.text && (
                                            <div className={`alert ${uploadMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                                                <span>{uploadMessage.type === 'success' ? '✅' : '⚠️'}</span>
                                                <span>{uploadMessage.text}</span>
                                            </div>
                                        )}

                                        <div
                                            className="file-upload"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <div className="file-upload-icon">📤</div>
                                            <div className="file-upload-text">
                                                {uploading ? 'Uploading...' : 'Click to upload medical record'}
                                            </div>
                                            <div className="file-upload-hint">
                                                PDF or Images â€¢ Max 5MB â€¢ This record will be added to patient's vault
                                            </div>
                                        </div>
                                    </div>

                                    {/* Existing Records */}
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>📋 Medical Records ({patientRecords.length})</h3>

                                        {patientRecords.length === 0 ? (
                                            <div className="empty-state">
                                                <div className="empty-state-icon">📂</div>
                                                <div className="empty-state-text">No medical records</div>
                                                <div className="empty-state-subtext">Upload the first record for this patient</div>
                                            </div>
                                        ) : (
                                            <div className="table-container">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>File</th>
                                                            <th>Upload Date</th>
                                                            <th>Uploaded By</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {patientRecords.map(record => (
                                                            <tr key={record.id}>
                                                                <td>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                        <span style={{ fontSize: '1.5rem' }}>{getFileIcon(record.fileType)}</span>
                                                                        <span style={{ fontWeight: 500, color: 'white' }}>{record.fileName}</span>
                                                                    </div>
                                                                </td>
                                                                <td>{formatDate(record.uploadDate)}</td>
                                                                <td>
                                                                    <span className={`badge ${record.uploadedByType === 'patient' ? 'badge-primary' : 'badge-purple'}`}>
                                                                        {record.uploadedByType === 'patient' ? '👤 Patient' : '🏥 Hospital'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        onClick={() => openFile(record)}
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Blood Donation Tab */}
                    {activeTab === 'blood' && (
                        <div className="glass-card fade-in">
                            <div className="section-header">
                                <h2 className="section-title">🩸 Blood Donation Assistance</h2>
                            </div>
                            <p style={{ color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                                Find patients who have opted in for blood donation with the required blood group.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                <select
                                    className="form-select"
                                    value={selectedBloodGroup}
                                    onChange={(e) => setSelectedBloodGroup(e.target.value)}
                                    style={{ maxWidth: '200px' }}
                                >
                                    <option value="">Select Blood Group</option>
                                    {BLOOD_GROUPS.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-primary"
                                    onClick={searchBloodDonors}
                                    disabled={!selectedBloodGroup}
                                >
                                    Search Donors
                                </button>
                            </div>

                            {selectedBloodGroup && (
                                <div className="fade-in">
                                    <h3 style={{ marginBottom: '1rem' }}>
                                        Willing Donors with Blood Group {selectedBloodGroup}
                                    </h3>

                                    {donors.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">🩸</div>
                                            <div className="empty-state-text">No donors found</div>
                                            <div className="empty-state-subtext">
                                                No patients with blood group {selectedBloodGroup} have opted in for donation
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="table-container">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Candidate Name</th>
                                                        <th>Patient ID</th>
                                                        <th>Blood Group</th>
                                                        <th>Status</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {donors.map(donor => (
                                                        <tr key={donor.patientId}>
                                                            <td>
                                                                <span style={{ fontWeight: 600, color: 'white' }}>
                                                                    {donor.name || 'Not specified'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-purple)' }}>
                                                                    {donor.patientId}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: 700, color: 'var(--accent-red)' }}>
                                                                    {donor.bloodGroup}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {donor.bloodDonationStatus === 'available' ? (
                                                                    <span className="badge badge-success">✓ Available</span>
                                                                ) : donor.bloodDonationStatus === 'temporarily_unavailable' ? (
                                                                    <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>⏳ Temp. Unavailable</span>
                                                                ) : (
                                                                    <span className="badge badge-error">✗ Unavailable</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => {
                                                                        setSelectedDonor(donor);
                                                                        setShowDonorInfo(true);
                                                                    }}
                                                                    style={{ fontSize: '0.75rem' }}
                                                                >
                                                                    ℹ️ Info
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="alert alert-info" style={{ marginTop: '2rem' }}>
                                <span>ℹ️</span>
                                <span>Only patients who have explicitly opted in for blood donation are shown. This system does not make medical eligibility determinations.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Donor Info Modal */}
            {showDonorInfo && selectedDonor && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setShowDonorInfo(false)}>
                    <div style={{
                        background: 'var(--gray-900)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🩸 Donor Information
                            </h3>
                            <button
                                onClick={() => setShowDonorInfo(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--gray-400)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Name */}
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    👤 Full Name
                                </div>
                                <div style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem' }}>
                                    {selectedDonor.name || 'Not specified'}
                                </div>
                            </div>

                            {/* Location */}
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    📋 Location
                                </div>
                                <div style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem' }}>
                                    {selectedDonor.location || 'Not specified'}
                                </div>
                            </div>

                            {/* Blood Group */}
                            <div style={{
                                background: 'rgba(220, 38, 38, 0.1)',
                                border: '1px solid rgba(220, 38, 38, 0.3)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    🩸 Blood Group
                                </div>
                                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.5rem' }}>
                                    {selectedDonor.bloodGroup}
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    📞 Contact Number
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem' }}>
                                        {selectedDonor.contactNumber || 'Not specified'}
                                    </span>
                                    {selectedDonor.contactNumber && (
                                        <a
                                            href={`tel:${selectedDonor.contactNumber}`}
                                            className="btn btn-success btn-sm"
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            📞 Call
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Patient ID */}
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    🆔 Patient ID
                                </div>
                                <div style={{ color: 'var(--accent-purple)', fontWeight: 600, fontFamily: 'monospace', fontSize: '1.125rem' }}>
                                    {selectedDonor.patientId}
                                </div>
                            </div>

                            {/* Donation Status */}
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Availability Status
                                </div>
                                {selectedDonor.bloodDonationStatus === 'available' ? (
                                    <span className="badge badge-success">✓ Available to Donate</span>
                                ) : selectedDonor.bloodDonationStatus === 'temporarily_unavailable' ? (
                                    <div>
                                        <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>⏳ Temporarily Unavailable</span>
                                        {selectedDonor.bloodDonationReason === 'donated_recently' && (
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-400)' }}>
                                                Reason: Donated blood recently
                                            </p>
                                        )}
                                        {selectedDonor.bloodDonationReason === 'diseased' && selectedDonor.bloodDonationDisease && (
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-400)' }}>
                                                Reason: {selectedDonor.bloodDonationDisease}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <span className="badge badge-error">✗ Unavailable</span>
                                )}
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary btn-block"
                            onClick={() => setShowDonorInfo(false)}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default HospitalDashboard;

const ActiveRequestCard = ({ request, baseScores }) => {
    const [elapsed, setElapsed] = useState(0);
    const [liveScore, setLiveScore] = useState(request.urgencyScore);
    const TIME_LIMIT_MINS = request.timeLimit || 30;
    const TIME_LIMIT_SECS = TIME_LIMIT_MINS * 60;

    React.useEffect(() => {
        const startTime = new Date(request.createdAt).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const diffInSeconds = Math.floor((now - startTime) / 1000);
            setElapsed(diffInSeconds);

            // INVERSE LOGIC: As time passes (diff increases), Score increases.

            const base = baseScores[request.requestType] || 60;
            const progress = Math.min(diffInSeconds / TIME_LIMIT_SECS, 1); // 0 to 1
            const remainingHeadroom = 100 - base;

            // Calculate increase based on proportion of time used
            const timeBonus = Math.floor(progress * remainingHeadroom);
            const calculatedScore = Math.min(base + timeBonus, 100);

            setLiveScore(calculatedScore);

            // REPEATED ALERT LOGIC: Trigger if Score > 93
            if (calculatedScore > 93) {
                // Throttle: Alert every 20 seconds
                if (diffInSeconds % 20 === 0) {
                    triggerCriticalAlert({
                        hospitalName: request.hospitalName,
                        bloodGroup: request.bloodGroup,
                        urgencyScore: calculatedScore,
                        requestType: request.requestType
                    });
                }
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [request, baseScores, TIME_LIMIT_SECS]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-card" style={{
            background: liveScore > 93 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            border: liveScore > 93 ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: liveScore > 93 ? 'pulse-border 2s infinite' : 'none'
        }}>
            {/* Context Info */}
            <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span className="badge badge-error">BLOOD {request.bloodGroup}</span>
                    <span style={{ color: 'var(--gray-300)', fontSize: '0.875rem' }}>{request.requestType}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    Time Limit: {TIME_LIMIT_MINS} mins | {liveScore > 93 ? '🔥 CRITICAL' : 'â³ ACTIVE'}
                </div>
            </div>

            {/* Live Score Display */}
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>
                    {liveScore}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {liveScore > 93 ? 'âš  ALERTING DONORS' : 'Live Urgency Score'}
                </div>
            </div>

            {/* Countdown Timer */}
            <div style={{
                background: liveScore > 93 ? '#ef4444' : 'rgba(0,0,0,0.3)',
                color: liveScore > 93 ? 'white' : 'inherit',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                minWidth: '100px'
            }}>
                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 600 }}>
                    {formatTime(Math.max(TIME_LIMIT_SECS - elapsed, 0))}
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    TIME REMAINING
                </div>
            </div>
        </div>
    );
};

