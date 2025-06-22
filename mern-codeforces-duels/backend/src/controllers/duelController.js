const Duel = require('../models/Duel');
const User = require('../models/User');
const axios = require('axios');
const { calculatePoints, calculateDrawPoints, getBonusMessage } = require('../utils/pointsCalculator');

exports.createDuel = async (req, res) => {
    const { opponentId, ratingMin, ratingMax, tags } = req.body;
    const challengerId = req.user.id;

    try {
        const challenger = await User.findById(challengerId).populate('friends');
        const opponent = await User.findById(opponentId);

        if (!opponent) {
            return res.status(404).json({ message: 'Opponent not found' });
        }

        const isFriend = challenger.friends.some(friend => friend._id.toString() === opponentId);
        if (!isFriend) {
            return res.status(400).json({ message: 'You can only challenge your friends' });
        }

        const existingDuel = await Duel.findOne({
            $or: [
                { challenger: challengerId, opponent: opponentId, status: 'pending' },
                { challenger: opponentId, opponent: challengerId, status: 'pending' }
            ]
        });

        if (existingDuel) {
            return res.status(400).json({ message: 'A pending duel already exists between you and this user' });
        }

        const newDuel = new Duel({
            challenger: challengerId,
            opponent: opponentId,
            challengeDetails: {
                ratingRange: { min: ratingMin, max: ratingMax },
                tags: tags
            }
        });

        await newDuel.save();
        
        res.status(201).json({ 
            message: 'Duel challenge sent successfully!',
            duelId: newDuel._id 
        });
    } catch (error) {
        console.error('Error creating duel:', error);
        res.status(500).json({ message: 'Error creating duel', error: error.message });
    }
};

exports.getPendingDuels = async (req, res) => {
    const userId = req.user.id;

    try {
        await cleanupExpiredDuels();

        const pendingDuels = await Duel.find({
            opponent: userId,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
        .populate('challenger', 'username codeforcesId')
        .populate('opponent', 'username codeforcesId')
        .sort({ createdAt: -1 });

        res.status(200).json(pendingDuels);
    } catch (error) {
        console.error('Error fetching pending duels:', error);
        res.status(500).json({ message: 'Error fetching pending duels', error: error.message });
    }
};

exports.acceptDuel = async (req, res) => {
    const { duelId } = req.params;
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId);
        
        if (!duel) {
            return res.status(404).json({ message: 'Duel not found' });
        }

        if (duel.opponent.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to accept this duel' });
        }

        if (duel.status !== 'pending') {
            return res.status(400).json({ message: 'This duel is no longer pending' });
        }

        if (new Date() > duel.expiresAt) {
            duel.status = 'expired';
            await duel.save();
            return res.status(400).json({ message: 'This duel has expired' });
        }

        const selectedProblem = await selectRandomUnsolvedProblem(duel.challengeDetails, duel.challenger, duel.opponent);
        
        duel.status = 'active';
        duel.battleDetails = {
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600 * 1000), 
            duration: 3600
        };
        duel.challengeDetails.selectedProblem = selectedProblem;
        duel.expiresAt = undefined; 
        
        await duel.save();

        res.status(200).json({ 
            message: 'Duel accepted! The battle begins now!',
            duel: duel,
            redirectTo: `/battle/${duel._id}`
        });
    } catch (error) {
        console.error('Error accepting duel:', error);
        res.status(500).json({ message: 'Error accepting duel', error: error.message });
    }
};

exports.getActiveDuel = async (req, res) => {
    const { duelId } = req.params;
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId)
            .populate('challenger', 'username codeforcesId')
            .populate('opponent', 'username codeforcesId');

        if (!duel) {
            return res.status(404).json({ message: 'Duel not found' });
        }

        const isParticipant = duel.challenger._id.toString() === userId || duel.opponent._id.toString() === userId;
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not a participant in this duel' });
        }

        if (duel.status === 'active' && new Date() > duel.battleDetails.endTime) {
            duel.status = 'completed';
            duel.result = {
                winCondition: 'timeout',
                completedAt: new Date()
            };
            await duel.save();
        }

        res.status(200).json(duel);
    } catch (error) {
        console.error('Error fetching duel:', error);
        res.status(500).json({ message: 'Error fetching duel details', error: error.message });
    }
};

