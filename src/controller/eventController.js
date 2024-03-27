const { eventModel, userWalletModel, transactionModel, UserRegistrationModel, eventResultModel, userModel } = require('../models');
const { generateUniqueTicketNumber } = require('../../utils');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

const createEvent = async (req, res) => {
    const { time, maxRegistrations, entryPrice, name, status, winningPrices } = req.body;

    try {
        if (!time || !maxRegistrations || !entryPrice || !name || !status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newEvent = new eventModel({
            time,
            maxRegistrations,
            entryPrice,
            name,
            status,
            winningPrices
        });

        await newEvent.save();

        return res.status(201).json({ success: true, message: 'Event added successfully', event: newEvent });
    } catch (error) {
        console.error('Error adding event:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const userRegistration = async (req, res) => {
    const { userId, eventId, note } = req.body;

    try {
        const event = await eventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const userWallet = await userWalletModel.findOne({ userId });

        if (!userWallet) {
            return res.status(404).json({ error: 'User wallet not found' });
        }

        const entryFee = event.entryPrice;
        if (event.maxRegistrations <= event.registeredUsers.length) {
            return res.status(400).json({ error: 'Event is full' });
        }
        if (userWallet.balance < entryFee) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const ticketNumber = await generateUniqueTicketNumber(event.name);

        userWallet.balance -= entryFee;
        await userWallet.save();

        transactionModel.create({
            userId,
            amount: -entryFee,
            type: 'withdraw',
            note: note || 'Registered for event'
        });

        new UserRegistrationModel({
            userId,
            eventId,
            ticketNumber
        }).save();

        event.registeredUsers.push(userId);
        event.save();

        return res.status(200).json({ success: true, message: 'User registered successfully', ticketNumber });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const getEventByUserId = async (req, res) => {
    try {
        const { userId, myevent, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let matchQuery = {};
        if (myevent) {
            const todayIST = moment.tz(moment.tz('Asia/Kolkata').startOf('day'), 'Asia/Kolkata').utc().toDate();
            console.log(todayIST)

            matchQuery = {
                registeredUsers: { $in: [new mongoose.Types.ObjectId(userId)] },
                time: {
                    $gte: todayIST,
                    $lte: moment(todayIST).add(1, 'day').toDate()
                }
            };

        } else {
            matchQuery = { time: { $gte: new Date() } };
        }
        const totalEventsCount = await eventModel.countDocuments(matchQuery); // Count total events

        const events = await eventModel.aggregate([
            { $match: matchQuery },
            { $addFields: { registeredUsersCount: { $size: '$registeredUsers' } } },
            { $sort: { time: 1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $group: {
                    _id: '$_id',
                    time: { $first: '$time' },
                    maxRegistrations: { $first: '$maxRegistrations' },
                    entryPrice: { $first: '$entryPrice' },
                    name: { $first: '$name' },
                    status: { $first: '$status' },
                    winningPrices: { $first: '$winningPrices' },
                    registeredUsersCount: { $first: '$registeredUsersCount' },
                }
            }
        ]);
        const totalPages = Math.ceil(totalEventsCount / limit); // Calculate total pages

        const eventsWithCounts = events.map((event) => {
            let totalWinningAmount = 0;
            event.winningPrices.forEach(obj => {
                const winningPosition = obj.rank
                const amount = obj.amount

                if (winningPosition.includes('-')) {
                    const [start, end] = winningPosition.split('-').map(Number);
                    const winnersInRange = end - start + 1;
                    totalWinningAmount += winnersInRange * amount;
                } else {
                    totalWinningAmount += amount;
                }
            });

            return { ...event, totalWinningAmount };
        });

        return res.json({ success: true, data: eventsWithCounts, totalPages });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const getEventById = async (req, res) => {
    try {
        const { userId, eventId } = req.query;

        const eventAggregate = await eventModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(eventId) } },
            { $addFields: { registeredUsersCount: { $size: '$registeredUsers' } } },
            {
                $lookup: {
                    from: 'userregistrations',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$eventId', new mongoose.Types.ObjectId(eventId)] },
                                        { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 0, ticketNumber: 1 } }
                    ],
                    as: 'userRegistrationsTicket'
                }
            },
            { $project: { registeredUsers: 0 } },
            {
                $lookup: {
                    from: 'eventresults',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'eventResult'
                }
            },
            { $unwind: { path: '$eventResult', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    'eventResult.resultWithNames': {
                        $objectToArray: '$eventResult.result'
                    }
                }
            },
            {
                $unwind: {
                    path: '$eventResult.resultWithNames',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'eventResult.resultWithNames.v.userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $addFields: {
                    'eventResult.resultWithNames.v.userName': { $arrayElemAt: ['$userDetails.name', 0] }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    time: { $first: '$time' },
                    maxRegistrations: { $first: '$maxRegistrations' },
                    entryPrice: { $first: '$entryPrice' },
                    name: { $first: '$name' },
                    status: { $first: '$status' },
                    winningPrices: { $first: '$winningPrices' },
                    registeredUsersCount: { $first: '$registeredUsersCount' },
                    userRegistrationsTicket: { $first: '$userRegistrationsTicket' },
                    eventResult: { $push: '$eventResult.resultWithNames.v' },
                }
            }
        ]);




        if (eventAggregate.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = eventAggregate[0];
        const userTickets = event.userRegistrationsTicket.map(registration => registration.ticketNumber);
        delete event.userRegistrationsTicket;

        const maxWinningNumber = event.winningPrices[event.winningPrices.length - 1].rank.split('-')[1];
        const winningPercentage = (maxWinningNumber * 100) / event.maxRegistrations;
        let totalWinningAmount = 0;
        event.winningPrices.forEach(obj => {
            const winningPosition = obj.rank
            const amount = obj.amount

            if (winningPosition.includes('-')) {
                const [start, end] = winningPosition.split('-').map(Number);
                const winnersInRange = end - start + 1;
                totalWinningAmount += winnersInRange * amount;
            } else {
                totalWinningAmount += amount;
            }
        });

        const response = { ...event, userTickets, winningPercentage, totalWinningAmount };

        return res.json({ success: true, data: response });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const luckyDraw = async (req, res) => {
    try {
        const { eventId } = req.query;

        const event = await eventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.status === 'finished') {
            return res.status(400).json({ error: 'Event already completed' });
        }

        const existingResults = await eventResultModel.findOne({ eventId });

        if (existingResults) {
            return res.status(400).json({ error: 'Event results already exist for this event' });
        }

        const winningPrices = event.winningPrices;
        const totalWinnersNeeded = event.winningPrices[event.winningPrices.length - 1].rank.split("-")[1] || event.winningPrices[event.winningPrices.length - 1].rank.split("-")[0]
        const eventResult = {};

        let totalWinners = 0;
        let ticketSelected = []
        for (const winningPrice of winningPrices) {
            const priceKeys = winningPrice.rank
            const [startRank, endRank] = priceKeys.split('-');
            let requiredTickets = 1;

            if (endRank) {
                requiredTickets = parseInt(endRank) - parseInt(startRank) + 1;
            }
            const tickets = await UserRegistrationModel.aggregate([
                { $match: { eventId: new mongoose.Types.ObjectId(eventId), ticketNumber: { $nin: ticketSelected } } },
                { $sample: { size: requiredTickets } }
            ]);
            for (const ticket of tickets) {
                if (totalWinners < totalWinnersNeeded) {
                    const userWallet = await userWalletModel.findOneAndUpdate(
                        { userId: ticket.userId },
                        { $inc: { balance: winningPrice["amount"] } },
                        { upsert: true, new: true }
                    );

                    eventResult[ticket.ticketNumber] = {
                        userId: ticket.userId,
                        winningPrice: winningPrice["amount"]
                    };
                    ticketSelected.push(ticket.ticketNumber)
                    totalWinners++;
                } else {
                    break; // Exit the loop if we've reached the required number of winners
                }
            }

            if (totalWinners >= totalWinnersNeeded) {
                break; // Exit the loop if we've reached the required number of winners
            }
        }
        await eventResultModel.create({ eventId, result: eventResult });

        await eventModel.findByIdAndUpdate(eventId, { status: 'finished' });

        return res.json({ success: true, message: 'Lucky draw completed successfully' });
    } catch (error) {
        console.error('Error in lucky draw:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    createEvent, userRegistration, getEventByUserId, getEventById, luckyDraw
};
