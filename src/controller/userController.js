const { userModel, userWalletModel } = require('../models');

const signup = async (req, res) => {
    const { email, password, name, mobileNumber } = req.body;

    // Validate email format
    if (!email || !validateEmail(email)) {
        throw new Error('Invalid email');
    }

    // Validate password format
    if (!password || !validatePassword(password)) {
        throw new Error('Invalid password');
    }

    // Validate name
    if (!name) {
        throw new Error('Name is required');
    }

    // Validate mobile number format
    if (!mobileNumber || !validateMobileNumber(mobileNumber)) {
        throw new Error('Invalid mobile number');
    }

    try {
        // Check if the email is already in use
        const existingUserByEmail = await userModel.findOne({ email });

        if (existingUserByEmail) {
            throw new Error('Email already exists');
        }

        // Check if the mobile number is already in use
        const existingUserByMobileNumber = await userModel.findOne({ mobileNumber });

        if (existingUserByMobileNumber) {
            throw new Error('Mobile number already exists');
        }

        // Both email and mobile number are unique, proceed to create a new user
        const newUser = new userModel({
            email,
            password,
            name,
            mobileNumber
        });

        await newUser.save();

        const newUserWallet = new userWalletModel({
            userId: newUser._id,
            balance: 0
        });

        await newUserWallet.save();

        return res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ success: false, error: error.message });
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
        return res.json({ isExisting: !!existingUser });
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
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        return res.status(200).json({ success: true, message: 'Login successful', data: user });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name, mobileNumber, userId } = req.body;

        // Validate request body
        if (!name || !mobileNumber) {
            throw new Error('Name and phone number are required');
        }

        const updatedUser = await userModel.findOneAndUpdate(
            { _id: userId },
            { name, mobileNumber },
            { new: true } // Return the modified document
        );
        // Check if user exists
        if (!updatedUser) {
            throw new Error('User not found');
        }

        return res.json({ success: true, message: 'User details updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user details:', error);
        return res.status(500).json({ success: false, error: error.message });
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
