import React, { useState } from 'react';
import { updatePatientProfile } from '../utils/api';
import { BLOOD_GROUPS } from '../utils/helpers';

const EmergencyProfile = ({ patient, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: patient.name || '',
        location: patient.location || '',
        bloodGroup: patient.bloodGroup || '',
        allergies: patient.allergies || '',
        conditions: patient.conditions || '',
        medications: patient.medications || '',
        contactNumber: patient.contactNumber || '',
        emergencyContact: patient.emergencyContact || '',
        bloodDonation: patient.bloodDonation || false,
        bloodDonationStatus: patient.bloodDonationStatus || 'available',
        bloodDonationReason: patient.bloodDonationReason || '',
        bloodDonationDisease: patient.bloodDonationDisease || '',
        bloodDonationStatusDate: patient.bloodDonationStatusDate || null,
        hospitalAccessConsent: patient.hospitalAccessConsent !== false
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [gettingLocation, setGettingLocation] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
            return;
        }

        setGettingLocation(true);
        setMessage({ type: '', text: '' });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
                    );
                    const data = await response.json();

                    // Extract city/village and state from response
                    const address = data.address || {};
                    const city = address.city || address.town || address.village || address.suburb || address.county || '';
                    const state = address.state || '';
                    const locationText = city && state ? `${city}, ${state}` : city || state || 'Location detected';

                    setFormData(prev => ({
                        ...prev,
                        location: locationText
                    }));
                    setMessage({ type: 'success', text: `Location detected: ${locationText}` });
                } catch (error) {
                    // Fallback: just indicate location was detected
                    setFormData(prev => ({
                        ...prev,
                        location: 'Location detected (please verify)'
                    }));
                    setMessage({ type: 'success', text: 'Location detected. Please verify and edit if needed.' });
                }
                setGettingLocation(false);
            },
            (error) => {
                setGettingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setMessage({ type: 'error', text: 'Location permission denied. Please enable location access.' });
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setMessage({ type: 'error', text: 'Location information unavailable.' });
                        break;
                    case error.TIMEOUT:
                        setMessage({ type: 'error', text: 'Location request timed out.' });
                        break;
                    default:
                        setMessage({ type: 'error', text: 'An unknown error occurred.' });
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // Reset dependent fields when status changes
            if (name === 'bloodDonationStatus') {
                updated.bloodDonationStatusDate = new Date().toISOString();
                if (value === 'available') {
                    updated.bloodDonationReason = '';
                    updated.bloodDonationDisease = '';
                } else if (value === 'unavailable') {
                    updated.bloodDonationReason = '';
                    updated.bloodDonationDisease = '';
                }
            }

            // Reset disease when reason changes
            if (name === 'bloodDonationReason' && value !== 'diseased') {
                updated.bloodDonationDisease = '';
            }

            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await updatePatientProfile(patient.patientId, formData);
            setMessage({ type: 'success', text: 'Emergency profile updated successfully!' });
            if (onUpdate) onUpdate();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">🏥 Emergency Profile</h2>
                <span className="badge badge-primary">Only You Can Edit</span>
            </div>

            <p style={{ color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                This information will be visible in emergencies when your QR code is scanned.
            </p>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Full Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="location">Location</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                className="form-input"
                                placeholder="City, State (e.g., Hyderabad, Telangana)"
                                value={formData.location}
                                onChange={handleChange}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={detectLocation}
                                disabled={gettingLocation}
                                style={{ whiteSpace: 'nowrap', padding: '0 1rem' }}
                                title="Detect your current location"
                            >
                                {gettingLocation ? '...' : '📍'}
                            </button>
                        </div>
                    </div>

                    {/* Blood Group */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="bloodGroup">Blood Group</label>
                        <select
                            id="bloodGroup"
                            name="bloodGroup"
                            className="form-select"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                        >
                            <option value="">Select Blood Group</option>
                            {BLOOD_GROUPS.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>

                    {/* Patient's Own Contact Number */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="contactNumber">Your Contact Number</label>
                        <input
                            type="tel"
                            id="contactNumber"
                            name="contactNumber"
                            className="form-input"
                            placeholder="Enter your phone number"
                            value={formData.contactNumber}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Emergency Contact */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="emergencyContact">Emergency Contact Number</label>
                        <input
                            type="tel"
                            id="emergencyContact"
                            name="emergencyContact"
                            className="form-input"
                            placeholder="Enter emergency contact number"
                            value={formData.emergencyContact}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Allergies */}
                <div className="form-group">
                    <label className="form-label" htmlFor="allergies">Allergies</label>
                    <textarea
                        id="allergies"
                        name="allergies"
                        className="form-textarea"
                        placeholder="List any known allergies (e.g., Penicillin, Peanuts, Latex)"
                        value={formData.allergies}
                        onChange={handleChange}
                    />
                </div>

                {/* Chronic Conditions */}
                <div className="form-group">
                    <label className="form-label" htmlFor="conditions">Chronic Conditions</label>
                    <textarea
                        id="conditions"
                        name="conditions"
                        className="form-textarea"
                        placeholder="List any chronic conditions (e.g., Diabetes, Hypertension, Asthma)"
                        value={formData.conditions}
                        onChange={handleChange}
                    />
                </div>

                {/* Current Medications */}
                <div className="form-group">
                    <label className="form-label" htmlFor="medications">Current Medications</label>
                    <textarea
                        id="medications"
                        name="medications"
                        className="form-textarea"
                        placeholder="List current medications with dosage (e.g., Metformin 500mg twice daily)"
                        value={formData.medications}
                        onChange={handleChange}
                    />
                </div>

                {/* Toggle Options */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                }}>
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--gray-200)' }}>Consent & Preferences</h4>

                    {/* Hospital Access Consent */}
                    <div className="toggle-container" style={{ marginBottom: '1.5rem' }}>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                name="hospitalAccessConsent"
                                checked={formData.hospitalAccessConsent}
                                onChange={handleChange}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <div>
                            <span className="toggle-label" style={{ fontWeight: 600, color: 'white' }}>
                                Allow Hospital Access
                            </span>
                            <p style={{ color: 'var(--gray-400)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                When enabled, hospitals can view your emergency profile and add medical records using your Patient ID.
                            </p>
                        </div>
                    </div>

                    {/* Blood Donation Willingness */}
                    <div className="toggle-container" style={{ marginBottom: '1.5rem' }}>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                name="bloodDonation"
                                checked={formData.bloodDonation}
                                onChange={handleChange}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <div>
                            <span className="toggle-label" style={{ fontWeight: 600, color: 'white' }}>
                                Willing to Donate Blood
                            </span>
                            <p style={{ color: 'var(--gray-400)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                Let hospitals know you're willing to be contacted for blood donation requests.
                            </p>
                        </div>
                    </div>

                    {/* Blood Donation Details - Only show if willing to donate */}
                    {formData.bloodDonation && (
                        <div style={{
                            background: 'rgba(220, 38, 38, 0.1)',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            marginTop: '1rem'
                        }}>
                            <h5 style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🩸 Blood Donation Details
                            </h5>

                            {/* Blood Group Reminder */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Your Blood Group</div>
                                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.25rem' }}>
                                    {formData.bloodGroup || 'Not Selected - Please select above'}
                                </div>
                            </div>

                            {/* Availability Status */}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label" style={{ color: 'var(--gray-300)' }}>Availability Status</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="bloodDonationStatus"
                                            value="available"
                                            checked={formData.bloodDonationStatus === 'available'}
                                            onChange={handleChange}
                                            style={{ accentColor: '#22c55e' }}
                                        />
                                        <span style={{ color: '#22c55e', fontWeight: 500 }}>✓ Available</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="bloodDonationStatus"
                                            value="temporarily_unavailable"
                                            checked={formData.bloodDonationStatus === 'temporarily_unavailable'}
                                            onChange={handleChange}
                                            style={{ accentColor: '#f59e0b' }}
                                        />
                                        <span style={{ color: '#f59e0b', fontWeight: 500 }}>⏸ Temporarily Unavailable</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="bloodDonationStatus"
                                            value="unavailable"
                                            checked={formData.bloodDonationStatus === 'unavailable'}
                                            onChange={handleChange}
                                            style={{ accentColor: '#ef4444' }}
                                        />
                                        <span style={{ color: '#ef4444', fontWeight: 500 }}>✗ Unavailable</span>
                                    </label>
                                </div>
                            </div>

                            {/* Reason Selection - Only show for temporarily_unavailable */}
                            {formData.bloodDonationStatus === 'temporarily_unavailable' && (
                                <div style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    marginTop: '1rem'
                                }}>
                                    <div className="form-group" style={{ marginBottom: formData.bloodDonationReason === 'diseased' ? '1rem' : 0 }}>
                                        <label className="form-label" style={{ color: '#f59e0b' }}>Reason</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="bloodDonationReason"
                                                    value="donated_recently"
                                                    checked={formData.bloodDonationReason === 'donated_recently'}
                                                    onChange={handleChange}
                                                    style={{ accentColor: '#f59e0b', marginTop: '0.25rem' }}
                                                />
                                                <div>
                                                    <span style={{ color: 'white', fontWeight: 500 }}>Blood Donated Recently</span>
                                                    <p style={{ color: 'var(--gray-400)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                        Your status will automatically change to Available after 3 months.
                                                    </p>
                                                </div>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="bloodDonationReason"
                                                    value="diseased"
                                                    checked={formData.bloodDonationReason === 'diseased'}
                                                    onChange={handleChange}
                                                    style={{ accentColor: '#f59e0b', marginTop: '0.25rem' }}
                                                />
                                                <div>
                                                    <span style={{ color: 'white', fontWeight: 500 }}>Diseased / Medical Condition</span>
                                                    <p style={{ color: 'var(--gray-400)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                        Temporarily unable due to illness or medical condition.
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Disease Input - Only show if diseased is selected */}
                                    {formData.bloodDonationReason === 'diseased' && (
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="bloodDonationDisease" style={{ color: '#f59e0b' }}>
                                                Specify Disease / Condition
                                            </label>
                                            <input
                                                type="text"
                                                id="bloodDonationDisease"
                                                name="bloodDonationDisease"
                                                className="form-input"
                                                placeholder="e.g., Cold, Flu, Minor surgery recovery..."
                                                value={formData.bloodDonationDisease}
                                                onChange={handleChange}
                                                style={{ background: 'rgba(0,0,0,0.3)' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-success btn-lg"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : '💾 Save Emergency Profile'}
                </button>
            </form>
        </div>
    );
};

export default EmergencyProfile;
