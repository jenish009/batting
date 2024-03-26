const mongoose = require('mongoose');

const eventResultSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    result: {
        type: Object,
        required: true
    }
}, { versionKey: false });

const eventResult = mongoose.model('eventResult', eventResultSchema);

module.exports = eventResult;
