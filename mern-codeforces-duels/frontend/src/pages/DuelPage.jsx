import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserDuels } from '../utils/api';
import DuelDetails from '../components/Duels/DuelDetails';

const DuelPage = () => {
    const { duelId } = useParams();
    const [duel, setDuel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDuelDetails = async () => {
            try {
                const duels = await getUserDuels();
                const duel = duels.find(d => d._id === duelId);
                setDuel(duel);
            } catch (err) {
                setError('Failed to fetch duel details');
            } finally {
                setLoading(false);
            }
        };

        fetchDuelDetails();
    }, [duelId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Duel Details</h1>
            {duel ? <DuelDetails duel={duel} /> : <div>No duel found.</div>}
        </div>
    );
};

export default DuelPage;