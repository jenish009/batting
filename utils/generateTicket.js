const crypto = require('crypto');
const { UserRegistrationModel } = require('../src/models');

const generateUniqueTicketNumber = async (eventName) => {
    let ticketNumber;
    do {
        const timestamp = Date.now().toString();
        const uniqueString = eventName + timestamp;
        const hash = crypto.createHash('sha256'); // Use SHA-256 hash function
        hash.update(uniqueString);
        const hashValue = hash.digest('hex'); // Get the hexadecimal hash

        ticketNumber = formatNumber(hashValue).toUpperCase();

        const existingEvent = await UserRegistrationModel.findOne({ ticketNumber });
        if (existingEvent) {
            ticketNumber = null;
        }
    } while (!ticketNumber);

    return ticketNumber;
}

// Function to format the hash value into a custom format
const formatNumber = (hashValue) => {
    // Extract a portion of the hash value and format it as needed
    const formatted = hashValue.substr(0, 3) + '-' + hashValue.substr(3, 3) + '-' + hashValue.substr(6, 3);
    return formatted;
}

module.exports = {
    generateUniqueTicketNumber
};
