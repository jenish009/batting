const express = require('express');
const router = express.Router();
const { playerController } = require('../controller')

router
    .post('/addPlayers', playerController.addPlayers)
    .post('/addPlayersInTeam', playerController.addPlayersInTeam)


module.exports = router;