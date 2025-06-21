const User = require('../models/User');
const { syncUserRating } = require('../controllers/userController');

const syncAllUsersRatings = async () => {
    try {
        console.log('Starting bulk rating sync...');
        
        const verifiedUsers = await User.find({
            isCodeforcesVerified: true,
            codeforcesId: { $ne: null }
        }).select('_id username codeforcesId');

        console.log(`Found ${verifiedUsers.length} verified users to sync`);
        
        const batchSize = 5;
        for (let i = 0; i < verifiedUsers.length; i += batchSize) {
            const batch = verifiedUsers.slice(i, i + batchSize);
            
            await Promise.all(
                batch.map(async (user) => {
                    try {
                        await syncUserRating(user._id);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.error(`Failed to sync rating for ${user.username}:`, error.message);
                    }
                })
            );
            
            if (i + batchSize < verifiedUsers.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('Bulk rating sync completed');
    } catch (error) {
        console.error('Error in bulk rating sync:', error);
    }
};

const startRatingScheduler = () => {
    setInterval(syncAllUsersRatings, 6 * 60 * 60 * 1000);

    setTimeout(syncAllUsersRatings, 60 * 1000);
    
    console.log('Rating sync scheduler started - will sync every 6 hours');
};

module.exports = {
    startRatingScheduler,
    syncAllUsersRatings
};
