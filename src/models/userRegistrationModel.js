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
        sparse: true
    },
    teamData: [{
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        position: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'position',
            required: true
        },
        points: {
            type: Number,
            default: 0
        },
    }],
}, { versionKey: false });

// Index definitions
userRegistrationSchema.index({ eventId: 1 }); // Index on eventId for efficient querying based on event
userRegistrationSchema.index({ userId: 1 }); // Index on userId for efficient querying based on user

const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);

module.exports = UserRegistration;
