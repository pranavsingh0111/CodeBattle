import React, { useEffect, useState } from 'react';
import { getFriends, removeFriend } from '../../utils/api';
import PendingFriendRequests from './PendingFriendRequests';

const FriendsList = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const response = await getFriends();
            setFriends(response.data || []);
            setError('');
        } catch (err) {
            console.error('Error fetching friends:', err);
            setError('Error loading friends list.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFriend = async (friendId, friendUsername) => {
        if (!window.confirm(`Are you sure you want to remove ${friendUsername} from your friends?`)) {
            return;
        }

        try {
            await removeFriend(friendId);
            setFriends(friends.filter(friend => friend._id !== friendId));
        } catch (error) {
            console.error('Error removing friend:', error);
            alert('Error removing friend. Please try again.');
        }
    };

    const handleRequestHandled = () => {
        fetchFriends(); // Refresh friends list when a request is handled
    };

    if (loading) {
        return <div className="loading">Loading friends...</div>;
    }

    return (
        <div>
            <PendingFriendRequests onRequestHandled={handleRequestHandled} />
            
            <div className="friends-list-container">
                <h3>👥 Your Friends ({friends.length})</h3>
                
                {error && <div className="message error">{error}</div>}
                
                {friends.length === 0 ? (
                    <div className="no-friends">
                        <p>You don't have any friends yet!</p>
                        <p>Search for verified users above to add them as friends.</p>
                    </div>
                ) : (
                    <div className="friends-grid">
                        {friends.map(friend => (
                            <div key={friend._id} className="friend-card">
                                <div className="friend-info">
                                    <h4 className="friend-username">{friend.username}</h4>
                                    <span className="friend-codeforces verified">
                                        ✅ {friend.codeforcesId}
                                    </span>
                                </div>
                                <div className="friend-actions">
                                    <button 
                                        onClick={() => handleRemoveFriend(friend._id, friend.username)}
                                        className="remove-friend-btn"
                                        title="Remove friend"
                                    >
                                        🗑️ Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendsList;