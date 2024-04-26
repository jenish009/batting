const express = require("express");
const {
    gameCategoryModel,
} = require("../models");
const mongoose = require("mongoose");
const moment = require('moment-timezone');

const createGameCategory = async (req, res) => {
    try {
        const {
            name
        } = req.body;

        const newGameCategory = new gameCategoryModel({
            name
        });
        await newGameCategory.save();

        res
            .status(201)
            .json({ message: "Game Category scheduled successfully" });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Failed to create Game Category", error: error.message });
    }
};



module.exports = {
    createGameCategory,
};
