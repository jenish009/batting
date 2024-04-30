const {
    userWalletModel,
    transactionModel,
    withdrawalRequestModel,
    addMoneyModel,
} = require("../models");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { uploadImageToDrive, authenticateUser } = require("../../utils");
const mime = require("mime-types");
const mongoose = require("mongoose");

const getUserWallet = async (req, res) => {
    try {
        const { userId } = req.query;
        await authenticateUser(userId);

        // Find the user wallet based on the provided user ID
        const userWallet = await userWalletModel.findOne({ userId });

        if (!userWallet) {
            throw new Error("User wallet not found");
        }

        return res.json({ success: true, data: userWallet });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({ success: false, error: "Unauthorized" });
        }
        console.error("Error fetching user wallet:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const withdrawMoney = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        await authenticateUser(userId);

        if (!userId) {
            throw new Error("User ID is required. Please provide your user ID.");
        }

        if (!amount || isNaN(amount) || amount < 100) {
            throw new Error(
                "Invalid amount. Minimum withdrawal amount is 100. Please enter a valid amount."
            );
        }

        const userWallet = await userWalletModel.findOne({ userId });

        if (!userWallet) {
            throw new Error("User wallet not found. Please contact support.");
        }

        if (userWallet.winningBalance < amount) {
            throw new Error(
                "Insufficient winning balance. Please make sure you have enough winning balance for withdrawal."
            );
        }

        userWallet.balance -= amount;
        userWallet.winningBalance -= amount;

        await userWallet.save();

        const withdrawalRequest = new withdrawalRequestModel({
            userId: userId,
            amount: amount,
        });
        await withdrawalRequest.save();

        return res.json({
            success: true,
            message: "Withdrawal request submitted successfully",
            walletBalance: userWallet.balance,
            winningBalance: userWallet.winningBalance,
            addedBalance: userWallet.addedBalance,
        });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({
                success: false,
                error: "Unauthorized access. Please login again.",
            });
        }
        console.error("Error withdrawing money:", error.message);
        return res.status(400).json({
            success: false,
            error: "Failed to withdraw money. " + error.message,
        });
    }
};

const approveOrRejectWithdrawalRequest = async (req, res) => {
    try {
        const { requestId, action, rejectionReason, transactionId } = req.body;

        // Find the withdrawal request by ID
        const withdrawalRequest = await withdrawalRequestModel.findById(requestId);

        if (!withdrawalRequest) {
            return res.status(404).json({ error: "Withdrawal request not found" });
        }

        if (withdrawalRequest.status !== "pending") {
            return res
                .status(400)
                .json({ error: "Withdrawal request is not pending" });
        }

        if (action === "approve") {
            withdrawalRequest.status = "completed";
            withdrawalRequest.completedAt = new Date();

            const transaction = new transactionModel({
                userId: withdrawalRequest.userId,
                amount: withdrawalRequest.amount,
                transactionId: transactionId,
                type: "Withdraw",
                note: "Cash withdrawn successfully",
            });
            await transaction.save();
        } else if (action === "reject") {
            withdrawalRequest.status = "rejected";
            withdrawalRequest.rejectionReason = rejectionReason;

            const userWallet = await userWalletModel.findOne({
                userId: withdrawalRequest.userId,
            });
            userWallet.balance += withdrawalRequest.amount;
            userWallet.winningBalance += withdrawalRequest.amount;
            await userWallet.save();
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        await withdrawalRequest.save();

        return res.json({
            success: true,
            message: `Withdrawal request ${action === "approve" ? "approved" : "rejected"
                } successfully`,
        });
    } catch (error) {
        console.error("Error processing withdrawal request:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getUserTransactionHistory = async (req, res) => {
    try {
        const { userId } = req.query;
        await authenticateUser(userId);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const totalCount = await transactionModel.countDocuments({ userId });

        const transactions = await transactionModel
            .find({ userId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalCount / limit);

        return res.json({
            success: true,
            message: "Transaction history retrieved successfully",
            data: transactions,
            totalPages: totalPages,
        });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({
                success: false,
                error: "Unauthorized access. Please login again.",
            });
        }
        console.error("Error fetching transaction history:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch transaction history. " + error.message,
        });
    }
};

const submitAddMoneyRequest = async (req, res) => {
    try {
        upload.single("paymentScreenshot")(req, res, async (err) => {
            if (err) {
                return res
                    .status(400)
                    .json({ error: "File upload failed. Please try again." });
            }

            try {
                const imageBuffer = req.file.buffer;
                const { userId, transactionId, amount } = req.body;

                await authenticateUser(userId);
                const fileExtension = req.file.originalname.split(".").pop();
                const filename = `paymentScreenshot_${Date.now()}.${fileExtension}`;

                // Determine MIME type based on file extension
                const mimeType = mime.lookup(fileExtension) || "image/png";

                let imageLink = await uploadImageToDrive(
                    imageBuffer,
                    filename,
                    mimeType
                );
                if (!imageLink) {
                    return res.status(400).json({
                        success: false,
                        error:
                            "Payment screenshot is required. Please upload a valid image.",
                    });
                }

                // Check if transactionId is already used
                const existingRequest = await addMoneyModel.findOne({ transactionId });
                if (existingRequest) {
                    return res.status(400).json({
                        success: false,
                        error: "Transaction ID already exists. Please use a different ID.",
                    });
                }

                const addMoneyRequest = await addMoneyModel.create({
                    userId,
                    transactionId,
                    paymentScreenshot: imageLink,
                    amount,
                });

                return res.json({
                    success: true,
                    message: "Money request submitted successfully",
                    data: addMoneyRequest,
                });
            } catch (error) {
                if (error.message === "Unauthorized") {
                    return res.status(403).json({
                        success: false,
                        error: "Unauthorized access. Please login again.",
                    });
                }
                console.error("Error submitting add money request:", error);
                return res.status(500).json({
                    success: false,
                    error: "Failed to submit money request. " + error.message,
                });
            }
        });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({
                success: false,
                error: "Unauthorized access. Please login again.",
            });
        }
        console.error("Error submitting add money request:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to submit money request. " + error.message,
        });
    }
};

