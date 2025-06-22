const calculatePoints = (winnerRating, loserRating) => {
    const defaultRating = 1200;
    const actualWinnerRating = winnerRating || defaultRating;
    const actualLoserRating = loserRating || defaultRating;
    
    const basePoints = 50;
    
    const ratingDiff = actualLoserRating - actualWinnerRating;
    
    const kFactor = 32;
    
    const expectedWinnerScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
    const expectedLoserScore = 1 - expectedWinnerScore;
    
    const winnerPoints = Math.round(basePoints + (kFactor * (1 - expectedWinnerScore)));
    const loserPoints = Math.round(basePoints * expectedLoserScore);
    
    const minPoints = 5;
    const maxPoints = 100;
    
    const finalWinnerPoints = Math.max(minPoints, Math.min(maxPoints, winnerPoints));
    const finalLoserPoints = Math.max(minPoints, Math.min(maxPoints, loserPoints));
    
    return {
        winnerGains: finalWinnerPoints,
        loserLoses: finalLoserPoints,
        ratingDifference: ratingDiff,
        upset: ratingDiff > 200 
    };
};

const calculateDrawPoints = (player1Rating, player2Rating) => {
    const defaultRating = 1200;
    const actualPlayer1Rating = player1Rating || defaultRating;
    const actualPlayer2Rating = player2Rating || defaultRating;
    
    const baseDrawPoints = 15;
    
    const ratingDiff = Math.abs(actualPlayer1Rating - actualPlayer2Rating);
    const bonus = Math.min(10, Math.floor(ratingDiff / 100));
    
    let player1Points = baseDrawPoints;
    let player2Points = baseDrawPoints;
    
    if (actualPlayer1Rating < actualPlayer2Rating) {
        player1Points += bonus;
    } else if (actualPlayer2Rating < actualPlayer1Rating) {
        player2Points += bonus;
    }
    
    return {
        player1Points,
        player2Points
    };
};

const getBonusMessage = (pointsResult) => {
    if (pointsResult.upset) {
        return `🎉 UPSET VICTORY! Bonus points for beating a higher-rated opponent!`;
    } else if (pointsResult.ratingDifference < -200) {
        return `💪 Expected victory against lower-rated opponent.`;
    } else {
        return `⚔️ Well-fought duel!`;
    }
};

module.exports = {
    calculatePoints,
    calculateDrawPoints,
    getBonusMessage
};
