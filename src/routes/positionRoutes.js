const express = require('express');
const router = express.Router();
const { positionController } = require('../controller')

router
    .post('/insertPosition', positionController.insertPosition)




module.exports = router;