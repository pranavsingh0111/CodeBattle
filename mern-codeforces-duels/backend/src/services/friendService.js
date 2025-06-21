const User = require('../models/User');

class FriendService {
    async searchUsers(username, currentUserId) {
        const currentUser = await User.findById(currentUserId);
        if (!currentUser.isCodeforcesVerified) {
            throw new Error('You must verify your Codeforces account before adding friends.');
        }

        if (!username || username.trim().length < 2) {
            throw new Error('Username must be at least 2 characters long');
        }

        return await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: currentUserId },
            isCodeforcesVerified: true 
        }).select('username codeforcesId').limit(10);
    }

    async sendFriendRequest(userId, friendId) {
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            throw new Error('User not found');
        }

        if (!user.isCodeforcesVerified) {
            throw new Error('You must verify your Codeforces account before adding friends.');
        }

        if (!friend.isCodeforcesVerified) {
            throw new Error('This user has not verified their Codeforces account yet. They cannot be added as a friend.');
        }

        if (user.friends.includes(friendId)) {
            throw new Error('User is already your friend');
        }

        if (user.sentFriendRequests.includes(friendId)) {
            throw new Error('Friend request already sent to this user');
        }

        if (user.receivedFriendRequests.includes(friendId)) {
            throw new Error('This user has already sent you a friend request. Check your pending requests.');
        }

        user.sentFriendRequests.push(friendId);
        await user.save();

        friend.receivedFriendRequests.push(userId);
        await friend.save();

        return friend;
    }

    async acceptFriendRequest(userId, requesterId) {
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) {
            throw new Error('User not found');
        }

        if (!user.receivedFriendRequests.includes(requesterId)) {
            throw new Error('No friend request found from this user');
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

        return requester;
    }

    async rejectFriendRequest(userId, requesterId) {
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) {
            throw new Error('User not found');
        }

        if (!user.receivedFriendRequests.includes(requesterId)) {
            throw new Error('No friend request found from this user');
        }

        user.receivedFriendRequests = user.receivedFriendRequests.filter(
            id => id.toString() !== requesterId
        );
        requester.sentFriendRequests = requester.sentFriendRequests.filter(
            id => id.toString() !== userId
        );

        await user.save();
        await requester.save();

        return requester;
    }

    async removeFriend(userId, friendId) {
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            throw new Error('User not found');
        }

        if (!user.friends.includes(friendId)) {
            throw new Error('This user is not in your friends list');
        }

        user.friends = user.friends.filter(friend => friend.toString() !== friendId);
        friend.friends = friend.friends.filter(friendUserId => friendUserId.toString() !== userId);

        await user.save();
        await friend.save();

        return friend;
    }
}

module.exports = new FriendService();
