import React, { useState, useEffect } from 'react';
import { getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../../utils/api';

const PendingFriendRequests = ({ onRequestHandled }) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const response = await getPendingFriendRequests();
            setPendingRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            setMessage('❌ Error loading pending friend requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requesterId, username) => {
        setActionLoading(prev => ({ ...prev, [requesterId]: 'accepting' }));
        try {
            await acceptFriendRequest(requesterId);
            setMessage(`✅ ${username} added as friend!`);
            fetchPendingRequests();
            if (onRequestHandled) onRequestHandled();
        } catch (error) {
            setMessage('❌ Error accepting friend request: ' + (error.response?.data?.message || 'Please try again'));
        } finally {
            setActionLoading(prev => ({ ...prev, [requesterId]: null }));
        }
    };

    const handleReject = async (requesterId, username) => {
        setActionLoading(prev => ({ ...prev, [requesterId]: 'rejecting' }));
        try {
            await rejectFriendRequest(requesterId);
            setMessage(`🚫 Friend request from ${username} rejected`);
            fetchPendingRequests();
        } catch (error) {
            setMessage('❌ Error rejecting friend request: ' + (error.response?.data?.message || 'Please try again'));
        } finally {
            setActionLoading(prev => ({ ...prev, [requesterId]: null }));
        }
    };

    if (loading) {
        return <div className="loading">Loading friend requests...</div>;
    }

    return (
        <div className="pending-requests-container">
            <h3>📨 Friend Requests ({pendingRequests.length})</h3>
            
            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {pendingRequests.length === 0 ? (
                <div className="no-pending-requests">
                    <p>📭 No pending friend requests</p>
                    <p>When someone sends you a friend request, it will appear here.</p>
                </div>
            ) : (
                <div className="pending-requests-list">
                    {pendingRequests.map((request) => (
                        <div key={request._id} className="request-card">
                            <div className="request-info">
                                <h4 className="request-username">{request.username}</h4>
                                <span className="request-codeforces verified">
                                    ✅ {request.codeforcesId}
                                </span>
                            </div>
                            <div className="request-actions">
                                <button
                                    onClick={() => handleAccept(request._id, request.username)}
                                    disabled={actionLoading[request._id]}
                                    className="accept-request-btn"
                                >
                                    {actionLoading[request._id] === 'accepting' ? '⏳' : '✅ Accept'}
                                </button>
                                <button
                                    onClick={() => handleReject(request._id, request.username)}
                                    disabled={actionLoading[request._id]}
                                    className="reject-request-btn"
                                >
                                    {actionLoading[request._id] === 'rejecting' ? '⏳' : '🚫 Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingFriendRequests;
