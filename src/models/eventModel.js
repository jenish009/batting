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
        enum: ['upcoming', 'in progress', 'finished'],
        default: 'upcoming'
    },
    winningPrices: [{ type: Object }],
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { versionKey: false });

// Index definitions
eventSchema.index({ time: 1 }); // Index on time field for sorting and range queries
eventSchema.index({ status: 1 }); // Index on status for efficient filtering
eventSchema.index({ 'registeredUsers': 1 }); // Index on registeredUsers for queries involving registered users

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
