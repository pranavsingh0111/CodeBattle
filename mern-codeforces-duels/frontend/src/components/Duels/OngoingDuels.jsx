import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getUserDuels } from '../../utils/api';

const OngoingDuels = () => {
    const history = useHistory();
    const [activeDuels, setActiveDuels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchActiveDuels();
    }, []);

    const fetchActiveDuels = async () => {
        try {
            setLoading(true);
            const duels = await getUserDuels();
            // Filter only active duels
            const active = duels.filter(duel => duel.status === 'active');
            setActiveDuels(active);
            setError('');
        } catch (err) {
            console.error('Error fetching active duels:', err);
            setError('Error loading ongoing duels');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinBattle = (duelId) => {
        history.push(`/battle/${duelId}`);
    };

    const formatTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        
        if (remaining === 0) {
            return 'Time expired';
        }
        
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <div className="loading">Loading ongoing duels...</div>;
    }

    return (
        <div className="ongoing-duels-container">
            <h3>⚔️ Ongoing Duels ({activeDuels.length})</h3>
            
            {error && (
                <div className="message error">{error}</div>
            )}

            {activeDuels.length === 0 ? (
                <div className="no-ongoing-duels">
                    <p>🕊️ No ongoing duels</p>
                    <p>Challenge your friends to start a new duel!</p>
                </div>
            ) : (
                <div className="ongoing-duels-list">
                    {activeDuels.map((duel) => (
                        <div key={duel._id} className="ongoing-duel-card">
                            <div className="duel-header">
                                <h4>⚡ Battle in Progress</h4>
                                <span className="battle-time">
                                    ⏰ {formatTimeRemaining(duel.battleDetails.endTime)}
                                </span>
                            </div>
                            
                            <div className="battle-participants">
                                <div className="participant-info">
                                    <span className="participant-name">{duel.challenger.username}</span>
                                    <span className="vs-text">VS</span>
                                    <span className="participant-name">{duel.opponent.username}</span>
                                </div>
                            </div>

                            <div className="battle-details">
                                <div className="detail-row">
                                    <span className="detail-label">Problem:</span>
                                    <span className="detail-value">{duel.challengeDetails.selectedProblem?.name || 'Loading...'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Rating:</span>
                                    <span className="detail-value">{duel.challengeDetails.selectedProblem?.rating || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Started:</span>
                                    <span className="detail-value">
                                        {new Date(duel.battleDetails.startTime).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            <div className="battle-actions">
                                <button 
                                    onClick={() => handleJoinBattle(duel._id)}
                                    className="join-battle-btn"
                                >
                                    🎯 Enter Battle Arena
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OngoingDuels;
