const express = require('express');
const router = express.Router();
const { matchController } = require('../controller')

router
    .post('/createMatch', matchController.createMatch)
    .get('/getMatch', matchController.getMatch)
    .post('/userRegistration', matchController.userRegistration)
    .get('/getMatchById', matchController.getMatchById)
    .post('/addPointToPlayerForMatch', matchController.addPointToPlayerForMatch)





module.exports = router;