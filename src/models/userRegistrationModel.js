const mongoose = require('mongoose');

const userRegistrationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    ticketNumber: {
        type: String,
        unique: true
    }
}, { versionKey: false });

const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);

module.exports = UserRegistration;
