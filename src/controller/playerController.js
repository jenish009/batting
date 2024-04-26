const express = require('express');
const router = express.Router();
const { playerModel, teamModel } = require('../models');

const addPlayers = async (req, res) => {
    try {
        const playersToAdd = req.body;

        const insertedPlayers = await playerModel.insertMany(playersToAdd);

        res.status(201).json({ message: 'Players added successfully', players: insertedPlayers });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add players', error: error.message });
    }
};

const addPlayersInTeam = async (req, res) => {
    try {
        const teamId = req.body.teamId;
        const playerIds = req.body.playerIds;

        const team = await teamModel.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const players = await playerModel.find({ _id: { $in: playerIds } });
        if (!players || players.length !== playerIds.length) {
            return res.status(404).json({ message: 'One or more players not found' });
        }

        team.players = playerIds
        await team.save();

        res.status(201).json({ message: 'Players added to the team successfully', team });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add players to the team', error: error.message });
    }
};


module.exports = {
    addPlayers,
    addPlayersInTeam
};