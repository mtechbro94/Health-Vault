// API helper for making requests to the backend
// Use relative URL - works on any deployment since server serves both frontend and API
const API_BASE = '/api';

// Generic fetch wrapper with error handling
const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true', // Required for localtunnel
            ...options.headers
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Request failed: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
    }

    return response.json();
};

// ============ USER FUNCTIONS ============

export const createUser = async (email, password, role, hospitalName = '', patientName = '', patientLocation = '') => {
    return apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, role, hospitalName, patientName, patientLocation })
    });
};

export const loginUser = async (email, password) => {
    return apiFetch('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
};

export const getUser = async (userId) => {
    return apiFetch(`/users/${userId}`);
};

// ============ PATIENT FUNCTIONS ============

export const getPatientByUserId = async (userId) => {
    try {
        return await apiFetch(`/patients/user/${userId}`);
    } catch (error) {
        return null;
    }
};

export const getPatientByPatientId = async (patientId) => {
    try {
        return await apiFetch(`/patients/${patientId}`);
    } catch (error) {
        return null;
    }
};

export const updatePatientProfile = async (patientId, updates) => {
    return apiFetch(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
};

export const searchPatients = async (bloodGroup = null, donorsOnly = false) => {
    const params = new URLSearchParams();
    if (bloodGroup) params.append('bloodGroup', bloodGroup);
    if (donorsOnly) params.append('donorsOnly', 'true');
    return apiFetch(`/patients?${params.toString()}`);
};

// ============ HOSPITAL FUNCTIONS ============

export const getHospitalByUserId = async (userId) => {
    try {
        return await apiFetch(`/hospitals/user/${userId}`);
    } catch (error) {
        return null;
    }
};

// ============ MEDICAL RECORDS FUNCTIONS ============

export const getPatientRecords = async (patientId) => {
    try {
        return await apiFetch(`/records/${patientId}`);
    } catch (error) {
        return [];
    }
};

export const addMedicalRecord = async (record) => {
    return apiFetch('/records', {
        method: 'POST',
        body: JSON.stringify(record)
    });
};

export const deleteMedicalRecord = async (recordId) => {
    return apiFetch(`/records/${recordId}`, {
        method: 'DELETE'
    });
};

// ============ ACCESS LOGS FUNCTIONS ============

export const getPatientAccessLogs = async (patientId) => {
    try {
        return await apiFetch(`/access-logs/${patientId}`);
    } catch (error) {
        return [];
    }
};

export const logAccess = async (patientId, accessType, hospitalId = null, hospitalName = null) => {
    return apiFetch('/access-logs', {
        method: 'POST',
        body: JSON.stringify({ patientId, accessType, hospitalId, hospitalName })
    });
};

// ============ BLOOD DONATION HELPERS ============

export const checkBloodDonationStatus = (patient) => {
    if (!patient.bloodDonation) return patient;

    if (patient.bloodDonationStatus === 'temporarily_unavailable' &&
        patient.bloodDonationReason === 'donated_recently' &&
        patient.bloodDonationStatusDate) {

        const statusDate = new Date(patient.bloodDonationStatusDate);
        const now = new Date();
        const threeMonthsLater = new Date(statusDate);
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        if (now >= threeMonthsLater) {
            return {
                ...patient,
                bloodDonationStatus: 'available',
                bloodDonationReason: '',
                bloodDonationStatusDate: null
            };
        }
    }

    return patient;
};

export const broadcastBloodRequest = async (requestData) => {
    return apiFetch('/blood-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
    });
};

export const triggerCriticalAlert = async (alertData) => {
    return apiFetch('/trigger-alert', {
        method: 'POST',
        body: JSON.stringify(alertData)
    });
};
