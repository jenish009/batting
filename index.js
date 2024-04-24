const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();
require('./src/config');
const cron = require('node-cron');
const { eventController } = require('./src/controller');
const { eventModel } = require('./src/models');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const { userRoutes, eventRoutes, userWalletRoutes, referRoutes } = require('./src/routes')
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/wallet', userWalletRoutes);
app.use('/refer', referRoutes);

app.get('/app/getMetaData', (req, res) => {
    try {
        const response = {
            appVersion: process.env.APP_VERSION,
            appLink: process.env.APP_LINK
        }
        res.status(201).json({ success: true, data: response });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Define and start the cron job
cron.schedule('0 */5 * * * *', async () => {
    try {
        const currentTime = new Date();
        console.log(currentTime)
        const events = await eventModel.find({
            time: { $lte: currentTime },
            status: { $ne: 'finished' }
        });

        for (const event of events) {
            await eventController.luckyDraw({ query: { eventId: event._id } }, null); // Pass eventId to luckyDraw function
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
