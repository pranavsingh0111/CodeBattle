import React, { useEffect, useState } from 'react';
import { getUserDuels } from '../../utils/api';

const DuelList = () => {
    const [duels, setDuels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDuels();
    }, []);

    const fetchDuels = async () => {
        try {
            setLoading(true);
            const response = await getUserDuels();
            setDuels(response || []);
            setError('');
        } catch (err) {
            console.error('Error fetching duels:', err);
            setError('Error loading duels list.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'active': return '⚔️';
            case 'completed': return '✅';
            case 'expired': return '❌';
            case 'draw': return '🤝';
            default: return '❓';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#ffc107';
            case 'active': return '#ff6b6b';
            case 'completed': return '#28a745';
            case 'expired': return '#dc3545';
            case 'draw': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return <div className="loading">Loading duels...</div>;
    }

    return (
        <div className="duel-list-container">
            <h3>🏆 Your Duel History ({duels.length})</h3>
            
            {error && <div className="message error">{error}</div>}
            
            {duels.length === 0 ? (
                <div className="no-duels">
                    <p>No duels yet!</p>
                    <p>Challenge your friends to start dueling.</p>
                </div>
            ) : (
                <div className="duels-grid">
                    {duels.map(duel => (
                        <div key={duel._id} className="duel-card">
                            <div className="duel-card-header">
                                <div className="status-section">
                                    <span 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(duel.status) }}
                                    >
                                        {getStatusIcon(duel.status)} {duel.status.toUpperCase()}
                                    </span>
                                </div>
                                <span className="duel-date">
                                    {new Date(duel.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="participants-section">
                                <div className="participant-row">
                                    <span className="participant-label">Challenger:</span>
                                    <span className="participant-name">{duel.challenger.username}</span>
                                </div>
                                <div className="participant-row">
                                    <span className="participant-label">Opponent:</span>
                                    <span className="participant-name">{duel.opponent.username}</span>
                                </div>
                            </div>
                            
                            <div className="duel-info-section">
                                <div className="info-row">
                                    <span className="info-label">Rating:</span>
                                    <span className="info-value">
                                        {duel.challengeDetails.ratingRange.min} - {duel.challengeDetails.ratingRange.max}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Tags:</span>
                                    <span className="info-value tags-list">
                                        {duel.challengeDetails.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="tag-chip">{tag}</span>
                                        ))}
                                        {duel.challengeDetails.tags.length > 2 && (
                                            <span className="tag-chip more">+{duel.challengeDetails.tags.length - 2}</span>
                                        )}
                                    </span>
                                </div>
                                
                                {duel.result?.winner && (
                                    <div className="info-row">
                                        <span className="info-label">Winner:</span>
                                        <span className="info-value winner">
                                            🏆 {duel.result.winner === duel.challenger._id ? 
                                                duel.challenger.username : duel.opponent.username}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DuelList;