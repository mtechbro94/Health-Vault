const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    hospitalName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., 'VIEW_PROFILE', 'ADD_RECORD'
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
