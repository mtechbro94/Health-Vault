import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { getPatientByUserId, getPatientRecords, getPatientAccessLogs } from '../utils/api';
import Header from '../components/Header';
import EmergencyProfile from '../components/EmergencyProfile';
import MedicalRecords from '../components/MedicalRecords';
import AccessHistory from '../components/AccessHistory';

const PatientDashboard = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [patient, setPatient] = useState(null);
    const [records, setRecords] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                const patientData = await getPatientByUserId(user.id);
                setPatient(patientData);

                if (patientData) {
                    const [recordsData, logsData] = await Promise.all([
                        getPatientRecords(patientData.patientId),
                        getPatientAccessLogs(patientData.patientId)
                    ]);
                    setRecords(recordsData);
                    setAccessLogs(logsData);
                }
            }
        };
        loadData();
    }, [user]);

    const refreshData = async () => {
        if (user) {
            const patientData = await getPatientByUserId(user.id);
            setPatient(patientData);
            if (patientData) {
                const [recordsData, logsData] = await Promise.all([
                    getPatientRecords(patientData.patientId),
                    getPatientAccessLogs(patientData.patientId)
                ]);
                setRecords(recordsData);
                setAccessLogs(logsData);
            }
        }
        refreshProfile();
    };

    if (!patient) {
        return (
            <>
                <Header />
                <div className="page">
                    <div className="container">
                        <div className="glass-card text-center">
                            <p>Loading patient data...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Emergency URL automatically uses the current origin (hostname/IP + port)
    // This means if you access the app via network IP, QR code will use that IP
    const emergencyUrl = `${window.location.origin}/emergency/${patient.patientId}`;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    return (
        <>
            <Header />
            <div className="page">
                <div className="container">
                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">👋 Welcome to Your Health Vault</h1>
                        <p className="page-subtitle">Manage your health records and emergency information</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                        {/* Patient ID Card */}
                        <div className="glass-card">
                            <div className="patient-id-display">
                                <div className="patient-id-label">Your Patient ID</div>
                                <div className="patient-id-value">{patient.patientId}</div>
                            </div>
                            <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                                Share this ID with healthcare providers for secure access
                            </p>
                        </div>

                        {/* QR Code Card */}
                        <div className="glass-card text-center">
                            <h3 style={{ marginBottom: '1rem' }}>🔗 Emergency QR Code</h3>
                            <div className="qr-container">
                                <QRCodeSVG
                                    value={emergencyUrl}
                                    size={160}
                                    level="H"
                                    includeMargin={true}
                                    bgColor="#ffffff"
                                    fgColor="#1f2937"
                                />
                                <div className="qr-label">Scan for Emergency Info</div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <a
                                    href={emergencyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    🔗 Test Emergency Page
                                </a>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(emergencyUrl);
                                        alert('Emergency URL copied to clipboard!');
                                    }}
                                >
                                    📋 Copy URL
                                </button>
                            </div>

                            {/* Auto Network Detection Info */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.5rem',
                                background: isLocalhost ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                border: isLocalhost ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
                            }}>
                                {isLocalhost ? (
                                    <p style={{ color: '#eab308', fontSize: '0.7rem', margin: 0 }}>
                                        ⚠️ Access app via your network IP for mobile scanning:<br />
                                        <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.25rem', borderRadius: '3px' }}>
                                            http://YOUR_IP:{window.location.port}
                                        </code>
                                    </p>
                                ) : (
                                    <p style={{ color: '#22c55e', fontSize: '0.7rem', margin: 0 }}>
                                        ✅ QR code will work on mobile! Using: {window.location.hostname}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>📊 Quick Stats</h3>
                            <div className="stat-card" style={{ marginBottom: '1rem' }}>
                                <div className="stat-icon primary">📁</div>
                                <div className="stat-content">
                                    <div className="stat-label">Medical Records</div>
                                    <div className="stat-value">{records.length}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon purple">👁️</div>
                                <div className="stat-content">
                                    <div className="stat-label">Access Events</div>
                                    <div className="stat-value">{accessLogs.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Consent Status Banner */}
                    <div className={`alert ${patient.hospitalAccessConsent ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: '2rem' }}>
                        {patient.hospitalAccessConsent ? (
                            <>
                                <span>✅</span>
                                <span>Hospital Access is <strong>Enabled</strong> - Healthcare providers can view your emergency profile and add records.</span>
                            </>
                        ) : (
                            <>
                                <span>🔒</span>
                                <span>Hospital Access is <strong>Disabled</strong> - Healthcare providers cannot view your profile. Enable in Emergency Profile tab.</span>
                            </>
                        )}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            🏥 Emergency Profile
                        </button>
                        <button
                            className={`tab ${activeTab === 'records' ? 'active' : ''}`}
                            onClick={() => setActiveTab('records')}
                        >
                            📁 Medical Records
                        </button>
                        <button
                            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            📋 Access History
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="glass-card fade-in">
                        {activeTab === 'profile' && (
                            <EmergencyProfile patient={patient} onUpdate={refreshData} />
                        )}
                        {activeTab === 'records' && (
                            <MedicalRecords
                                patient={patient}
                                records={records}
                                onUpdate={refreshData}
                                canUpload={true}
                            />
                        )}
                        {activeTab === 'history' && (
                            <AccessHistory logs={accessLogs} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PatientDashboard;
