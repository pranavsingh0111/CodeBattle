import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import FriendsList from '../components/Friends/FriendsList';
import AddFriend from '../components/Friends/AddFriend';

const FriendsPage = () => {
    const history = useHistory();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            history.push('/login');
        }
    }, [history]);

    return (
        <div className="friends-page">
            <div className="container">
                <h1>👥 Friends</h1>
                <AddFriend />
                <FriendsList />
            </div>
        </div>
    );
};

export default FriendsPage;
