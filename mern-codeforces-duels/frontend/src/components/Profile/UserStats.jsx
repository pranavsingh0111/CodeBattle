import React, { useState, useEffect } from 'react';
import { getUserStats } from '../../utils/api';

const UserStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await getUserStats();
            setStats(response);
            setError('');
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Error loading statistics');
        } finally {
            setLoading(false);
        }
    };

    const getRankFromPoints = (points) => {
        if (points >= 1000) return { name: 'Master', color: '#ff6b6b', icon: '👑' };
        if (points >= 500) return { name: 'Expert', color: '#4ecdc4', icon: '🔥' };
        if (points >= 200) return { name: 'Skilled', color: '#45b7d1', icon: '⭐' };
        if (points >= 50) return { name: 'Novice', color: '#96ceb4', icon: '🌱' };
        return { name: 'Beginner', color: '#ffeaa7', icon: '🥚' };
    };

    if (loading) {
        return <div className="loading">Loading statistics...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!stats) {
        return <div className="error">No statistics available</div>;
    }

    const rank = getRankFromPoints(stats.points || 0);

    return (
        <div className="user-stats-container">
            <div className="stats-header">
                <h2>📊 Your Statistics</h2>
                <div className="user-rank">
                    <span className="rank-icon">{rank.icon}</span>
                    <span className="rank-name" style={{ color: rank.color }}>
                        {rank.name}
                    </span>
                    <span className="rank-points">({stats.points || 0} points)</span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">⚔️</div>
                    <div className="stat-content">
                        <h3>Total Duels</h3>
                        <div className="stat-number">{stats.totalDuels || 0}</div>
                        <div className="stat-subtitle">
                            {stats.activeDuels || 0} active
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                        <h3>Win Rate</h3>
                        <div className="stat-number">{stats.winRate || 0}%</div>
                        <div className="stat-subtitle">
                            {stats.wins || 0}W / {stats.losses || 0}L / {stats.draws || 0}D
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                        <h3>Duel Points</h3>
                        <div className="stat-number">{stats.points || 0}</div>
                        <div className="stat-subtitle">
                            Based on rating & performance
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>CF Rating</h3>
                        <div className="stat-number">
                            {stats.rating && stats.rating !== 'N/A' && stats.rating !== null 
                                ? stats.rating 
                                : 'Unrated'}
                        </div>
                        <div className="stat-subtitle">
                            {stats.codeforcesId && stats.codeforcesId !== 'Not synced' 
                                ? `@${stats.codeforcesId}` 
                                : 'Sync your account'}
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>Friends</h3>
                        <div className="stat-number">{stats.friendsCount || 0}</div>
                        <div className="stat-subtitle">
                            Connected rivals
                        </div>
                    </div>
                </div>
            </div>

            <div className="chart-section">
                <h3>📈 Point System Explanation</h3>
                <div className="chart-placeholder">
                    <p>🎯 How Points Work:</p>
                    <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '1rem auto' }}>
                        <li>🏆 Win against higher-rated: More points (up to 100)</li>
                        <li>💪 Win against lower-rated: Fewer points (minimum 5)</li>
                        <li>😔 Lose to higher-rated: Lose fewer points</li>
                        <li>📉 Lose to lower-rated: Lose more points</li>
                        <li>🤝 Draw: Both get 15-25 points (lower-rated gets bonus)</li>
                        <li>🎉 Upset bonus for beating +200 rating difference</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UserStats;
