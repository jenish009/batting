const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    time: {
        type: Date,
        required: true
    },
    maxRegistrations: {
        type: Number,
        required: true
    },
    entryPrice: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'finished'],
        default: 'upcoming'
    },
    winningPrices: [{ type: Object }],
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Add registeredUsers array

}, { versionKey: false });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