exports.rejectDuel = async (req, res) => {
    const { duelId } = req.params;
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId);
        
        if (!duel) {
            return res.status(404).json({ message: 'Duel not found' });
        }

        if (duel.opponent.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to reject this duel' });
        }

        if (duel.status !== 'pending') {
            return res.status(400).json({ message: 'This duel is no longer pending' });
        }

        await Duel.findByIdAndDelete(duelId);

        res.status(200).json({ message: 'Duel rejected' });
    } catch (error) {
        console.error('Error rejecting duel:', error);
        res.status(500).json({ message: 'Error rejecting duel', error: error.message });
    }
};

exports.offerDraw = async (req, res) => {
    const { duelId } = req.params;
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId);

        if (!duel || duel.status !== 'active') {
            return res.status(400).json({ message: 'Invalid duel or duel not active' });
        }

        const isParticipant = duel.challenger.toString() === userId || duel.opponent.toString() === userId;
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not a participant in this duel' });
        }

        if (duel.battleDetails.drawOffer && duel.battleDetails.drawOffer.status === 'pending') {
            return res.status(400).json({ message: 'A draw offer is already pending' });
        }

        duel.battleDetails.drawOffer = {
            offeredBy: userId,
            offeredAt: new Date(),
            status: 'pending'
        };

        await duel.save();

        res.status(200).json({ 
            message: 'Draw offer sent successfully',
            duel: duel 
        });
    } catch (error) {
        console.error('Error offering draw:', error);
        res.status(500).json({ message: 'Error offering draw', error: error.message });
    }
};

exports.respondToDrawOffer = async (req, res) => {
    const { duelId } = req.params;
    const { action } = req.body; 
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId)
            .populate('challenger', 'username codeforcesId rating points')
            .populate('opponent', 'username codeforcesId rating points');

        if (!duel || duel.status !== 'active') {
            return res.status(400).json({ message: 'Invalid duel or duel not active' });
        }

        if (!duel.battleDetails.drawOffer || duel.battleDetails.drawOffer.status !== 'pending') {
            return res.status(400).json({ message: 'No pending draw offer found' });
        }

        const drawOfferer = duel.battleDetails.drawOffer.offeredBy.toString();
        const isRecipient = (drawOfferer === duel.challenger._id.toString() && userId === duel.opponent._id.toString()) ||
                           (drawOfferer === duel.opponent._id.toString() && userId === duel.challenger._id.toString());

        if (!isRecipient) {
            return res.status(403).json({ message: 'You cannot respond to this draw offer' });
        }

        if (action === 'accept') {
            const drawPoints = calculateDrawPoints(duel.challenger.rating, duel.opponent.rating);
            
            await User.findByIdAndUpdate(duel.challenger._id, {
                $inc: { points: drawPoints.player1Points }
            });
            await User.findByIdAndUpdate(duel.opponent._id, {
                $inc: { points: drawPoints.player2Points }
            });

            duel.status = 'draw';
            duel.battleDetails.drawOffer.status = 'accepted';
            duel.result = {
                winCondition: 'draw',
                completedAt: new Date(),
                pointsAwarded: {
                    challenger: drawPoints.player1Points,
                    opponent: drawPoints.player2Points
                }
            };
            await duel.save();
            
            res.status(200).json({ 
                message: `Draw accepted. Both players earned points! ${duel.challenger.username}: +${drawPoints.player1Points}, ${duel.opponent.username}: +${drawPoints.player2Points}`,
                duel: duel 
            });
        } else if (action === 'reject') {
            duel.battleDetails.drawOffer.status = 'rejected';
            await duel.save();
            res.status(200).json({ message: 'Draw offer rejected. Battle continues.', duel: duel });
        } else {
            return res.status(400).json({ message: 'Invalid action. Use "accept" or "reject".' });
        }
    } catch (error) {
        console.error('Error responding to draw offer:', error);
        res.status(500).json({ message: 'Error responding to draw offer', error: error.message });
    }
};

