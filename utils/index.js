const { generateUniqueTicketNumber } = require("./generateTicket");
const { uploadImageToDrive } = require("./uploadFile");
const { authenticateUser } = require("./authantication");




module.exports = { generateUniqueTicketNumber, uploadImageToDrive, authenticateUser };