const fs = require('fs');
const path = require('path');
const { refereAndEarnModel } = require('../models');

const getReferralPage = async (req, res) => {
    try {
        let data = await refereAndEarnModel.findOne()

        return res.status(200).send({ data, refereUrl: process.env.SITE_URL });
    } catch (error) {
        console.error('Error sending referral page:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}


module.exports = {
    getReferralPage
};