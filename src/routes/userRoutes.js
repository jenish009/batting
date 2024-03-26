const express = require('express');
const router = express.Router();
const { userController } = require('../controller')

router.post('/signup', userController.signup)
router.post('/login', userController.login)
router.post('/updateProfile', userController.updateProfile)
router.post('/isExistingUser', userController.isExistingUser)




module.exports = router;