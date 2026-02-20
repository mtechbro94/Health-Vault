const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    hospitalId: { type: String, required: true },
    hospitalName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    requestType: { type: String, required: true },
    urgencyScore: { type: Number, default: 0 },
    isCritical: { type: Boolean, default: false },
    escalationReason: { type: String, default: '' },
    donorsNotified: { type: Number, default: 0 },
    status: { type: String, default: 'active' }, // active, fulfilled, cancelled
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
