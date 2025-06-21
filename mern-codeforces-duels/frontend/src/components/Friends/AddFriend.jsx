import React, { useState } from 'react';
import { searchUser, addFriend } from '../../utils/api';

const AddFriend = ({ onFriendAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setMessage('');
        setShowVerificationPrompt(false);
        
        try {
            const results = await searchUser(searchQuery);
            setSearchResults(results);
            if (results.length === 0) {
                setMessage('No verified users found with that username.');
            }
        } catch (error) {
            if (error.response?.data?.requiresVerification) {
                setShowVerificationPrompt(true);
                setMessage('⚠️ You must verify your Codeforces account before adding friends.');
            } else {
                setMessage('Error searching for users.');
            }
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (userId, username) => {
        try {
            await addFriend(userId);
            setMessage(`✅ Friend request sent to ${username}!`);
            setSearchResults([]);
            setSearchQuery('');
            if (onFriendAdded) onFriendAdded();
        } catch (error) {
            if (error.response?.data?.requiresVerification) {
                setShowVerificationPrompt(true);
                setMessage('⚠️ You must verify your Codeforces account before adding friends.');
            } else if (error.response?.data?.friendNotVerified) {
                setMessage('⚠️ This user has not verified their Codeforces account yet.');
            } else {
                setMessage(error.response?.data?.message || 'Error sending friend request.');
            }
            console.error('Add friend error:', error);
        }
    };

    return (
        <div className="add-friend-container">
            <h3>👥 Add Friends</h3>
            <p className="feature-description">
                Search for verified users and add them as friends to challenge them to duels!
            </p>
            
            {showVerificationPrompt && (
                <div className="verification-prompt">
                    <h4>🔒 Verification Required</h4>
                    <p>You need to verify your Codeforces account before you can add friends.</p>
                    <p>Go to the <strong>Profile</strong> tab to verify your account.</p>
                </div>
            )}
            
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search verified users by username..."
                        className="search-input"
                    />
                    <button type="submit" disabled={loading} className="search-btn">
                        {loading ? '🔍' : '🔍 Search'}
                    </button>
                </div>
                <small className="search-hint">
                    Only users with verified Codeforces accounts will appear in search results.
                </small>
            </form>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {searchResults.length > 0 && (
                <div className="search-results">
                    <h4>🔍 Verified Users Found:</h4>
                    {searchResults.map((user) => (
                        <div key={user._id} className="user-result">
                            <div className="user-info">
                                <span className="username">{user.username}</span>
                                <span className="codeforces-id verified">
                                    ✅ CF: {user.codeforcesId}
                                </span>
                            </div>
                            <button
                                onClick={() => handleAddFriend(user._id, user.username)}
                                className="add-friend-btn"
                            >
                                📨 Send Request
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="requirements-info">
                <h4>📋 Requirements to Add Friends:</h4>
                <ul>
                    <li>✅ You must have a verified Codeforces account</li>
                    <li>✅ The user must be registered on our platform</li>
                    <li>✅ The user must have a verified Codeforces account</li>
                    <li>✅ Friendship is mutual - they will also see you as a friend</li>
                </ul>
            </div>
        </div>
    );
};

export default AddFriend;
