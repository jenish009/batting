const mongoose = require('mongoose');

// Define schema for transaction history
const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Deposit', 'Withdraw', 'Registration'],
        required: true
    },
    note: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

// Index definition
transactionSchema.index({ userId: 1 }); // Index on userId for efficient querying based on user ID

// Create model for transaction history
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
