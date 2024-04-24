const fs = require('fs');
const path = require('path');

const getReferralPage = async (req, res) => {
    try {
        const htmlTemplatePath = path.join(__dirname, 'referral_page.html');
        const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');

        return res.status(200).send({ data: htmlTemplate, refereUrl: process.env.SITE_URL });
    } catch (error) {
        console.error('Error sending referral page:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}


module.exports = {
    getReferralPage
};