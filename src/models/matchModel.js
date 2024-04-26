const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    team1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    team2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    category: {
        ref: 'gameCategory',
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    entryPrice: {
        type: Number,
        required: true
    },
    maxRegistrations: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'in progress', 'finished'],
        default: 'upcoming'
    },
    winningPrices: [{ type: Object }],
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { versionKey: false, timestamps: true });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
