const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    name: { type: String, default: 'Hospital' },
    address: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
