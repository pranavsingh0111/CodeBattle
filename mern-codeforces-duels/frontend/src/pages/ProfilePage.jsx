import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import UserStats from '../components/Profile/UserStats';
import CodeforcesSync from '../components/Profile/CodeforcesSync';

const ProfilePage = () => {
    const history = useHistory();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            history.push('/login');
        }
    }, [history]);

    const handleStatsUpdate = () => {
        // Force UserStats component to refresh by changing key
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="profile-page">
            <div className="container">
                <h1>👤 Your Profile</h1>
                <UserStats key={refreshKey} />
                <CodeforcesSync onStatsUpdate={handleStatsUpdate} />
            </div>
        </div>
    );
};

export default ProfilePage;
