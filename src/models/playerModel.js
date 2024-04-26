const mongoose = require('mongoose');

// Define the schema for the player list
const playerSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true
    },
    game: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    jerseyNumber: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    // Add more keys as needed
}, { versionKey: false, timestamps: true });

// Create a mongoose model for the player list
const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
