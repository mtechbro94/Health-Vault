const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping UUID for backward compatibility
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'hospital', 'admin'], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
