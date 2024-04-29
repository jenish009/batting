const mongoose = require('mongoose');

// Define the schema for the player list
const refereAndEarnSchema = new mongoose.Schema({
    data: {
        type: String,
        required: true
    },
}, { versionKey: false, timestamps: true });

// Create a mongoose model for the refereAndEarn list
const refereAndEarn = mongoose.model('refereAndEarn', refereAndEarnSchema);

module.exports = refereAndEarn;
