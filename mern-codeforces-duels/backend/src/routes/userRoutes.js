const express = require('express');
const { register, login, addFriend, removeFriend, syncCodeforcesId, getFriends, getUserStats, getFriendActivities, searchUser, validateCodeforcesId, generateVerificationChallenge, verifyCodeforcesOwnership, getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest, syncCodeforcesRating } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/search', authMiddleware, searchUser);
router.post('/friends', authMiddleware, addFriend);
router.get('/friends', authMiddleware, getFriends);
router.delete('/friends/:friendId', authMiddleware, removeFriend);
router.get('/friends/requests', authMiddleware, getPendingFriendRequests);
router.post('/friends/requests/:requesterId/accept', authMiddleware, acceptFriendRequest);
router.post('/friends/requests/:requesterId/reject', authMiddleware, rejectFriendRequest);
router.post('/sync', authMiddleware, syncCodeforcesId);
router.post('/sync-rating', authMiddleware, syncCodeforcesRating);
router.get('/stats', authMiddleware, getUserStats);
router.get('/friends/activities', authMiddleware, getFriendActivities);
router.post('/validate-codeforces', authMiddleware, validateCodeforcesId);
router.post('/generate-verification', authMiddleware, generateVerificationChallenge);
router.post('/verify-ownership', authMiddleware, verifyCodeforcesOwnership);

module.exports = router;