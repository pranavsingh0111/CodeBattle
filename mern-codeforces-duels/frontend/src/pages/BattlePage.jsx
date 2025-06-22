import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getActiveDuel, offerDraw, respondToDrawOffer, withdrawDrawOffer, checkSubmissionStatus } from '../utils/api';

const BattlePage = () => {
    const { duelId } = useParams();
    const history = useHistory();
    const [duel, setDuel] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    // Get current user ID from token or store it when logging in
    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.id;
            } catch (error) {
                console.error('Error parsing token:', error);
                return null;
            }
        }
        return null;
    };
    
    const [currentUserId] = useState(getCurrentUserId());

    const fetchDuelDetails = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await getActiveDuel(duelId);
            setDuel(response);
            
            if (response.status === 'completed' || response.status === 'draw') {
                setMessage(getEndMessage(response));
            }
        } catch (error) {
            console.error('Error fetching duel details:', error);
            setMessage('❌ Error loading duel details');
        } finally {
            setLoading(false);
        }
    }, [duelId]);

    const checkStatus = React.useCallback(async () => {
        try {
            const response = await checkSubmissionStatus(duelId);
            if (response.winner) {
                setDuel(response.duel);
                setMessage(getEndMessage(response.duel));
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    }, [duelId]);

    useEffect(() => {
        fetchDuelDetails();
        const interval = setInterval(() => {
            fetchDuelDetails();
            checkStatus();
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [fetchDuelDetails, checkStatus]);

    useEffect(() => {
        if (duel && duel.status === 'active') {
            const timer = setInterval(() => {
                const now = new Date();
                const endTime = new Date(duel.battleDetails.endTime);
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
                setTimeRemaining(remaining);

                if (remaining === 0) {
                    fetchDuelDetails(); // Refresh to get updated status
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [duel, fetchDuelDetails]);

    const handleOfferDraw = async () => {
        try {
            await offerDraw(duelId);
            setMessage('✅ Draw offer sent to your opponent');
            fetchDuelDetails();
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.message || 'Error offering draw'));
        }
    };

    const handleRespondToDraw = async (action) => {
        try {
            const response = await respondToDrawOffer(duelId, action);
            setMessage('✅ ' + response.message);
            fetchDuelDetails();
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.message || 'Error responding to draw'));
        }
    };

    const handleWithdrawDraw = async () => {
        try {
            const response = await withdrawDrawOffer(duelId);
            setMessage('✅ ' + response.message);
            fetchDuelDetails();
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.message || 'Error withdrawing draw'));
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getEndMessage = (duelData) => {
        if (duelData.status === 'draw') {
            return '🤝 Duel ended in a draw!';
        } else if (duelData.status === 'completed') {
            if (duelData.result.winCondition === 'timeout') {
                return '⏰ Time expired! Duel ended without a winner.';
            } else if (duelData.result.winner) {
                const winner = duelData.result.winner === duelData.challenger._id ? 
                    duelData.challenger.username : duelData.opponent.username;
                return `🏆 ${winner} won the duel!`;
            }
        }
        return '';
    };

    const isCurrentUserOfferer = duel?.battleDetails?.drawOffer?.offeredBy === currentUserId;
    const canRespondToDraw = duel?.battleDetails?.drawOffer?.status === 'pending' && !isCurrentUserOfferer;
    const canWithdrawDraw = duel?.battleDetails?.drawOffer?.status === 'pending' && isCurrentUserOfferer;

    if (loading) {
        return <div className="loading">Loading battle details...</div>;
    }

    if (!duel) {
        return (
            <div className="error">
                <h2>❌ Duel not found</h2>
                <p>This duel may have expired or been deleted.</p>
                <button onClick={() => history.push('/dashboard')} className="back-to-dashboard-btn">
                    🏠 Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="battle-page">
            {/* Show a welcome message for newly started duels */}
            {duel.status === 'active' && !message && (
                <div className="battle-message success">
                    🎉 Welcome to the battle arena! The duel has begun!
                </div>
            )}
            
            <div className="battle-header">
                <h1>⚔️ Battle Arena</h1>
                <div className="participants">
                    <span className="participant">{duel.challenger.username}</span>
                    <span className="vs">VS</span>
                    <span className="participant">{duel.opponent.username}</span>
                </div>
            </div>

            {duel.status === 'active' && (
                <div className="battle-timer">
                    <h2>⏰ Time Remaining: {formatTime(timeRemaining)}</h2>
                    {timeRemaining < 300 && ( // Less than 5 minutes
                        <p className="time-warning">⚠️ Less than 5 minutes remaining!</p>
                    )}
                </div>
            )}

            {message && (
                <div className={`battle-message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {duel.status === 'active' && duel.challengeDetails.selectedProblem && (
                <div className="problem-section">
                    <h3>🧩 Problem to Solve</h3>
                    <div className="problem-card">
                        <h4>{duel.challengeDetails.selectedProblem.name}</h4>
                        <p><strong>Rating:</strong> {duel.challengeDetails.selectedProblem.rating}</p>
                        <p><strong>Contest:</strong> {duel.challengeDetails.selectedProblem.contestId}</p>
                        <a 
                            href={duel.challengeDetails.selectedProblem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="problem-link"
                        >
                            🔗 Solve Problem ({duel.challengeDetails.selectedProblem.contestId}{duel.challengeDetails.selectedProblem.index})
                        </a>
                    </div>

                    <div className="battle-instructions">
                        <h4>📝 Instructions:</h4>
                        <ul>
                            <li>🎯 Click the link above to solve the problem on Codeforces</li>
                            <li>⚡ First to get an "Accepted" verdict wins!</li>
                            <li>🤝 You can offer a draw at any time</li>
                            <li>⏰ Duel ends automatically after 1 hour</li>
                        </ul>
                    </div>
                </div>
            )}

            {duel.status === 'active' && (
                <div className="battle-controls">
                    {!duel.battleDetails.drawOffer && (
                        <button onClick={handleOfferDraw} className="offer-draw-btn">
                            🤝 Offer Draw
                        </button>
                    )}

                    {canRespondToDraw && (
                        <div className="draw-response">
                            <p>🤝 Your opponent has offered a draw</p>
                            <div className="draw-actions">
                                <button 
                                    onClick={() => handleRespondToDraw('accept')}
                                    className="accept-draw-btn"
                                >
                                    ✅ Accept Draw
                                </button>
                                <button 
                                    onClick={() => handleRespondToDraw('reject')}
                                    className="reject-draw-btn"
                                >
                                    ❌ Reject Draw
                                </button>
                            </div>
                        </div>
                    )}

                    {canWithdrawDraw && (
                        <div className="draw-pending">
                            <p>🤝 Draw offer pending...</p>
                            <button onClick={handleWithdrawDraw} className="withdraw-draw-btn">
                                🔄 Withdraw Offer
                            </button>
                        </div>
                    )}
                </div>
            )}

            {(duel.status === 'completed' || duel.status === 'draw') && (
                <div className="battle-ended">
                    <h3>🎭 Battle Ended</h3>
                    <button 
                        onClick={() => history.push('/dashboard')}
                        className="back-to-dashboard-btn"
                    >
                        🏠 Back to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default BattlePage;