exports.withdrawDrawOffer = async (req, res) => {
    const { duelId } = req.params;
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId);

        if (!duel || duel.status !== 'active') {
            return res.status(400).json({ message: 'Invalid duel or duel not active' });
        }

        if (!duel.battleDetails.drawOffer || 
            duel.battleDetails.drawOffer.offeredBy.toString() !== userId ||
            duel.battleDetails.drawOffer.status !== 'pending') {
            return res.status(400).json({ message: 'No pending draw offer from you found' });
        }

        duel.battleDetails.drawOffer.status = 'withdrawn';
        await duel.save();

        res.status(200).json({ 
            message: 'Draw offer withdrawn successfully',
            duel: duel 
        });
    } catch (error) {
        console.error('Error withdrawing draw offer:', error);
        res.status(500).json({ message: 'Error withdrawing draw offer', error: error.message });
    }
};

exports.checkSubmissionStatus = async (req, res) => {
    const { duelId } = req.params;
    const userId = req.user.id;

    try {
        const duel = await Duel.findById(duelId)
            .populate('challenger', 'username codeforcesId rating points')
            .populate('opponent', 'username codeforcesId rating points');

        if (!duel || duel.status !== 'active') {
            return res.status(400).json({ message: 'Duel not found or not active' });
        }

        const isParticipant = duel.challenger._id.toString() === userId || duel.opponent._id.toString() === userId;
        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not a participant in this duel' });
        }

        const winner = await checkForWinner(duel);
        
        if (winner) {
            const isWinnerChallenger = winner.toString() === duel.challenger._id.toString();
            const winnerUser = isWinnerChallenger ? duel.challenger : duel.opponent;
            const loserUser = isWinnerChallenger ? duel.opponent : duel.challenger;

            const pointsResult = calculatePoints(winnerUser.rating, loserUser.rating);
            const bonusMessage = getBonusMessage(pointsResult);

            const currentLoserPoints = loserUser.points || 0;
            const actualPointsLost = Math.min(pointsResult.loserLoses, currentLoserPoints);

            await User.findByIdAndUpdate(winnerUser._id, {
                $inc: { points: pointsResult.winnerGains }
            });
            await User.findByIdAndUpdate(loserUser._id, {
                $inc: { points: -actualPointsLost },
                $max: { points: 0 } 
            });

            duel.status = 'completed';
            duel.result.winner = winner;
            duel.result.winCondition = 'first_solve';
            duel.result.completedAt = new Date();
            duel.result.pointsAwarded = {
                winner: pointsResult.winnerGains,
                loser: -actualPointsLost,
                bonusMessage: bonusMessage
            };
            await duel.save();

            res.status(200).json({ 
                message: `🏆 ${winnerUser.username} won the duel! +${pointsResult.winnerGains} points! ${loserUser.username} loses ${actualPointsLost} points. ${bonusMessage}`,
                winner: winner,
                pointsAwarded: { ...pointsResult, loserLoses: actualPointsLost },
                bonusMessage: bonusMessage,
                duel: duel 
            });
        } else {
            res.status(200).json({ 
                message: 'No winner yet',
                duel: duel 
            });
        }
    } catch (error) {
        console.error('Error checking submission status:', error);
        res.status(500).json({ message: 'Error checking submission status', error: error.message });
    }
};

exports.getUserDuels = async (req, res) => {
    const userId = req.user.id;

    try {
        await cleanupExpiredDuels();

        const duels = await Duel.find({
            $or: [
                { challenger: userId },
                { opponent: userId }
            ]
        })
        .populate('challenger', 'username codeforcesId')
        .populate('opponent', 'username codeforcesId')
        .sort({ createdAt: -1 });

        res.status(200).json(duels);
    } catch (error) {
        console.error('Error fetching user duels:', error);
        res.status(500).json({ message: 'Error fetching duels', error: error.message });
    }
};

const cleanupExpiredDuels = async () => {
    try {
        const result = await Duel.updateMany(
            { 
                status: 'pending', 
                expiresAt: { $lt: new Date() } 
            },
            { 
                status: 'expired' 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`Marked ${result.modifiedCount} duels as expired`);
        }
    } catch (error) {
        console.error('Error cleaning up expired duels:', error);
    }
};

