const { userModel, userWalletModel } = require('../models');

const signup = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }

    if (!password || !validatePassword(password)) {
        return res.status(400).json({ error: 'Invalid password' });
    }

    try {
        // Check if the user already exists
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            const passwordMatch = await bcrypt.compare(password, existingUser.password);

            if (!passwordMatch) {
                return res.status(400).json({ error: 'Incorrect password' });
            }

            // Passwords match, return user data
            return res.status(200).json({ existingUser });
        } else {
            const newUser = new userModel({
                email,
                password: await bcrypt.hash(password, 10) // Hash the password
            });

            await newUser.save();

            const newUserWallet = new userWalletModel({
                userId: newUser._id,
                balance: 0
            });

            await newUserWallet.save();

            return res.status(201).json({ newUser });
        }
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await user.comparePassword(password);
        console.log(isPasswordValid)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name, mobileNumber, userId } = req.body;
        console.log(userId)
        // Validate request body
        if (!name || !mobileNumber) {
            return res.status(400).json({ error: 'Name and phone number are required' });
        }

        const updatedUser = await userModel.findOneAndUpdate(
            { _id: userId },
            { name, mobileNumber },
            { new: true } // Return the modified document
        );
        // Check if user exists
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ message: 'User details updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

module.exports = { login, signup, updateProfile };