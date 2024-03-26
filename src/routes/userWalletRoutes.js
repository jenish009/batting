const express = require('express');
const router = express.Router();
const { userWalletController } = require('../controller')

router
    .get('/getUserWallet', userWalletController.getUserWallet)




module.exports = router;