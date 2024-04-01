const { userWalletModel, transactionModel, withdrawalRequestModel, addMoneyModel } = require('../models');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { uploadImageToDrive } = require('../../utils');
const mime = require("mime-types");

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

        // Create a new withdrawal request
        const withdrawalRequest = new withdrawalRequestModel({
            userId: userId,
            amount: amount
        });
        await withdrawalRequest.save();

        return res.json({ success: true, message: 'Withdrawal request submitted successfully' });
    } catch (error) {
        console.error('Error withdrawing money:', error.message);
        return res.status(400).json({ success: false, error: error.message });
    }
}

const approveOrRejectWithdrawalRequest = async (req, res) => {
    try {
        const { requestId, action, rejectionReason } = req.body;

        // Find the withdrawal request by ID
        const withdrawalRequest = await withdrawalRequestModel.findById(requestId);

        if (!withdrawalRequest) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }

        if (withdrawalRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Withdrawal request is not pending' });
        }

        if (action === 'approve') {
            withdrawalRequest.status = 'completed';
            withdrawalRequest.completedAt = new Date();

            const userWallet = await userWalletModel.findOne({ userId: withdrawalRequest.userId });
            userWallet.balance -= withdrawalRequest.amount;
            await userWallet.save();

            const transaction = new transactionModel({
                userId: withdrawalRequest.userId,
                amount: withdrawalRequest.amount,
                type: 'Withdraw',
                note: 'Cash withdrawn successfully'
            });
            await transaction.save();
        } else if (action === 'reject') {
            withdrawalRequest.status = 'rejected';
            withdrawalRequest.rejectionReason = rejectionReason;
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        await withdrawalRequest.save();

        return res.json({ success: true, message: `Withdrawal request ${action === 'approve' ? 'approved' : 'rejected'} successfully` });
    } catch (error) {
        console.error('Error processing withdrawal request:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const getUserTransactionHistory = async (req, res) => {
    try {
        const { userId } = req.query;

        // Fetch user's transaction history from the database
        const transactions = await transactionModel.find({ userId }).sort({ timestamp: -1 });

        // Return the transaction history in the response
        return res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const submitAddMoneyRequest = async (req, res) => {
    try {
        upload.single("paymentScreenshot")(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: "File upload failed" });
            }

            try {
                const imageBuffer = req.file.buffer;
                const { userId, transactionId, amount } = req.body;

                // Construct filename dynamically
                const fileExtension = req.file.originalname.split(".").pop();
                const filename = `payment_screenshot_${Date.now()}.${fileExtension}`;

                // Determine MIME type based on file extension
                const mimetype = mime.lookup(fileExtension) || "image/png";

                let imageLink = await uploadImageToDrive(imageBuffer, filename, mimetype)
                if (!imageLink) {
                    return res.status(400).json({ success: false, error: "Payment screenshot is required" });
                }

                const addMoneyRequest = await addMoneyModel.create({
                    userId,
                    transactionId,
                    paymentScreenshot: imageLink,
                    amount
                });

                return res.json({ success: true, message: "Add money request submitted successfully", data: addMoneyRequest });
            }
            catch (error) {
                console.error("Error submitting add money request:", error);
                return res.status(500).json({ success: false, error: error.message });
            }
        });

    } catch (error) {
        console.error("Error submitting add money request:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const processAddMoneyRequest = async (req, res) => {
    try {
        const { requestId, status } = req.body;

        // Find the add money request by ID
        const addMoneyRequest = await addMoneyModel.findById(requestId);

        if (!addMoneyRequest) {
            return res.status(404).json({ success: false, error: 'Add money request not found' });
        }

        // Check if the add money request has already been accepted
        if (addMoneyRequest.status === 'accepted') {
            return res.status(400).json({ success: false, error: 'Add money request already accepted' });
        }

        // Update the status of the add money request
        addMoneyRequest.status = status;
        await addMoneyRequest.save();

        // If the status is 'accepted', credit the amount to the user's wallet and add transaction history
        if (status === 'accepted') {
            // Find user's wallet
            const userWallet = await userWalletModel.findOne({ userId: addMoneyRequest.userId });
            if (!userWallet) {
                return res.status(404).json({ success: false, error: 'User wallet not found' });
            }

            // Update user's wallet balance
            userWallet.balance += addMoneyRequest.amount;
            await userWallet.save();

            // Add transaction history
            const transaction = new transactionModel({
                userId: addMoneyRequest.userId,
                amount: addMoneyRequest.amount,
                type: 'Deposit',
                note: `Cash added successfully`,
            });
            await transaction.save();
        }

        return res.json({ success: true, message: `Add money request ${status}` });
    } catch (error) {
        console.error('Error processing add money request:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}



module.exports = {
    getUserWallet,
    withdrawMoney,
    approveOrRejectWithdrawalRequest,
    getUserTransactionHistory,
    submitAddMoneyRequest,
    processAddMoneyRequest
};