const processAddMoneyRequest = async (req, res) => {
    try {
        const { requestId, status } = req.body;

        const [addMoneyRequest] = await addMoneyModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(requestId),
                },
            },
            {
                $lookup: {
                    from: "users", // Assuming the collection name is "users"
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "users", // Assuming the collection name is "users"
                    localField: "user.referedCode",
                    foreignField: "referralCode",
                    as: "referedUser",
                },
            },
            { $unwind: "$referedUser" },
            {
                $addFields: {
                    referedUser: "$referedUser._id",
                },
            },
            {
                $project: {
                    status: 1,
                    userId: 1,
                    transactionId: 1,
                    amount: 1,
                    type: 1,
                    referedUser: 1,
                },
            },
        ]);
        console.log("addMoneyRequest>>", addMoneyRequest);
        if (!addMoneyRequest) {
            return res
                .status(404)
                .json({ success: false, error: "Add money request not found" });
        }

        if (addMoneyRequest.status === "accepted") {
            return res
                .status(400)
                .json({ success: false, error: "Add money request already accepted" });
        }

        await addMoneyModel.updateOne(
            {
                _id: new mongoose.Types.ObjectId(requestId),
            },
            {
                status: status,
            }
        );

        if (status === "accepted") {
            const userWallet = await userWalletModel.findOne({
                userId: addMoneyRequest.userId,
            });
            if (!userWallet) {
                return res
                    .status(404)
                    .json({ success: false, error: "User wallet not found" });
            }

            userWallet.balance += addMoneyRequest.amount;
            userWallet.addedBalance += addMoneyRequest.amount;
            await userWallet.save();

            const transaction = new transactionModel({
                userId: addMoneyRequest.userId,
                amount: addMoneyRequest.amount,
                transactionId: addMoneyRequest.transactionId,
                type: "Deposit",
                note:
                    addMoneyRequest.type === "refer"
                        ? `Referral bonus added successfully`
                        : `Cash added successfully`,
            });
            // await transaction.save();
            console.log("addMoneyRequest>>??", addMoneyRequest);
            if (addMoneyRequest.amount >= 100) {
                let refereBonusInPending = await addMoneyModel.findOne({
                    userId: addMoneyRequest.referedUser,
                    refereUser: addMoneyRequest.userId,
                    type: "refer",
                    status: "pending",
                });
                console.log("refereBonusInPending?>>", refereBonusInPending)
                if (refereBonusInPending) {
                    refereBonusInPending.status = "accepted";
                    await refereBonusInPending.save();
                    let refereUserWaltter = await userWalletModel.findOne({
                        userId: addMoneyRequest.referedUser,
                    });
                    refereUserWaltter.balance += 25;
                    refereUserWaltter.addedBalance += 25;
                    await refereUserWaltter.save();

                    const transaction = new transactionModel({
                        userId: addMoneyRequest.referedUser,
                        amount: 25,
                        transactionId: addMoneyRequest.transactionId,
                        type: "Deposit",
                        note: `Referral bonus added successfully`,
                    });
                    await transaction.save();
                }
            }
        }
        return res.json({ success: true, message: `Add money request ${status}` });
    } catch (error) {
        console.error("Error processing add money request:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const requestForQr = async (req, res) => {
    try {
        let { amount, userId } = req.query;
        await authenticateUser(userId);

        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({
                success: false,
                error: "Invalid or missing 'amount' parameter.",
            });
        }

        // Format the amount to have two decimal places
        amount = parseFloat(amount).toFixed(2);

        // Update the URL with the provided amount
        let url = `upi://pay?pa=groundbloggers@okicici&pn=Bloggers%20Ground&am=${amount}&cu=INR`;

        return res.json({ success: true, url, upiId: process.env.UPI_ID });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({ success: false, error: "Unauthorized" });
        }
        console.error("Error processing add money request:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getUserWallet,
    withdrawMoney,
    approveOrRejectWithdrawalRequest,
    getUserTransactionHistory,
    submitAddMoneyRequest,
    processAddMoneyRequest,
    requestForQr,
};
