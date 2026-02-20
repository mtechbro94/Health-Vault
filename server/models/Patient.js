const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    patientId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    name: { type: String, default: '' },
    location: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    allergies: { type: String, default: '' },
    conditions: { type: String, default: '' },
    medications: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    bloodDonation: { type: Boolean, default: false },
    bloodDonationStatus: { type: String, default: 'available' }, // available, unavailable
    bloodDonationReason: { type: String, default: '' },
    bloodDonationDisease: { type: String, default: '' },
    bloodDonationStatusDate: { type: Date, default: null },
    hospitalAccessConsent: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
