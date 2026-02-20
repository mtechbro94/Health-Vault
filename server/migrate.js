const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Hospital = require('./models/Hospital');
const Record = require('./models/Record');
const AccessLog = require('./models/AccessLog');
const BloodRequest = require('./models/BloodRequest');

const DATA_FILE = path.join(__dirname, 'data.json');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected for Migration');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const migrateData = async () => {
    try {
        await connectDB();

        if (!fs.existsSync(DATA_FILE)) {
            console.error('❌ Data file not found:', DATA_FILE);
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        console.log('🔄 Starting Migration...');

        // Users
        if (data.users && data.users.length > 0) {
            console.log(`   Migrating ${data.users.length} users...`);
            await User.deleteMany({}); // Optional: Clear existing
            await User.insertMany(data.users);
        }

        // Patients
        if (data.patients && data.patients.length > 0) {
            console.log(`   Migrating ${data.patients.length} patients...`);
            await Patient.deleteMany({});
            await Patient.insertMany(data.patients);
        }

        // Hospitals
        if (data.hospitals && data.hospitals.length > 0) {
            console.log(`   Migrating ${data.hospitals.length} hospitals...`);
            await Hospital.deleteMany({});
            await Hospital.insertMany(data.hospitals);
        }

        // Records
        if (data.records && data.records.length > 0) {
            console.log(`   Migrating ${data.records.length} records...`);
            await Record.deleteMany({});
            await Record.insertMany(data.records);
        }

        // Access Logs
        if (data.accessLogs && data.accessLogs.length > 0) {
            console.log(`   Migrating ${data.accessLogs.length} access logs...`);
            await AccessLog.deleteMany({});
            const accessLogs = data.accessLogs.map(log => ({
                ...log,
                action: log.action || log.accessType || 'UNKNOWN_ACTION' // Map accessType to action
            }));
            await AccessLog.insertMany(accessLogs);
        }

        // Blood Requests
        if (data.bloodRequests && data.bloodRequests.length > 0) {
            console.log(`   Migrating ${data.bloodRequests.length} blood requests...`);
            await BloodRequest.deleteMany({});
            await BloodRequest.insertMany(data.bloodRequests);
        }

        console.log('✅ Migration Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
};

migrateData();
