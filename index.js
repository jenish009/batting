const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();
require('./src/config');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());


const { userRoutes, eventRoutes, userWalletRoutes } = require('./src/routes')
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/wallet', userWalletRoutes);
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



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
