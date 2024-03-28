const express = require('express');
const router = express.Router();
const { userWalletController } = require('../controller')

router
    .get('/getUserWallet', userWalletController.getUserWallet)
    .post('/withdrawMoney', userWalletController.withdrawMoney)





module.exports = router;