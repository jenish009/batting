const mongoose = require('mongoose');

// Define the schema for the team
const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true
    },
    shortName: {
        type: String
    },
    image: {
        type: String
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }]
}, { versionKey: false, timestamps: true });

const team = mongoose.model('team', teamSchema);

module.exports = team;
