const mongoose = require('mongoose');

// Define schema for user wallet
const userWalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
}, { versionKey: false });

// Create model for user wallet
const UserWallet = mongoose.model('UserWallet', userWalletSchema);

module.exports = UserWallet;