const selectRandomProblem = async (challengeDetails) => {
    try {
        const problemsResponse = await axios.get('https://codeforces.com/api/problemset.problems');
        const problems = problemsResponse.data.result.problems;
        
        const filteredProblems = problems.filter(problem => {
            const ratingMatch = problem.rating >= challengeDetails.ratingRange.min && 
                              problem.rating <= challengeDetails.ratingRange.max;
            const tagMatch = challengeDetails.tags.some(tag => 
                problem.tags && problem.tags.includes(tag)
            );
            return ratingMatch && tagMatch;
        });

        if (filteredProblems.length === 0) {
            throw new Error('No problems found matching the criteria');
        }

        const randomProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
        
        return {
            contestId: randomProblem.contestId,
            index: randomProblem.index,
            name: randomProblem.name,
            rating: randomProblem.rating,
            url: `https://codeforces.com/contest/${randomProblem.contestId}/problem/${randomProblem.index}`
        };
    } catch (error) {
        console.error('Error selecting random problem:', error);
        throw error;
    }
};

const selectRandomUnsolvedProblem = async (challengeDetails, challengerId, opponentId) => {
    try {
        const [challenger, opponent] = await Promise.all([
            User.findById(challengerId),
            User.findById(opponentId)
        ]);

        const problemsResponse = await axios.get('https://codeforces.com/api/problemset.problems');
        const problems = problemsResponse.data.result.problems;
        
        const filteredProblems = problems.filter(problem => {
            const ratingMatch = problem.rating >= challengeDetails.ratingRange.min && 
                              problem.rating <= challengeDetails.ratingRange.max;
            const tagMatch = challengeDetails.tags.some(tag => 
                problem.tags && problem.tags.includes(tag)
            );
            return ratingMatch && tagMatch;
        });

        if (filteredProblems.length === 0) {
            throw new Error('No problems found matching the criteria');
        }

        const randomProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
        
        return {
            contestId: randomProblem.contestId,
            index: randomProblem.index,
            name: randomProblem.name,
            rating: randomProblem.rating,
            url: `https://codeforces.com/contest/${randomProblem.contestId}/problem/${randomProblem.index}`
        };
    } catch (error) {
        console.error('Error selecting random problem:', error);
        throw error;
    }
};

const checkForWinner = async (duel) => {
    try {
        const [challengerSubmissions, opponentSubmissions] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.status?handle=${duel.challenger.codeforcesId}&from=1&count=20`),
            axios.get(`https://codeforces.com/api/user.status?handle=${duel.opponent.codeforcesId}&from=1&count=20`)
        ]);

        const problemKey = `${duel.challengeDetails.selectedProblem.contestId}${duel.challengeDetails.selectedProblem.index}`;
        
        const challengerAccepted = challengerSubmissions.data.result?.find(sub => {
            const subProblemKey = `${sub.problem.contestId}${sub.problem.index}`;
            const submissionTime = new Date(sub.creationTimeSeconds * 1000);
            return subProblemKey === problemKey && 
                   sub.verdict === 'OK' && 
                   submissionTime > duel.battleDetails.startTime;
        });

        const opponentAccepted = opponentSubmissions.data.result?.find(sub => {
            const subProblemKey = `${sub.problem.contestId}${sub.problem.index}`;
            const submissionTime = new Date(sub.creationTimeSeconds * 1000);
            return subProblemKey === problemKey && 
                   sub.verdict === 'OK' && 
                   submissionTime > duel.battleDetails.startTime;
        });

        if (challengerAccepted && opponentAccepted) {
            const challengerTime = new Date(challengerAccepted.creationTimeSeconds * 1000);
            const opponentTime = new Date(opponentAccepted.creationTimeSeconds * 1000);
            return challengerTime < opponentTime ? duel.challenger._id : duel.opponent._id;
        } else if (challengerAccepted) {
            return duel.challenger._id;
        } else if (opponentAccepted) {
            return duel.opponent._id;
        }

        return null; 
    } catch (error) {
        console.error('Error checking for winner:', error);
        return null;
    }
};

exports.startCleanupService = () => {
    setInterval(cleanupExpiredDuels, 60 * 1000);
    console.log('Duel cleanup service started');
};
