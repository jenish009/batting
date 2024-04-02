const mongoose = require('mongoose');

// Define schema for withdrawal requests
const WithdrawalRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    accountNo: {
        type: String,
    },
    ifsc: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    }
}, { versionKey: false });

// Create model for withdrawal requests
const WithdrawalRequest = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);

module.exports = WithdrawalRequest;
