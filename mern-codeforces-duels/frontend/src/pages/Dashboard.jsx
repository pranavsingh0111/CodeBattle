import React, { useEffect, useState } from 'react';
import { getUserStats, getFriendActivities } from '../utils/api';
import FriendsList from '../components/Friends/FriendsList';
import DuelList from '../components/Duels/DuelList';
import AddFriend from '../components/Friends/AddFriend';
import ChallengeForm from '../components/Duels/ChallengeForm';
import PendingDuels from '../components/Duels/PendingDuels';
import OngoingDuels from '../components/Duels/OngoingDuels';
import { useHistory } from 'react-router-dom';
import UserStats from '../components/Profile/UserStats';
import CodeforcesSync from '../components/Profile/CodeforcesSync';

const Dashboard = () => {
    const [userStats, setUserStats] = useState(null);
    const [friendActivities, setFriendActivities] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const history = useHistory();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stats = await getUserStats();
                const activities = await getFriendActivities();
                setUserStats(stats);
                setFriendActivities(activities);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="tab-content">
                        {userStats && (
                            <div className="user-stats-card">
                                <h3>📊 Your Stats</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">Codeforces ID:</span>
                                        <span className="stat-value">{userStats.codeforcesId}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Rating:</span>
                                        <span className="stat-value">{userStats.rating}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Friends:</span>
                                        <span className="stat-value">{userStats.friendsCount}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <OngoingDuels />
                        <div className="recent-activities">
                            <h3>🏃‍♂️ Recent Activities</h3>
                            {friendActivities.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    {activity.message}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'friends':
                return (
                    <div className="tab-content">
                        <AddFriend />
                        <FriendsList />
                    </div>
                );
            case 'duels':
                return (
                    <div className="tab-content">
                        <PendingDuels />
                        <ChallengeForm />
                        <DuelList />
                    </div>
                );
            case 'profile':
                return (
                    <div className="tab-content">
                        <UserStats />
                        <CodeforcesSync />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>🏆 Dashboard</h1>
                <p>Welcome back! Ready for some coding duels?</p>
            </div>
            
            <nav className="dashboard-nav">
                <button 
                    className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    👥 Friends
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'duels' ? 'active' : ''}`}
                    onClick={() => setActiveTab('duels')}
                >
                    ⚔️ Duels
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    🔗 Profile
                </button>
            </nav>

            <div className="dashboard-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Dashboard;