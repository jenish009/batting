const { userModel } = require('../src/models');

const authenticateUser = async (_id) => {
    try {
        const user = await userModel.findOne({ _id });

        if (!user) {
            const error = new Error("Unauthorized");
            error.statusCode = 403; // Set the status code to 403
            throw error;
        }
    } catch (error) {
        throw new Error("Unauthorized");
    }
};

module.exports = {
    authenticateUser
};
