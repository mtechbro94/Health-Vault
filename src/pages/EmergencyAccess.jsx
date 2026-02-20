import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPatientByPatientId, logAccess } from '../utils/api';

const EmergencyAccess = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                try {
                    const foundPatient = await getPatientByPatientId(patientId);

                    if (foundPatient) {
                        setPatient(foundPatient);
                        // Log the emergency access
                        await logAccess(foundPatient.patientId, 'emergency_qr', null, 'Emergency QR Scan');
                    } else {
                        setError('Patient not found');
                    }
                } catch (err) {
                    setError('Unable to load patient data');
                }
            } else {
                setError('Invalid QR code');
            }
            setLoading(false);
        };
        loadPatient();
    }, [patientId]);

    const handleCallEmergency = () => {
        if (patient?.emergencyContact) {
            window.location.href = `tel:${patient.emergencyContact}`;
        }
    };

    if (loading) {
        return (
            <div className="emergency-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card text-center">
                    <p style={{ color: 'white' }}>Loading emergency information...</p>
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="emergency-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    padding: '2rem',
                    borderRadius: 'var(--radius-xl)',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Invalid QR Code</h2>
                    <p style={{ color: 'var(--gray-600)' }}>
                        {error || 'This emergency QR code is not valid or the patient record no longer exists.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="emergency-page">
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Emergency Header */}
                <div className="emergency-header">
                    <div className="emergency-badge">
                        <span className="emergency-icon">🚨</span>
                        Emergency Access Mode
                    </div>
                    <h1 className="emergency-title">Patient Emergency Information</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
                        Patient ID: <strong>{patient.patientId}</strong>
                    </p>
                </div>

                {/* Emergency Info Cards */}
                <div className="emergency-info-grid">
                    {/* Blood Group - Priority */}
                    <div className="emergency-info-card" style={{ background: '#fef2f2', border: '2px solid #dc2626' }}>
                        <div className="emergency-info-label" style={{ color: '#dc2626' }}>Blood Group</div>
                        <div className="emergency-info-value" style={{ color: '#dc2626', fontSize: '2rem' }}>
                            {patient.bloodGroup || 'Unknown'}
                        </div>
                    </div>

                    {/* Blood Donation Status */}
                    <div className="emergency-info-card">
                        <div className="emergency-info-label">Blood Donation</div>
                        <div className="emergency-info-value" style={{
                            color: patient.bloodDonation
                                ? (patient.bloodDonationStatus === 'available' ? '#059669'
                                    : patient.bloodDonationStatus === 'temporarily_unavailable' ? '#f59e0b'
                                        : '#ef4444')
                                : '#d97706',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '0.25rem'
                        }}>
                            {!patient.bloodDonation ? (
                                <span>✗ Not a Donor</span>
                            ) : patient.bloodDonationStatus === 'available' ? (
                                <span>✓ Available</span>
                            ) : patient.bloodDonationStatus === 'temporarily_unavailable' ? (
                                <>
                                    <span>⏸ Temporarily Unavailable</span>
                                    {patient.bloodDonationReason === 'donated_recently' && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                            (Donated Recently)
                                        </span>
                                    )}
                                    {patient.bloodDonationReason === 'diseased' && patient.bloodDonationDisease && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                            ({patient.bloodDonationDisease})
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span>✗ Unavailable</span>
                            )}
                        </div>
                    </div>

                    {/* Allergies */}
                    <div className="emergency-info-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="emergency-info-label">⚠️ Allergies</div>
                        <div className="emergency-info-value" style={{ fontSize: '1rem', fontWeight: 500 }}>
                            {patient.allergies || 'None reported'}
                        </div>
                    </div>

                    {/* Chronic Conditions */}
                    <div className="emergency-info-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="emergency-info-label">Chronic Conditions</div>
                        <div className="emergency-info-value" style={{ fontSize: '1rem', fontWeight: 500 }}>
                            {patient.conditions || 'None reported'}
                        </div>
                    </div>

                    {/* Current Medications */}
                    <div className="emergency-info-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="emergency-info-label">💊 Current Medications</div>
                        <div className="emergency-info-value" style={{ fontSize: '1rem', fontWeight: 500 }}>
                            {patient.medications || 'None reported'}
                        </div>
                    </div>

                    {/* Patient's Contact Number */}
                    <div className="emergency-info-card" style={{ background: '#eff6ff', border: '2px solid #3b82f6' }}>
                        <div className="emergency-info-label" style={{ color: '#3b82f6' }}>📱 Patient Contact</div>
                        <div className="emergency-info-value" style={{ color: '#3b82f6' }}>
                            {patient.contactNumber || 'Not specified'}
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="emergency-info-card" style={{ background: '#f0fdf4', border: '2px solid #059669' }}>
                        <div className="emergency-info-label" style={{ color: '#059669' }}>📞 Emergency Contact</div>
                        <div className="emergency-info-value" style={{ color: '#059669' }}>
                            {patient.emergencyContact || 'Not specified'}
                        </div>
                    </div>
                </div>

                {/* Call Emergency Contact Button */}
                {patient.emergencyContact && (
                    <button
                        className="emergency-call-btn"
                        onClick={handleCallEmergency}
                    >
                        <span style={{ fontSize: '1.5rem' }}>📞</span>
                        Call Emergency Contact
                    </button>
                )}

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    padding: '1rem',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.875rem'
                }}>
                    <p>🔒 This is a read-only emergency view</p>
                    <p style={{ marginTop: '0.5rem' }}>Medical documents are not accessible in emergency mode</p>
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>🏥</span>
                        <span>HealthVault Emergency Access</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyAccess;
