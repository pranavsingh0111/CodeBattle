const User = require('../models/User');
const authService = require('../services/authService');
const codeforcesService = require('../services/codeforcesService');
const friendService = require('../services/friendService');
const userStatsService = require('../services/userStatsService');

exports.register = async (req, res) => {
    const { username, password } = req.body;

    try {
        await authService.register(username, password);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const { token } = await authService.login(username, password);
        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        const statusCode = error.message === 'User not found' ? 404 : 401;
        res.status(statusCode).json({ message: error.message });
    }
};

exports.syncCodeforcesId = async (req, res) => {
    const { codeforcesId } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.codeforcesId = codeforcesId;
        await user.save();
        res.status(200).json({ message: 'Codeforces ID synced successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error syncing Codeforces ID', error });
    }
};

exports.syncCodeforcesRating = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isCodeforcesVerified || !user.codeforcesId) {
            return res.status(400).json({ message: 'Codeforces account not verified or not synced' });
        }

        const oldRating = user.rating;
        const newRating = await codeforcesService.syncUserRating(userId);

        if (newRating === null) {
            return res.status(404).json({ message: 'Codeforces user not found' });
        }

        const ratingChange = newRating && oldRating ? newRating - oldRating : 0;
        const changeMessage = ratingChange > 0 ? `📈 +${ratingChange}` : 
                             ratingChange < 0 ? `📉 ${ratingChange}` : '📊 No change';

        res.status(200).json({ 
            message: 'Rating synced successfully!',
            oldRating,
            newRating,
            change: ratingChange,
            changeMessage
        });
    } catch (error) {
        console.error('Rating sync error:', error);
        res.status(500).json({ message: 'Error syncing rating', error: error.message });
    }
};

exports.getUserStats = async (req, res) => {
    const userId = req.user.id;

    try {
        const stats = await userStatsService.getUserStats(userId);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user stats', error: error.message });
    }
};

exports.getFriends = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).populate('friends', 'username codeforcesId');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ data: user.friends });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends', error: error.message });
    }
};

exports.removeFriend = async (req, res) => {
    const { friendId } = req.params;
    const userId = req.user.id;

    try {
        const friend = await friendService.removeFriend(userId, friendId);
        res.status(200).json({ 
            message: `${friend.username} removed from friends successfully` 
        });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ message: 'Error removing friend', error: error.message });
    }
};

exports.getFriendActivities = async (req, res) => {
    try {
        const activities = [
            { message: 'No recent activities', timestamp: new Date() }
        ];
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friend activities', error: error.message });
    }
};

exports.searchUser = async (req, res) => {
    const { username } = req.query;
    const currentUserId = req.user.id;

    try {
        const users = await friendService.searchUsers(username, currentUserId);
        res.status(200).json(users);
    } catch (error) {
        console.error('Search error:', error);
        const statusCode = error.message.includes('verify') ? 403 : 400;
        const response = { message: error.message };
        if (statusCode === 403) response.requiresVerification = true;
        res.status(statusCode).json(response);
    }
};

exports.addFriend = async (req, res) => {
    const { friendId } = req.body;
    const userId = req.user.id;

    try {
        const friend = await friendService.sendFriendRequest(userId, friendId);
        res.status(200).json({ 
            message: `Friend request sent to ${friend.username}!`,
            friend: {
                _id: friend._id,
                username: friend.username,
                codeforcesId: friend.codeforcesId
            }
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        const statusCode = error.message.includes('verify') ? 403 : 400;
        const response = { message: error.message };
        if (error.message.includes('verify')) {
            response.requiresVerification = true;
        }
        res.status(statusCode).json(response);
    }
};

exports.getPendingFriendRequests = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId)
            .populate('receivedFriendRequests', 'username codeforcesId');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ data: user.receivedFriendRequests });
    } catch (error) {
        console.error('Error fetching pending friend requests:', error);
        res.status(500).json({ message: 'Error fetching pending friend requests', error: error.message });
    }
};

exports.acceptFriendRequest = async (req, res) => {
    const { requesterId } = req.params;
    const userId = req.user.id;

    try {
        const requester = await friendService.acceptFriendRequest(userId, requesterId);
        res.status(200).json({ 
            message: `${requester.username} added as friend successfully!`,
            friend: {
                _id: requester._id,
                username: requester.username,
                codeforcesId: requester.codeforcesId
            }
        });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ message: 'Error accepting friend request', error: error.message });
    }
};

exports.rejectFriendRequest = async (req, res) => {
    const { requesterId } = req.params;
    const userId = req.user.id;

    try {
        const requester = await friendService.rejectFriendRequest(userId, requesterId);
        res.status(200).json({ 
            message: `Friend request from ${requester.username} rejected`
        });
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ message: 'Error rejecting friend request', error: error.message });
    }
};

exports.generateVerificationChallenge = async (req, res) => {
    const { codeforcesId } = req.body;
    const userId = req.user.id;

    try {
        const challenge = await codeforcesService.generateVerificationChallenge(codeforcesId);
        
        const user = await User.findById(userId);
        user.verificationChallenge = challenge;
        await user.save();

        res.status(200).json({
            problem: {
                contestId: challenge.problem.contestId,
                index: challenge.problem.index,
                name: challenge.problem.name,
                url: `https://codeforces.com/contest/${challenge.problem.contestId}/problem/${challenge.problem.index}`
            },
            verificationCode: challenge.verificationCode,
            instructions: `Submit a solution to this problem that contains the verification code "${challenge.verificationCode}" as a comment in your code. The solution can be in any language and can even result in compilation error.`,
            expiresIn: 5 
        });
    } catch (error) {
        console.error('Error generating verification challenge:', error);
        res.status(500).json({ message: 'Error generating verification challenge', error: error.message });
    }
};

exports.verifyCodeforcesOwnership = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        
        if (!user.verificationChallenge) {
            return res.status(400).json({ message: 'No verification challenge found. Please start verification process first.' });
        }

        const result = await codeforcesService.verifyOwnership(user.verificationChallenge);

        user.codeforcesId = result.codeforcesId;
        user.rating = result.rating;
        user.isCodeforcesVerified = true;
        user.verificationChallenge = undefined; 
        await user.save();

        res.status(200).json({ 
            message: 'Codeforces account verified and synced successfully!',
            codeforcesId: result.codeforcesId,
            rating: result.rating
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Error during verification process', error: error.message });
    }
};

exports.validateCodeforcesId = async (req, res) => {
    const { codeforcesId } = req.body;

    try {
        if (!codeforcesId || codeforcesId.trim().length === 0) {
            return res.status(400).json({ message: 'Codeforces ID is required' });
        }

        console.log('Validating Codeforces ID:', codeforcesId);
        
        const userInfo = await codeforcesService.validateUser(codeforcesId);
        console.log('Codeforces user found:', userInfo.handle);
        
        const userId = req.user.id;
        await User.findByIdAndUpdate(userId, {
            rating: userInfo.rating || null,
            updatedAt: new Date()
        });
        
        res.status(200).json({
            handle: userInfo.handle,
            rating: userInfo.rating || null,
            maxRating: userInfo.maxRating || null,
            rank: userInfo.rank || null,
            maxRank: userInfo.maxRank || null,
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || ''
        });
    } catch (error) {
        console.error('Codeforces validation error:', error.message);
        res.status(404).json({ message: 'Codeforces user not found' });
    }
};

module.exports.syncUserRating = codeforcesService.syncUserRating;