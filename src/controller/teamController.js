const { teamModel } = require('../models');

const addTeam = async (req, res) => {
    try {
        const { teamName, sport, shortName } = req.body;

        const newTeam = new teamModel({ teamName, sport });
        await newTeam.save();

        res.status(201).json({ message: 'Team added successfully', team: newTeam });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add team', error: error.message });
    }
}

module.exports = { addTeam };
