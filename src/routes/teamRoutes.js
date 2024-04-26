const express = require('express');
const router = express.Router();
const { teamController } = require('../controller')

router
    .post('/addTeam', teamController.addTeam)

module.exports = router;