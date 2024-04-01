const mongoose = require('mongoose');

const gameHistoriesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    ticketNumber: {
        type: String,
        required: true
    },
    isWin: {
        type: Boolean,
        required: true
    }
}, { versionKey: false, timestamps: true });

const gameHistories = mongoose.model('gameHistories', gameHistoriesSchema);

module.exports = gameHistories;
