const cron = require('node-cron');
const { eventController } = require('../src/controller'); // Make sure to provide the correct path

const { eventModel } = require('../src/models'); // Make sure to provide the correct path

cron.schedule('* * * * *', async () => {
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
