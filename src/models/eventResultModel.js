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

// Index definition
eventResultSchema.index({ eventId: 1 }); // Index on eventId for efficient querying based on event ID

const EventResult = mongoose.model('EventResult', eventResultSchema);

module.exports = EventResult;
