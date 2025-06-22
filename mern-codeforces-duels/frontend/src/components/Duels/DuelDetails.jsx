import React from 'react';

const DuelDetails = ({ duel }) => {
    if (!duel) {
        return <div>No duel data available.</div>;
    }

    const canSeeProblem = duel.status === 'active' || duel.status === 'completed';

    return (
        <div className="duel-details">
            <h3>⚔️ Duel Information</h3>
            <div className="duel-info-grid">
                <div className="info-section">
                    <h4>👥 Participants</h4>
                    <p><strong>Challenger:</strong> {duel.challenger?.username || 'Unknown'}</p>
                    <p><strong>Opponent:</strong> {duel.opponent?.username || 'Unknown'}</p>
                </div>
                
                <div className="info-section">
                    <h4>⚙️ Challenge Settings</h4>
                    <p><strong>Rating Range:</strong> {duel.challengeDetails?.ratingRange?.min} - {duel.challengeDetails?.ratingRange?.max}</p>
                    <p><strong>Tags:</strong> {duel.challengeDetails?.tags?.join(', ') || 'None'}</p>
                    <p><strong>Status:</strong> <span className={`status ${duel.status}`}>{duel.status}</span></p>
                </div>

                {canSeeProblem && duel.challengeDetails?.selectedProblem && (
                    <div className="info-section">
                        <h4>🧩 Problem</h4>
                        <p><strong>Name:</strong> {duel.challengeDetails.selectedProblem.name}</p>
                        <p><strong>Rating:</strong> {duel.challengeDetails.selectedProblem.rating}</p>
                        <a 
                            href={duel.challengeDetails.selectedProblem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="problem-link"
                        >
                            🔗 Solve Problem
                        </a>
                    </div>
                )}

                {!canSeeProblem && (
                    <div className="info-section">
                        <h4>🔒 Problem</h4>
                        <p>Problem will be revealed when the duel starts</p>
                    </div>
                )}
            </div>
            
            <div className="timestamp-info">
                <p><strong>Created:</strong> {new Date(duel.createdAt).toLocaleString()}</p>
                {duel.startTime && (
                    <p><strong>Started:</strong> {new Date(duel.startTime).toLocaleString()}</p>
                )}
            </div>
        </div>
    );
};

export default DuelDetails;
