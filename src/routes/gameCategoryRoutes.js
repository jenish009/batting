const express = require('express');
const router = express.Router();
const { gameCategoryController } = require('../controller')

router
    .post('/createGameCategory', gameCategoryController.createGameCategory)






module.exports = router;