const express = require('express');
const router = express.Router();
const { referController } = require('../controller')

router
    .get('/getReferralPage', referController.getReferralPage)










module.exports = router;