const { userModel } = require('../src/models');

const authenticateUser = async (_id) => {
    try {
        const user = await userModel.findOne({ _id });

        if (!user) {
            res.status(403).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    authenticateUser
};