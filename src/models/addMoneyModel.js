const mongoose = require('mongoose');

const addMoneySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionId: {
        type: String,
    },
    paymentScreenshot: {
        type: String,
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['deposite', 'refer']
    }
}, { versionKey: false });

const AddMoney = mongoose.model('AddMoney', addMoneySchema);

module.exports = AddMoney;
