const express = require('express');
const router = express.Router();
const { positionModel } = require('../models');

const insertPosition = async (req, res) => {
    try {
        let { name, symbol, points, _id } = req.body
        if (_id) {
            let updatePosition = await positionModel.updateOne({ _id }, { name, symbol, points })
        } else {
            let addPosition = await positionModel.create({ name, symbol, points, _id })

        }

        res.status(201).json({ message: 'Position added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add Position', error: error.message });
    }
};


module.exports = {
    insertPosition
};