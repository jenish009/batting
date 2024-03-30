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

// Index definitions
userRegistrationSchema.index({ eventId: 1 }); // Index on eventId for efficient querying based on event
userRegistrationSchema.index({ userId: 1 }); // Index on userId for efficient querying based on user
userRegistrationSchema.index({ ticketNumber: 1 }); // Index on ticketNumber for efficient querying based on ticket number

const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);

module.exports = UserRegistration;
