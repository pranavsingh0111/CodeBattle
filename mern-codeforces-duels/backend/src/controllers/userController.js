const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.register = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        const savedUser = await newUser.save();
        
        console.log('User registered successfully:', savedUser.username);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt for username:', username);
        
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found, checking password...');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful for user:', username);
        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
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

        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${user.codeforcesId}`);
        
        if (response.data.status === 'OK' && response.data.result.length > 0) {
            const userInfo = response.data.result[0];
            const oldRating = user.rating;
            const newRating = userInfo.rating || null;
            
            user.rating = newRating;
            await user.save();

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
        } else {
            res.status(404).json({ message: 'Codeforces user not found' });
        }
    } catch (error) {
        console.error('Rating sync error:', error);
        res.status(500).json({ message: 'Error syncing rating', error: error.message });
    }
};

const syncUserRating = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.isCodeforcesVerified || !user.codeforcesId) {
            return null;
        }

        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${user.codeforcesId}`);
        
        if (response.data.status === 'OK' && response.data.result.length > 0) {
            const userInfo = response.data.result[0];
            const newRating = userInfo.rating || null;
            
            if (user.rating !== newRating) {
                user.rating = newRating;
                await user.save();
                console.log(`Updated rating for ${user.username}: ${user.rating} -> ${newRating}`);
            }
            
            return newRating;
        }
    } catch (error) {
        console.error(`Error syncing rating for user ${userId}:`, error.message);
    }
    return null;
};

exports.getUserStats = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).populate('friends');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isCodeforcesVerified && user.codeforcesId) {
            syncUserRating(userId).catch(error => {
                console.log('Background rating sync failed:', error.message);
            });
        }

        const Duel = require('../models/Duel');
        const userDuels = await Duel.find({
            $or: [{ challenger: userId }, { opponent: userId }],
            status: { $in: ['completed', 'draw'] }
        });

        const wins = userDuels.filter(duel => 
            duel.status === 'completed' && duel.result.winner && duel.result.winner.toString() === userId
        ).length;

        const losses = userDuels.filter(duel => 
            duel.status === 'completed' && duel.result.winner && duel.result.winner.toString() !== userId
        ).length;

        const draws = userDuels.filter(duel => duel.status === 'draw').length;
        const totalDuels = userDuels.length;
        const activeDuels = await Duel.countDocuments({
            $or: [{ challenger: userId }, { opponent: userId }],
            status: 'active'
        });

        const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;

        const stats = {
            codeforcesId: user.codeforcesId || 'Not synced',
            rating: user.rating || null,
            points: user.points || 0,
            friendsCount: user.friends.length,
            totalDuels,
            activeDuels,
            wins,
            losses,
            draws,
            winRate,
            lastRatingSync: user.updatedAt
        };

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
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!friend) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'This user is not in your friends list' });
        }

        user.friends = user.friends.filter(friend => friend.toString() !== friendId);
        friend.friends = friend.friends.filter(friendUserId => friendUserId.toString() !== userId);

        await user.save();
        await friend.save();

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
        const currentUser = await User.findById(currentUserId);
        if (!currentUser.isCodeforcesVerified) {
            return res.status(403).json({ 
                message: 'You must verify your Codeforces account before adding friends.',
                requiresVerification: true 
            });
        }

        if (!username || username.trim().length < 2) {
            return res.status(400).json({ message: 'Username must be at least 2 characters long' });
        }

        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: currentUserId },
            isCodeforcesVerified: true 
        }).select('username codeforcesId').limit(10);

        res.status(200).json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};

