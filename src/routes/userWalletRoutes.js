const express = require('express');
const router = express.Router();
const { userWalletController } = require('../controller')

router
    .get('/getUserWallet', userWalletController.getUserWallet)
    .post('/withdrawMoney', userWalletController.withdrawMoney)
    .post('/approveOrRejectWithdrawalRequest', userWalletController.approveOrRejectWithdrawalRequest)
    .get('/getUserTransactionHistory', userWalletController.getUserTransactionHistory)
    .post('/submitAddMoneyRequest', userWalletController.submitAddMoneyRequest)
    .post('/processAddMoneyRequest', userWalletController.processAddMoneyRequest)









module.exports = router;