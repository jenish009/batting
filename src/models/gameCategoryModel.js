const mongoose = require('mongoose');

const gameCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
}, { versionKey: false });

const gameCategory = mongoose.model('gameCategory', gameCategorySchema);

module.exports = gameCategory;

