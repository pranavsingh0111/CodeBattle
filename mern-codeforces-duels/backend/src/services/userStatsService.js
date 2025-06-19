const User = require('../models/User');
const Duel = require('../models/Duel');
const codeforcesService = require('./codeforcesService');

class UserStatsService {
    async getUserStats(userId) {
        const user = await User.findById(userId).populate('friends');
        if (!user) {
            throw new Error('User not found');
        }

        if (user.isCodeforcesVerified && user.codeforcesId) {
            codeforcesService.syncUserRating(userId).catch(error => {
                console.log('Background rating sync failed:', error.message);
            });
        }

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

        return {
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
    }
}

module.exports = new UserStatsService();
