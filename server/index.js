const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
require('dotenv').config(); // Load from root or use Render's env vars
const twilio = require('twilio');
const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Hospital = require('./models/Hospital');
const Record = require('./models/Record');
const AccessLog = require('./models/AccessLog');
const BloodRequest = require('./models/BloodRequest');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// MongoDB Connection
const connectDB = async () => {
    let mongoUri = process.env.MONGODB_URI;

    // Check if we should use in-memory DB (default URI or no URI)
    if (!mongoUri || mongoUri.includes('localhost:27017')) {
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            console.log('🚀 Using In-Memory MongoDB:', mongoUri);
        } catch (err) {
            console.error('❌ Failed to start In-Memory MongoDB:', err);
        }
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
    }
};

connectDB();


// Helper to generate patient ID
const generatePatientId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

// ============ USER ENDPOINTS ============

// Create user (signup)
app.post('/api/users', async (req, res) => {
    try {
        const { email, password, role, hospitalName, patientName, patientLocation } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const userId = uuidv4();
        const newUser = await User.create({
            id: userId,
            email,
            password, // Note: In production, hash this!
            role
        });

        // Create profile based on role
        if (role === 'patient') {
            const patientId = generatePatientId();
            await Patient.create({
                id: uuidv4(),
                patientId,
                userId,
                name: patientName || '',
                location: patientLocation || ''
            });
        } else if (role === 'hospital') {
            await Hospital.create({
                id: uuidv4(),
                userId,
                name: hospitalName || 'Hospital'
            });
        }

        res.json({ user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PATIENT ENDPOINTS ============

// Get patient by user ID
app.get('/api/patients/user/:userId', async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.params.userId });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient by patient ID (for emergency access)
app.get('/api/patients/:patientId', async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.patientId });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update patient profile
app.put('/api/patients/:patientId', async (req, res) => {
    try {
        const updatedPatient = await Patient.findOneAndUpdate(
            { patientId: req.params.patientId },
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(updatedPatient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search patients (with optional blood group filter)
app.get('/api/patients', async (req, res) => {
    try {
        const { bloodGroup, donorsOnly } = req.query;
        let query = {};

        if (donorsOnly === 'true') {
            query.bloodDonation = true;
            query.hospitalAccessConsent = true;
        }

        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        const patients = await Patient.find(query);
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ HOSPITAL ENDPOINTS ============

// Get hospital by user ID
app.get('/api/hospitals/user/:userId', async (req, res) => {
    try {
        const hospital = await Hospital.findOne({ userId: req.params.userId });
        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ MEDICAL RECORDS ENDPOINTS ============

// Get records for a patient
app.get('/api/records/:patientId', async (req, res) => {
    try {
        const records = await Record.find({ patientId: req.params.patientId });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a record
app.post('/api/records', async (req, res) => {
    try {
        const newRecord = await Record.create({
            id: uuidv4(),
            ...req.body
        });
        res.json(newRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a record
app.delete('/api/records/:id', async (req, res) => {
    try {
        const result = await Record.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ACCESS LOGS ENDPOINTS ============

// Get access logs for a patient
app.get('/api/access-logs/:patientId', async (req, res) => {
    try {
        const logs = await AccessLog.find({ patientId: req.params.patientId });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add access log
app.post('/api/access-logs', async (req, res) => {
    try {
        const { patientId, accessType, action, hospitalName, hospitalId } = req.body;

        const newLog = await AccessLog.create({
            id: uuidv4(),
            patientId,
            hospitalName: hospitalName || (accessType === 'emergency_qr' ? 'Emergency System' : 'Unknown Hospital'),
            action: action || accessType || 'VIEW_PROFILE',
            timestamp: new Date()
        });
        res.json(newLog);
    } catch (error) {
        console.error('Access Log Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ BLOOD REQUEST & NOTIFICATION ENDPOINTS ============

// Manual Re-Trigger
app.post('/api/trigger-alert', async (req, res) => {
    try {
        const { hospitalName, bloodGroup, urgencyScore, requestType } = req.body;

        // Find Donors
        const donors = await Patient.find({
            bloodGroup: bloodGroup,
            bloodDonation: true,
            bloodDonationStatus: 'available'
        });

        console.log(`\n🔔 [CRITICAL ALERT] Re-broadcasting for Score ${urgencyScore}/100`);

        donors.forEach(async (donor) => {
            const message = `🚨 CRITICAL ESCALATION: Patient death risk increasing. ${hospitalName} needs ${bloodGroup} NOW! Score: ${urgencyScore}.`;
            console.log(`   📲 Sending REPEAT ALERT to ${donor.name}...`);

            if (twilioClient && donor.contactNumber) {
                try {
                    await twilioClient.messages.create({
                        body: message,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: donor.contactNumber
                    });
                } catch (e) { console.error(e.message); }
            } else {
                console.log(`   (Simulated SMS): "${message}" sent to ${donor.contactNumber}`);
            }
        });

        res.json({ success: true, count: donors.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request Blood (Calculates Urgency & Notifies)
app.post('/api/blood-requests', async (req, res) => {
    try {
        const { hospitalId, hospitalName, bloodGroup, units, requestType } = req.body;

        // 1. Prepare Input for Python Engine
        const input = JSON.stringify({
            request_id: uuidv4(),
            request_type: requestType,
            blood_group: bloodGroup,
            units_required: units,
            hospital_id: hospitalId
        });

        // 2. Call Python Script
        const pythonCommand = `python "${path.join(__dirname, 'priority_engine', 'cli.py')}" "${input.replace(/"/g, '\\"')}"`;

        exec(pythonCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Python Error: ${error.message}`);
                return res.status(500).json({ error: 'Failed to calculate urgency score' });
            }

            try {
                const priorityResult = JSON.parse(stdout);

                if (priorityResult.error) {
                    return res.status(400).json({ error: priorityResult.error });
                }

                // 3. Find Matching Donors
                const donors = await Patient.find({
                    bloodGroup: bloodGroup,
                    bloodDonation: true,
                    bloodDonationStatus: 'available'
                });

                // 4. Create Request Record
                const newRequest = await BloodRequest.create({
                    id: uuidv4(),
                    hospitalId,
                    hospitalName,
                    bloodGroup,
                    units,
                    requestType,
                    urgencyScore: priorityResult.score,
                    isCritical: priorityResult.is_critical,
                    escalationReason: priorityResult.escalation_reason,
                    donorsNotified: donors.length
                });

                // 5. Send Notifications (Real SMS)
                console.log(`\n🔔 [NOTIFICATION SYSTEM] Broadcasitng Alerts for Request ${newRequest.id}`);
                console.log(`   Context: ${requestType} | Urgency: ${priorityResult.score}/100 | Critical: ${priorityResult.is_critical}`);

                donors.forEach(async (donor) => {
                    const message = `🚨 URGENT: ${hospitalName} needs ${bloodGroup} blood for ${requestType}. Urgency: ${priorityResult.score}/100. Please contact immediately!`;
                    console.log(`   📲 Processing alert for ${donor.name} (${donor.contactNumber})...`);

                    if (twilioClient && donor.contactNumber) {
                        try {
                            await twilioClient.messages.create({
                                body: message,
                                from: process.env.TWILIO_PHONE_NUMBER,
                                to: donor.contactNumber
                            });
                        } catch (smsError) {
                            console.error(`      ❌ SMS FAILED: ${smsError.message}`);
                        }
                    } else {
                        console.log(`      ⚠️ Skipped Real SMS: Missing Twilio Config or Number`);
                    }
                });

                res.json({
                    success: true,
                    request: newRequest,
                    message: `Alert sent to ${donors.length} donors with Urgency Score: ${priorityResult.score}`
                });

            } catch (parseError) {
                console.error('JSON Parse Error:', parseError, stdout);
                res.status(500).json({ error: 'Invalid response from priority engine' });
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ UTILITY ENDPOINTS ============

// Get server network IPs (for mobile testing)
app.get('/api/network-ips', (req, res) => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const ips = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                ips.push(net.address);
            }
        }
    }

    // Sort IPs to prioritize common LAN ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    ips.sort((a, b) => {
        const isCommonLAN = (ip) => {
            return ip.startsWith('192.168.') ||
                ip.startsWith('10.') ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
        };

        const aIsLAN = isCommonLAN(a);
        const bIsLAN = isCommonLAN(b);

        if (aIsLAN && !bIsLAN) return -1;
        if (!aIsLAN && bIsLAN) return 1;
        return 0;
    });

    res.json({ ips });
});

// ============ SERVE FRONTEND (PRODUCTION) ============

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ============ START SERVER ============

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 HealthVault API Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);

    // Get network IP
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`   Network: http://${net.address}:${PORT}`);
            }
        }
    }
});
