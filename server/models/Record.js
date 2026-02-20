const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    patientId: { type: String, required: true, ref: 'Patient' }, // Using patientId (string) not _id for consistency
    hospitalId: { type: String, default: '' },
    hospitalName: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    prescription: { type: String, default: '' },
    notes: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Record', recordSchema);
