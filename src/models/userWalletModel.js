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
    },
    winningBalance: {
        type: Number,
        default: 0
    },
    addedBalance: {
        type: Number,
        default: 0
    }
}, { versionKey: false });

userWalletSchema.index({ userId: 1 });

const UserWallet = mongoose.model('UserWallet', userWalletSchema);

module.exports = UserWallet;
