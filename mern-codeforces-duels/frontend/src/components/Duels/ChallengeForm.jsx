import React, { useState, useEffect } from 'react';
import { getFriends, createDuel } from '../../utils/api';

const ChallengeForm = () => {
    const [friends, setFriends] = useState([]);
    const [friendName, setFriendName] = useState('');
    const [ratingRange, setRatingRange] = useState([800, 1600]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [friendSuggestions, setFriendSuggestions] = useState([]);

    const availableTags = [
        'implementation', 'math', 'greedy', 'dp', 'data structures', 'brute force',
        'constructive algorithms', 'graphs', 'sortings', 'binary search', 'dfs and similar',
        'trees', 'strings', 'number theory', 'combinatorics', 'geometry', 'bitmasks',
        'two pointers', 'dsu', 'shortest paths', 'probabilities', 'hashing', 'matrices',
        'string suffix structures', 'flows', 'interactive', 'ternary search', 'divide and conquer',
        'games', 'schedules', 'fft', 'meet-in-the-middle'
    ];

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await getFriends();
            setFriends(response.data || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    useEffect(() => {
        if (friendName && friends.length > 0) {
            const filtered = friends.filter(friend => 
                friend.username.toLowerCase().includes(friendName.toLowerCase())
            );
            setFriendSuggestions(filtered);
        } else {
            setFriendSuggestions([]);
        }
    }, [friendName, friends]);

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleChallengeSubmit = async (e) => {
        e.preventDefault();
        
        if (!friendName.trim()) {
            setMessage('❌ Please enter a friend\'s name to challenge.');
            return;
        }

        const selectedFriend = friends.find(friend => 
            friend.username.toLowerCase() === friendName.toLowerCase()
        );

        if (!selectedFriend) {
            setMessage('❌ Friend not found. Please enter a valid friend\'s username.');
            return;
        }

        if (selectedTags.length === 0) {
            setMessage('❌ Please select at least one tag.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const duelData = {
                opponentId: selectedFriend._id,
                ratingMin: ratingRange[0],
                ratingMax: ratingRange[1],
                tags: selectedTags
            };

            await createDuel(duelData);
            setMessage('🎉 Challenge sent successfully! A random problem will be selected when the duel starts.');
            setFriendName('');
            setSelectedTags([]);
        } catch (error) {
            setMessage('❌ Error sending challenge: ' + (error.response?.data?.message || 'Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleFriendSelect = (friend) => {
        setFriendName(friend.username);
        setFriendSuggestions([]);
    };

    return (
        <div className="challenge-form-container">
            <h3>⚔️ Challenge a Friend</h3>
            
            <form onSubmit={handleChallengeSubmit} className="challenge-form">
                <div className="form-group">
                    <label htmlFor="friendName">👥 Friend's Username:</label>
                    <div className="friend-input-container">
                        <input
                            type="text"
                            id="friendName"
                            value={friendName}
                            onChange={(e) => setFriendName(e.target.value)}
                            placeholder="Type your friend's username..."
                            className="friend-input"
                            autoComplete="off"
                        />
                        {friendSuggestions.length > 0 && (
                            <div className="friend-suggestions">
                                {friendSuggestions.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className="friend-suggestion"
                                        onClick={() => handleFriendSelect(friend)}
                                    >
                                        <span className="suggestion-name">{friend.username}</span>
                                        <span className="suggestion-cf">({friend.codeforcesId})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <small className="form-hint">
                        Start typing to see your friends' usernames
                    </small>
                </div>

                <div className="form-group">
                    <label>🎯 Rating Range:</label>
                    <div className="rating-range">
                        <input
                            type="number"
                            value={ratingRange[0]}
                            onChange={(e) => setRatingRange([Number(e.target.value), ratingRange[1]])}
                            min="800"
                            max="3500"
                            className="rating-input"
                        />
                        <span className="range-separator">to</span>
                        <input
                            type="number"
                            value={ratingRange[1]}
                            onChange={(e) => setRatingRange([ratingRange[0], Number(e.target.value)])}
                            min="800"
                            max="3500"
                            className="rating-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>🏷️ Problem Tags:</label>
                    <div className="tags-container">
                        {availableTags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagToggle(tag)}
                                className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    <small className="form-hint">
                        Selected tags: {selectedTags.length > 0 ? selectedTags.join(', ') : 'None'}
                    </small>
                </div>

                <div className="challenge-info">
                    <h4>📝 How it works:</h4>
                    <ul>
                        <li>🎲 A random problem will be selected based on your criteria</li>
                        <li>🔒 Neither you nor your friend will see the problem until the duel starts</li>
                        <li>⚡ Both participants will get the same problem at the same time</li>
                        <li>🏆 First to solve correctly wins the duel!</li>
                        <li>⏰ Pending challenges expire after 5 minutes if not accepted</li>
                    </ul>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="challenge-btn"
                >
                    {loading ? '🚀 Sending Challenge...' : '🚀 Send Challenge'}
                </button>
            </form>

            {message && (
                <div className={`message ${message.includes('🎉') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {friends.length === 0 && (
                <div className="no-friends-message">
                    <p>👥 You don't have any friends yet!</p>
                    <p>Add some friends first to start challenging them to duels.</p>
                </div>
            )}
        </div>
    );
};

export default ChallengeForm;