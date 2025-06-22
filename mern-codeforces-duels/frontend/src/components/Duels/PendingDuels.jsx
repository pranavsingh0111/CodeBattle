import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getPendingDuels, acceptDuel, rejectDuel } from '../../utils/api';

const PendingDuels = () => {
    const history = useHistory();
    const [pendingDuels, setPendingDuels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPendingDuels();
    }, []);

    const fetchPendingDuels = async () => {
        try {
            setLoading(true);
            const duels = await getPendingDuels();
            setPendingDuels(duels);
        } catch (error) {
            console.error('Error fetching pending duels:', error);
            setMessage('❌ Error loading pending duels');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (duelId) => {
        setActionLoading(prev => ({ ...prev, [duelId]: 'accepting' }));
        try {
            await acceptDuel(duelId);
            setMessage('✅ Duel accepted! Redirecting to battle...');
            
            // Redirect to battle page
            setTimeout(() => {
                history.push(`/battle/${duelId}`);
            }, 1500);
            
            fetchPendingDuels(); // Refresh the list
        } catch (error) {
            setMessage('❌ Error accepting duel: ' + (error.response?.data?.message || 'Please try again'));
        } finally {
            setActionLoading(prev => ({ ...prev, [duelId]: null }));
        }
    };

    const handleReject = async (duelId) => {
        setActionLoading(prev => ({ ...prev, [duelId]: 'rejecting' }));
        try {
            await rejectDuel(duelId);
            setMessage('🚫 Duel rejected');
            fetchPendingDuels(); // Refresh the list
        } catch (error) {
            setMessage('❌ Error rejecting duel: ' + (error.response?.data?.message || 'Please try again'));
        } finally {
            setActionLoading(prev => ({ ...prev, [duelId]: null }));
        }
    };

    if (loading) {
        return <div className="loading">Loading pending duels...</div>;
    }

    return (
        <div className="pending-duels-container">
            <h3>📨 Pending Duel Requests ({pendingDuels.length})</h3>
            
            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {pendingDuels.length === 0 ? (
                <div className="no-pending-duels">
                    <p>📭 No pending duel requests</p>
                    <p>When someone challenges you, their requests will appear here.</p>
                </div>
            ) : (
                <div className="pending-duels-list">
                    {pendingDuels.map((duel) => (
                        <div key={duel._id} className="pending-duel-card">
                            <div className="duel-header">
                                <h4>⚔️ Challenge from {duel.challenger.username}</h4>
                                <span className="challenge-time">
                                    {new Date(duel.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="duel-details">
                                <div className="detail-item">
                                    <span className="detail-label">Challenger:</span>
                                    <span className="detail-value">
                                        {duel.challenger.username} ({duel.challenger.codeforcesId})
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Rating Range:</span>
                                    <span className="detail-value">
                                        {duel.challengeDetails.ratingRange.min} - {duel.challengeDetails.ratingRange.max}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Tags:</span>
                                    <span className="detail-value tags">
                                        {duel.challengeDetails.tags.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </span>
                                </div>
                            </div>

                            <div className="duel-actions">
                                <button
                                    onClick={() => handleAccept(duel._id)}
                                    disabled={actionLoading[duel._id]}
                                    className="accept-btn"
                                >
                                    {actionLoading[duel._id] === 'accepting' ? '⏳ Accepting...' : '✅ Accept Challenge'}
                                </button>
                                <button
                                    onClick={() => handleReject(duel._id)}
                                    disabled={actionLoading[duel._id]}
                                    className="reject-btn"
                                >
                                    {actionLoading[duel._id] === 'rejecting' ? '⏳ Rejecting...' : '🚫 Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingDuels;
