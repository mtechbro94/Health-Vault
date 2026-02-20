// Storage utility functions for localStorage operations

const STORAGE_KEYS = {
    USERS: 'healthvault_users',
    PATIENTS: 'healthvault_patients',
    HOSPITALS: 'healthvault_hospitals',
    MEDICAL_RECORDS: 'healthvault_records',
    ACCESS_LOGS: 'healthvault_access_logs',
    CURRENT_USER: 'healthvault_current_user'
};

// Generate unique Patient ID (alphanumeric, human-readable)
export const generatePatientId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like O, 0, 1, I, L
    const segments = [
        Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''),
        Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''),
        Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    ];
    return segments.join('-');
};

// Generate unique ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get all users
export const getUsers = () => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
};

// Save users
export const saveUsers = (users) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

// Find user by email
export const findUserByEmail = (email) => {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Create new user
export const createUser = (userData) => {
    const users = getUsers();

    // Check if email already exists
    if (findUserByEmail(userData.email)) {
        throw new Error('Email already registered');
    }

    const newUser = {
        id: generateId(),
        email: userData.email,
        password: userData.password, // In production, this should be hashed
        role: userData.role,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Create role-specific profile
    if (userData.role === 'patient') {
        createPatientProfile(newUser.id, userData.patientName || '', userData.patientLocation || '');
    } else if (userData.role === 'hospital') {
        createHospitalProfile(newUser.id, userData.hospitalName || 'Unnamed Hospital');
    }

    return newUser;
};

// Authenticate user
export const authenticateUser = (email, password) => {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
    }
    return user;
};

// Get all patients
export const getPatients = () => {
    const patients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return patients ? JSON.parse(patients) : [];
};

// Save patients
export const savePatients = (patients) => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
};

// Create patient profile
export const createPatientProfile = (userId, patientName = '', patientLocation = '') => {
    const patients = getPatients();

    // Generate unique patient ID
    let patientId;
    do {
        patientId = generatePatientId();
    } while (patients.some(p => p.patientId === patientId));

    const newPatient = {
        id: generateId(),
        userId,
        patientId,
        name: patientName,
        location: patientLocation,
        gpsLocation: null, // { lat: number, lng: number }
        bloodGroup: '',
        allergies: '',
        conditions: '',
        medications: '',
        contactNumber: '',
        emergencyContact: '',
        bloodDonation: false,
        bloodDonationStatus: 'available', // 'available', 'temporarily_unavailable', 'unavailable'
        bloodDonationReason: '', // 'donated_recently', 'diseased'
        bloodDonationDisease: '', // disease name if reason is 'diseased'
        bloodDonationStatusDate: null, // date when status was set (for 3 month calculation)
        hospitalAccessConsent: true, // Default to allowed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    patients.push(newPatient);
    savePatients(patients);
    return newPatient;
};

// Get patient by user ID
export const getPatientByUserId = (userId) => {
    const patients = getPatients();
    return patients.find(p => p.userId === userId);
};

// Get patient by patient ID (the human-readable ID)
export const getPatientByPatientId = (patientId) => {
    const patients = getPatients();
    return patients.find(p => p.patientId.toUpperCase() === patientId.toUpperCase());
};

// Update patient profile
export const updatePatientProfile = (patientId, updates) => {
    const patients = getPatients();
    const index = patients.findIndex(p => p.patientId === patientId);

    if (index === -1) {
        throw new Error('Patient not found');
    }

    // Don't allow changing patientId
    delete updates.patientId;
    delete updates.userId;

    patients[index] = {
        ...patients[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    savePatients(patients);
    return patients[index];
};

// Get all hospitals
export const getHospitals = () => {
    const hospitals = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    return hospitals ? JSON.parse(hospitals) : [];
};

// Save hospitals
export const saveHospitals = (hospitals) => {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
};

// Create hospital profile
export const createHospitalProfile = (userId, name) => {
    const hospitals = getHospitals();

    const newHospital = {
        id: generateId(),
        userId,
        name,
        address: '',
        createdAt: new Date().toISOString()
    };

    hospitals.push(newHospital);
    saveHospitals(hospitals);
    return newHospital;
};

// Get hospital by user ID
export const getHospitalByUserId = (userId) => {
    const hospitals = getHospitals();
    return hospitals.find(h => h.userId === userId);
};

// Get all medical records
export const getMedicalRecords = () => {
    const records = localStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS);
    return records ? JSON.parse(records) : [];
};

// Save medical records
export const saveMedicalRecords = (records) => {
    localStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(records));
};

// Get records for a patient
export const getPatientRecords = (patientId) => {
    const records = getMedicalRecords();
    return records.filter(r => r.patientId === patientId);
};

// Add medical record
export const addMedicalRecord = (patientId, record) => {
    const records = getMedicalRecords();

    const newRecord = {
        id: generateId(),
        patientId,
        fileName: record.fileName,
        fileData: record.fileData, // Base64 encoded file
        fileType: record.fileType,
        uploadedBy: record.uploadedBy,
        uploadedByType: record.uploadedByType, // 'patient' or 'hospital'
        uploadedByName: record.uploadedByName,
        uploadDate: new Date().toISOString()
    };

    records.push(newRecord);
    saveMedicalRecords(records);
    return newRecord;
};

// Get all access logs
export const getAccessLogs = () => {
    const logs = localStorage.getItem(STORAGE_KEYS.ACCESS_LOGS);
    return logs ? JSON.parse(logs) : [];
};

// Save access logs
export const saveAccessLogs = (logs) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_LOGS, JSON.stringify(logs));
};

// Get access logs for a patient
export const getPatientAccessLogs = (patientId) => {
    const logs = getAccessLogs();
    return logs.filter(l => l.patientId === patientId).sort((a, b) =>
        new Date(b.accessDate) - new Date(a.accessDate)
    );
};

// Log access event
export const logAccess = (patientId, accessType, accessedBy = null, accessedByName = null) => {
    const logs = getAccessLogs();

    const newLog = {
        id: generateId(),
        patientId,
        accessType, // 'hospital' or 'emergency_qr'
        accessedBy,
        accessedByName,
        accessDate: new Date().toISOString()
    };

    logs.push(newLog);
    saveAccessLogs(logs);
    return newLog;
};

// Check if blood donation status should auto-recover (3 months after donated_recently)
export const checkBloodDonationStatus = (patient) => {
    if (patient.bloodDonationStatus === 'temporarily_unavailable' &&
        patient.bloodDonationReason === 'donated_recently' &&
        patient.bloodDonationStatusDate) {
        const statusDate = new Date(patient.bloodDonationStatusDate);
        const threeMonthsLater = new Date(statusDate);
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        if (new Date() >= threeMonthsLater) {
            return 'available';
        }
    }
    return patient.bloodDonationStatus || 'available';
};

// Get patients who are willing blood donors with specific blood group
export const getBloodDonors = (bloodGroup) => {
    const patients = getPatients();
    return patients.filter(p => {
        // Check if blood donation is enabled
        if (!p.bloodDonation) return false;

        // Check blood group match
        if (!p.bloodGroup || p.bloodGroup.toUpperCase() !== bloodGroup.toUpperCase()) return false;

        // Check availability status (with auto-recovery for donated_recently)
        const currentStatus = checkBloodDonationStatus(p);
        return currentStatus === 'available';
    });
};

// Current user session management
export const setCurrentUser = (user) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUser = () => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
};

export const clearCurrentUser = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};
