const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    symbol: {
        type: String,
    },
    points: {
        type: Number,
        required: true
    }
}, { versionKey: false });

const position = mongoose.model('position', positionSchema);

module.exports = position;
