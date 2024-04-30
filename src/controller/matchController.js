const express = require("express");
const router = express.Router();
const {
    playerModel,
    teamModel,
    matchModel,
    userWalletModel,
    UserRegistrationModel,
} = require("../models");
const { authenticateUser } = require("../../utils");
const mongoose = require("mongoose");
const moment = require('moment-timezone');

const createMatch = async (req, res) => {
    try {
        const {
            team1,
            team2,
            time,
            venue,
            maxRegistrations,
            entryPrice,
            winningPrices,
            category
        } = req.body;

        const newMatch = new matchModel({
            team1,
            team2,
            time,
            venue,
            maxRegistrations,
            entryPrice,
            winningPrices,
            category
        });
        await newMatch.save();

        res
            .status(201)
            .json({ message: "Match scheduled successfully", match: newMatch });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Failed to schedule match", error: error.message });
    }
};

const getMatch = async (req, res) => {
    try {
        const { userId, myevent, page = 1, limit = 10, categoryFilter } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        await authenticateUser(userId);

        let matchQuery = {};
        if (myevent) {
            const todayIST = moment
                .tz(moment.tz("Asia/Kolkata").startOf("day"), "Asia/Kolkata")
                .utc()
                .toDate();
            console.log(todayIST);

            matchQuery = {
                registeredUsers: { $in: [new mongoose.Types.ObjectId(userId)] },
                time: {
                    $gte: todayIST,
                },
            };
        } else {
            matchQuery = {
                registeredUsers: { $nin: [new mongoose.Types.ObjectId(userId)] },
                status: {
                    $ne: "finished",
                },
                time: {
                    $gte: new Date(),
                },
                $expr: { $lt: [{ $size: "$registeredUsers" }, "$maxRegistrations"] },
            };
        }
        if (categoryFilter) {
            matchQuery = { ...matchQuery, category: new mongoose.Types.ObjectId(categoryFilter) }
        }
        const totalEventsCount = await matchModel.countDocuments(matchQuery); // Count total events

        const matches = await matchModel.aggregate([
            { $match: matchQuery },
            { $addFields: { registeredUsersCount: { $size: "$registeredUsers" } } },
            { $sort: { time: 1 } },
            {
                $lookup: {
                    from: "teams", // Assuming the collection name for teams is 'teams'
                    localField: "team1",
                    foreignField: "_id",
                    as: "team1Data",
                },
            },
            { $unwind: "$team1Data" },
            {
                $lookup: {
                    from: "teams",
                    localField: "team2",
                    foreignField: "_id",
                    as: "team2Data",
                },
            },
            { $unwind: "$team2Data" },

            {
                $project: {
                    _id: 1,
                    time: 1,
                    venue: 1,
                    "team1Data.teamName": 1,
                    "team1Data._id": 1,
                    "team2Data.teamName": 1,
                    "team2Data._id": 1,
                    entryPrice: 1,
                    maxRegistrations: 1,
                    status: 1,
                    winningPrices: 1,
                    registeredUsersCount: 1,
                },
            },
            { $skip: skip },
            { $limit: parseInt(limit) },
        ]);
        const totalPages = Math.ceil(totalEventsCount / limit); // Calculate total pages

        const matchWithCounts = matches.map((event) => {
            let totalWinningAmount = 0;

            const maxWinningNumber = event.winningPrices[event.winningPrices.length - 1].rank.split('-')[1] || event.winningPrices[event.winningPrices.length - 1].rank.split('-')[0];
            const winningPercentage = (maxWinningNumber * 100) / event.maxRegistrations;
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

            return { ...event, totalWinningAmount, winningPercentage };
        });

        return res.json({ success: true, data: matchWithCounts, totalPages });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Failed to fetch matches", error: error.message });
    }
};

