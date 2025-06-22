import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PendingDuels from '../components/Duels/PendingDuels';
import OngoingDuels from '../components/Duels/OngoingDuels';
import ChallengeForm from '../components/Duels/ChallengeForm';
import DuelList from '../components/Duels/DuelList';

const DuelsPage = () => {
    const history = useHistory();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            history.push('/login');
        }
    }, [history]);

    return (
        <div className="duels-page">
            <div className="container">
                <h1>⚔️ Duels</h1>
                <OngoingDuels />
                <PendingDuels />
                <ChallengeForm />
                <DuelList />
            </div>
        </div>
    );
};

export default DuelsPage;