exports.addFriend = async (req, res) => {
    const { friendId } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isCodeforcesVerified) {
            return res.status(403).json({ 
                message: 'You must verify your Codeforces account before adding friends.',
                requiresVerification: true 
            });
        }

        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: 'User to add as friend not found' });
        }

        if (!friend.isCodeforcesVerified) {
            return res.status(403).json({ 
                message: 'This user has not verified their Codeforces account yet. They cannot be added as a friend.',
                friendNotVerified: true 
            });
        }

        if (user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'User is already your friend' });
        }

        if (user.sentFriendRequests.includes(friendId)) {
            return res.status(400).json({ message: 'Friend request already sent to this user' });
        }

        if (user.receivedFriendRequests.includes(friendId)) {
            return res.status(400).json({ message: 'This user has already sent you a friend request. Check your pending requests.' });
        }

        user.sentFriendRequests.push(friendId);
        await user.save();

        friend.receivedFriendRequests.push(userId);
        await friend.save();

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
        res.status(500).json({ message: 'Error sending friend request', error: error.message });
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
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.receivedFriendRequests.includes(requesterId)) {
            return res.status(400).json({ message: 'No friend request found from this user' });
        }

        user.receivedFriendRequests = user.receivedFriendRequests.filter(
            id => id.toString() !== requesterId
        );
        requester.sentFriendRequests = requester.sentFriendRequests.filter(
            id => id.toString() !== userId
        );

        user.friends.push(requesterId);
        requester.friends.push(userId);

        await user.save();
        await requester.save();

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
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.receivedFriendRequests.includes(requesterId)) {
            return res.status(400).json({ message: 'No friend request found from this user' });
        }

        user.receivedFriendRequests = user.receivedFriendRequests.filter(
            id => id.toString() !== requesterId
        );
        requester.sentFriendRequests = requester.sentFriendRequests.filter(
            id => id.toString() !== userId
        );

        await user.save();
        await requester.save();

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
        const problemsResponse = await axios.get('https://codeforces.com/api/problemset.problems');
        const problems = problemsResponse.data.result.problems.filter(p => p.rating === 800);
        const randomProblem = problems[Math.floor(Math.random() * problems.length)];
        
        const verificationCode = `CF_VERIFY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const user = await User.findById(userId);
        user.verificationChallenge = {
            codeforcesId,
            problemId: `${randomProblem.contestId}${randomProblem.index}`,
            contestId: randomProblem.contestId,
            index: randomProblem.index,
            verificationCode,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        };
        await user.save();

        res.status(200).json({
            problem: {
                contestId: randomProblem.contestId,
                index: randomProblem.index,
                name: randomProblem.name,
                url: `https://codeforces.com/contest/${randomProblem.contestId}/problem/${randomProblem.index}`
            },
            verificationCode,
            instructions: `Submit a solution to this problem that contains the verification code "${verificationCode}" as a comment in your code. The solution can be in any language and can even result in compilation error.`,
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

        const challenge = user.verificationChallenge;
        
        if (new Date() > challenge.expiresAt) {
            return res.status(400).json({ message: 'Verification challenge has expired. Please start again.' });
        }

        const submissionsResponse = await axios.get(
            `https://codeforces.com/api/user.status?handle=${challenge.codeforcesId}&from=1&count=20`
        );

        if (submissionsResponse.data.status !== 'OK') {
            return res.status(400).json({ message: 'Unable to fetch submissions from Codeforces.' });
        }

        const submissions = submissionsResponse.data.result;
        
        const verificationSubmission = submissions.find(sub => {
            const problemMatch = sub.problem.contestId === challenge.contestId && 
                                sub.problem.index === challenge.index;
            const timeMatch = new Date(sub.creationTimeSeconds * 1000) > challenge.createdAt;
            
            return problemMatch && timeMatch;
        });

        if (!verificationSubmission) {
            return res.status(400).json({ 
                message: 'No submission found for the challenge problem. Please submit your solution and try again.',
                hint: 'Make sure to submit to the correct problem after starting the verification process.'
            });
        }

        let userRating = null;
        try {
            const userInfoResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${challenge.codeforcesId}`);
            if (userInfoResponse.data.status === 'OK' && userInfoResponse.data.result.length > 0) {
                userRating = userInfoResponse.data.result[0].rating || null;
            }
        } catch (ratingError) {
            console.log('Could not fetch user rating, proceeding without it');
        }

        user.codeforcesId = challenge.codeforcesId;
        user.rating = userRating;
        user.isCodeforcesVerified = true;
        user.verificationChallenge = undefined; 
        await user.save();

        res.status(200).json({ 
            message: 'Codeforces account verified and synced successfully!',
            codeforcesId: challenge.codeforcesId,
            rating: userRating
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
        
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${codeforcesId.trim()}`);
        
        if (response.data.status === 'OK' && response.data.result.length > 0) {
            const userInfo = response.data.result[0];
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
        } else {
            res.status(404).json({ message: 'Codeforces user not found' });
        }
    } catch (error) {
        console.error('Codeforces validation error:', error.message);
        
        if (error.response && error.response.status === 400) {
            res.status(404).json({ message: 'Codeforces user not found' });
        } else {
            res.status(500).json({ message: 'Error validating Codeforces ID', error: error.message });
        }
    }
};

module.exports.syncUserRating = syncUserRating;