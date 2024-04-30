const { userModel, userWalletModel, addMoneyModel } = require('../models');
const { authenticateUser } = require('../../utils');

const signup = async (req, res) => {
    try {
        const { email, password, name, mobileNumber, role, referenceCode } = req.body;

        console.log("req.body>>", req.body)
        if (!email || !validateEmail(email)) {
            throw new Error('Invalid email. Please provide a valid email address.');
        }
        if (!password || !validatePassword(password)) {
            throw new Error('Invalid password. Password must be at least 8 characters long.');
        }
        if (!name) {
            throw new Error('Name is required. Please provide your name.');
        }
        if (!mobileNumber || !validateMobileNumber(mobileNumber)) {
            throw new Error('Invalid mobile number. Please provide a valid mobile number.');
        }

        // Check if email or mobile number already exists
        const existingUserByEmail = await userModel.findOne({ email });
        if (existingUserByEmail) {
            throw new Error('Email already exists. Please use a different email address.');
        }
        const existingUserByMobileNumber = await userModel.findOne({ mobileNumber });
        if (existingUserByMobileNumber) {
            throw new Error('Mobile number already exists. Please use a different mobile number.');
        }

        const referralCode = await generateReferralCode(name);

        const newUser = new userModel({
            email,
            password,
            name,
            mobileNumber,
            referralCode,
            role: role || 'user',
            referedCode: referenceCode
        });
        await newUser.save();

        const newUserWallet = new userWalletModel({
            userId: newUser._id,
            balance: 0
        });
        let referredUser = null;
        if (referenceCode) {
            referredUser = await userModel.findOne({ referralCode: referenceCode });
            if (referredUser) {
                const addMoneyRequest = new addMoneyModel({
                    userId: referredUser._id,
                    amount: 25,
                    type: 'refer',
                    status: 'pending',
                    refereUser: newUser._id
                });
                await addMoneyRequest.save();
            }
        }
        await newUserWallet.save();

        return res.status(201).json({ success: true, data: { ...newUser.toObject(), companyEmail: process.env.COMPANY_EMAIL } });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, error: 'Registration failed. ' + error.message });
    }
}

module.exports = signup;



const generateReferralCode = async (name) => {
    try {

        let referralCode;
        let existingUserByReferralCode
        do {
            const randomString = Math.random().toString(36).substr(2, 5);
            // Concatenate the first three characters of the name with the random string
            referralCode = name.substring(0, 3).toUpperCase() + randomString;
            // Check if the referral code already exists in the database
            existingUserByReferralCode = await userModel.findOne({ referralCode });
            // If the referral code already exists, generate a new one
        } while (existingUserByReferralCode);
        // Return the unique referral code
        return referralCode;
    }
    catch (error) {
        return error
    }
}

const isExistingUser = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate request body
        if (!email) {
            throw new Error('Email is required');
        }

        // Check if user with the given email exists
        const existingUser = await userModel.findOne({ email });

        // Return true if user exists, otherwise false
        return res.json({ success: true, isExisting: !!existingUser });
    } catch (error) {
        console.error('Error checking existing user:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            throw new Error('Invalid credentials. Please check your email and password.');
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials. Please check your email and password.');
        }

        return res.status(200).json({ success: true, message: 'Login successful', data: { ...user.toObject(), companyEmail: process.env.COMPANY_EMAIL } });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ success: false, error: 'Login failed. ' + error.message });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name, mobileNumber, userId } = req.body;
        await authenticateUser(userId);

        // Validate request body
        if (!name || !mobileNumber) {
            throw new Error('Name and mobile number are required. Please provide both name and mobile number.');
        }

        const updatedUser = await userModel.findOneAndUpdate(
            { _id: userId },
            { name, mobileNumber },
            { new: true } // Return the modified document
        );

        // Check if user exists
        if (!updatedUser) {
            throw new Error('User not found. Please try again later.');
        }

        return res.json({ success: true, message: 'User details updated successfully', user: updatedUser });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({ success: false, error: 'Unauthorized access. Please login again.' });
        }
        console.error('Error updating user details:', error);
        return res.status(500).json({ success: false, error: 'Failed to update user details. ' + error.message });
    }
}


function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}
function validateMobileNumber(mobileNumber) {
    // Regular expression to match a valid mobile number format
    const mobileNumberRegex = /^\d{10}$/;

    // Check if the mobile number matches the regex pattern
    return mobileNumberRegex.test(mobileNumber);
}

module.exports = { login, signup, updateProfile, isExistingUser };
