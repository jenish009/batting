const { userModel, userWalletModel } = require('../models');

const getUserWallet = async (req, res) => {
    try {
        const { userId } = req.query;

        // Find the user wallet based on the provided user ID
        const userWallet = await userWalletModel.findOne({ userId });

        if (!userWallet) {
            throw new Error('User wallet not found');
        }

        return res.json({ success: true, data: userWallet });
    } catch (error) {
        console.error('Error fetching user wallet:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getUserWallet
};
