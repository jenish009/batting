const path = require("path");
const { google } = require("googleapis");
const { Readable } = require("stream");

const keyFile = path.join(__dirname + "/credential.json");

const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/drive"], // Adjust the scope as needed
});

const drive = google.drive({ version: "v3", auth });
const uploadImageToDrive = async (imageBuffer, filename, mimetype) => {
    try {
        console.log(mimetype)
        const imageStream = Readable.from(imageBuffer);
        const driveResponse = await drive.files.create({
            resource: {
                name: filename,
                mimeType: mimetype,
                parents: ["1zHrMQg0efUnNL2wohvvWmrqjJIx4iONU"],
            },
            media: {
                mimeType: mimetype,
                body: imageStream,
            },
        });

        return `https://drive.google.com/uc?id=${driveResponse.data.id}`;
    } catch (error) {
        console.log(error);
        throw new Error("Error uploading image to Google Drive");
    }
};

module.exports = {
    uploadImageToDrive
};
