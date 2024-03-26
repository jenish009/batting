const { userModel, userWalletModel } = require('../models');

const getUserWallet = async (req, res) => {
    try {
        const { userId } = req.query;

        // Find the user wallet based on the provided user ID
        const userWallet = await userWalletModel.findOne({ userId });

        if (!userWallet) {
            return res.status(404).json({ error: 'User wallet not found' });
        }

        return res.json({ success: true, data: userWallet });
    } catch (error) {
        console.error('Error fetching user wallet:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

module.exports = {
    getUserWallet
};
