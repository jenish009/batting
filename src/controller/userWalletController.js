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

const withdrawMoney = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId) {
            throw new Error('User ID is required');
        }
        if (!amount || isNaN(amount) || amount < 100) {
            throw new Error('Invalid amount. Minimum withdrawal amount is 100');
        }

        const userWallet = await userWalletModel.findOne({ userId });

        if (!userWallet) {
            throw new Error('User wallet not found');
        }

        if (userWallet.balance < amount) {
            throw new Error('Insufficient balance');
        }

        userWallet.balance -= amount;
        await userWallet.save();

        // Optionally, you can save transaction history here

        return res.json({ success: true, message: 'Withdrawal successful', data: { newBalance: userWallet.balance } });
    } catch (error) {
        console.error('Error withdrawing money:', error.message);
        return res.status(400).json({ success: false, error: error.message });
    }
}
module.exports = {
    getUserWallet,
    withdrawMoney
};