const userRegistration = async (req, res) => {
    const { userId, eventId, note, teamData } = req.body;

    try {
        await authenticateUser(userId);
        const match = await matchModel.findById(eventId);
        if (!match) {
            return res
                .status(404)
                .json({ error: "Event not found. Please select a valid event." });
        }

        const userWallet = await userWalletModel.findOne({ userId });
        if (!userWallet) {
            return res
                .status(404)
                .json({ error: "User wallet not found. Please contact support." });
        }

        if (userWallet.balance < match.entryPrice) {
            throw new Error("Insufficient balance. Please add funds to your wallet.");
        }

        const entryFee = match.entryPrice;
        if (match.maxRegistrations <= match.registeredUsers.length) {
            return res
                .status(400)
                .json({ error: "Event is full. Please try another event." });
        }

        let remainingFee = entryFee;
        console.log("remainingFee>>>", remainingFee);

        if (userWallet.addedBalance >= remainingFee) {
            userWallet.addedBalance -= remainingFee;
            remainingFee = 0;
        } else {
            remainingFee -= userWallet.addedBalance;
            userWallet.addedBalance = 0;
        }

        if (remainingFee > 0 && userWallet.winningBalance >= remainingFee) {
            userWallet.winningBalance -= remainingFee;
            remainingFee = 0;
        } else if (remainingFee > 0) {
            remainingFee -= userWallet.winningBalance;
            userWallet.winningBalance = 0;
        }

        userWallet.balance -= entryFee;
        console.log(userWallet);
        await userWallet.save();

        new UserRegistrationModel({
            userId,
            eventId,
            teamData,
        }).save();

        match.registeredUsers.push(userId);
        await match.save();

        return res.status(200).json({
            success: true,
            message: "You have successfully registered for the event.",
            walletBalance: userWallet.balance,
            winningBalance: userWallet.winningBalance,
            addedBalance: userWallet.addedBalance,
        });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({
                success: false,
                error: "Unauthorized access. Please login again.",
            });
        }
        console.error("Error registering user:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error. Please try again later.",
        });
    }
};
const getMatchById = async (req, res) => {
    try {
        const { userId, matchId } = req.query;
        await authenticateUser(userId);

        const matchAggregate = await matchModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(matchId) } },
            { $addFields: { registeredUsersCount: { $size: '$registeredUsers' } } },
            {
                $lookup: {
                    from: "teams",
                    localField: "team1",
                    foreignField: "_id",
                    as: "team1Data"
                }
            },
            { $unwind: "$team1Data" },
            {
                $lookup: {
                    from: "teams",
                    localField: "team2",
                    foreignField: "_id",
                    as: "team2Data"
                }
            },
            { $unwind: "$team2Data" },
            {
                $project: {
                    "team1": 0,
                    "team2": 0,
                    "registeredUsers": 0,
                    "team1Data.sport": 0,
                    "team1Data.players": 0,
                    "team1Data.createdAt": 0,
                    "team1Data.updatedAt": 0,
                    "team2Data.sport": 0,
                    "team2Data.players": 0,
                    "team2Data.createdAt": 0,
                    "team2Data.updatedAt": 0,
                    "userRegistrationsTicket.eventId": 0,
                    "userRegistrationsTicket.userId": 0
                }
            }
        ]);

        let userTeams = await UserRegistrationModel.aggregate([
            { $match: { eventId: new mongoose.Types.ObjectId(matchId) } },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teamData.playerId',
                    foreignField: '_id',
                    as: 'playerDetails'
                }
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: 'teamData.position',
                    foreignField: '_id',
                    as: 'positionDetails'
                }
            },
            {
                $addFields: {
                    teamData: {
                        $map: {
                            input: '$teamData',
                            as: 'team',
                            in: {
                                playerId: '$$team.playerId',
                                playerName: {
                                    $let: {
                                        vars: {
                                            player: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$playerDetails',
                                                            as: 'detail',
                                                            cond: { $eq: ['$$detail._id', '$$team.playerId'] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: '$$player.playerName'
                                    }
                                },
                                playerImage: {
                                    $let: {
                                        vars: {
                                            player: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$playerDetails',
                                                            as: 'detail',
                                                            cond: { $eq: ['$$detail._id', '$$team.playerId'] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: '$$player.image'
                                    }
                                },
                                position: '$$team.position',
                                positionName: {
                                    $let: {
                                        vars: {
                                            position: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$positionDetails',
                                                            as: 'detail',
                                                            cond: { $eq: ['$$detail._id', '$$team.position'] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: '$$position.name'
                                    }
                                },
                                points: '$$team.points'
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalPoints: {
                        $sum: '$teamData.points'
                    }
                }
            },
            {
                $sort: { totalPoints: -1 } // Sort by totalPoints in descending order
            },
            {
                $project: {
                    "playerDetails": 0,
                    "positionDetails": 0,
                    "eventId": 0,
                }
            }
        ]);



        userTeams = userTeams.map((team, index) => ({ ...team, rank: index + 1 })).filter((team, index) => team.userId == userId);

        if (matchAggregate.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = matchAggregate[0];

        const maxWinningNumber = event.winningPrices[event.winningPrices.length - 1].rank.split('-')[1] || event.winningPrices[event.winningPrices.length - 1].rank.split('-')[0];
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
        // if (Object.keys(event.eventResult[0]).length == 0) {
        //     event.eventResult = []
        // }
        const response = { ...event, winningPercentage, totalWinningAmount, userTeams };

        return res.json({ success: true, data: response });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

const addPointToPlayerForMatch = async (req, res) => {
    try {
        let { point, playerId, matchId } = req.body;

        let registrations = await UserRegistrationModel.findOne({ eventId: matchId });

        if (!registrations) {
            return res.status(404).json({ success: false, error: 'Registrations not found for the given matchId' });
        }
        registrations.find(obj => {
            obj.teamData.find(obj2 => {
                if (obj2.playerId.toString() === playerId) {
                    return obj
                }
            })
        })
        // let matchingRegistration = registrations.teamData.find(data => data.playerId.toString() === playerId);

        if (!matchingRegistration) {
            return res.status(404).json({ success: false, error: 'Player not found in the registrations for the given matchId' });
        }

        // Update the points for the player
        matchingRegistration.points += point;

        // Save the updated registration
        await registrations.save();

        return res.json({ success: true, data: registrations });

    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createMatch,
    getMatch,
    userRegistration,
    getMatchById,
    addPointToPlayerForMatch
};
