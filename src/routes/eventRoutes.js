const express = require('express');
const router = express.Router();
const { eventController } = require('../controller')

router
    .post('/createEvent', eventController.createEvent)
    .post('/userRegistration', eventController.userRegistration)
    .get('/getEventByUserId', eventController.getEventByUserId)
    .get('/getEventById', eventController.getEventById)
    .post('/luckyDraw', eventController.luckyDraw)
    .get('/gameHistory', eventController.gameHistory)





module.exports = router;