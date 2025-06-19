const axios = require('axios');
const User = require('../models/User');

class CodeforcesService {
    async validateUser(codeforcesId) {
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${codeforcesId.trim()}`);
        
        if (response.data.status === 'OK' && response.data.result.length > 0) {
            return response.data.result[0];
        }
        throw new Error('Codeforces user not found');
    }

    async syncUserRating(userId) {
        const user = await User.findById(userId);
        if (!user || !user.isCodeforcesVerified || !user.codeforcesId) {
            return null;
        }

        try {
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
    }

    async generateVerificationChallenge(codeforcesId) {
        const problemsResponse = await axios.get('https://codeforces.com/api/problemset.problems');
        const problems = problemsResponse.data.result.problems.filter(p => p.rating === 800);
        const randomProblem = problems[Math.floor(Math.random() * problems.length)];
        
        const verificationCode = `CF_VERIFY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            codeforcesId,
            problemId: `${randomProblem.contestId}${randomProblem.index}`,
            contestId: randomProblem.contestId,
            index: randomProblem.index,
            verificationCode,
            problem: randomProblem,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        };
    }

    async verifyOwnership(challenge) {
        if (new Date() > challenge.expiresAt) {
            throw new Error('Verification challenge has expired. Please start again.');
        }

        const submissionsResponse = await axios.get(
            `https://codeforces.com/api/user.status?handle=${challenge.codeforcesId}&from=1&count=20`
        );

        if (submissionsResponse.data.status !== 'OK') {
            throw new Error('Unable to fetch submissions from Codeforces.');
        }

        const submissions = submissionsResponse.data.result;
        const verificationSubmission = submissions.find(sub => {
            const problemMatch = sub.problem.contestId === challenge.contestId && 
                                sub.problem.index === challenge.index;
            const timeMatch = new Date(sub.creationTimeSeconds * 1000) > challenge.createdAt;
            
            return problemMatch && timeMatch;
        });

        if (!verificationSubmission) {
            throw new Error('No submission found for the challenge problem. Please submit your solution and try again.');
        }

        // Get user rating
        let userRating = null;
        try {
            const userInfoResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${challenge.codeforcesId}`);
            if (userInfoResponse.data.status === 'OK' && userInfoResponse.data.result.length > 0) {
                userRating = userInfoResponse.data.result[0].rating || null;
            }
        } catch (ratingError) {
            console.log('Could not fetch user rating, proceeding without it');
        }

        return { codeforcesId: challenge.codeforcesId, rating: userRating };
    }
}

module.exports = new CodeforcesService();