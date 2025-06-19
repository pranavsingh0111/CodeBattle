import React, { useState, useEffect } from 'react';
import { syncCodeforcesId, validateCodeforcesId, generateVerificationChallenge, verifyCodeforcesOwnership, syncCodeforcesRating } from '../../utils/api';

const CodeforcesSync = ({ onStatsUpdate }) => {
    const [codeforcesId, setCodeforcesId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [verificationChallenge, setVerificationChallenge] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isSyncingRating, setIsSyncingRating] = useState(false);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleValidate = async () => {
        if (!codeforcesId.trim()) {
            setMessage('Please enter a Codeforces ID.');
            return;
        }

        setIsValidating(true);
        setMessage('');

        try {
            const info = await validateCodeforcesId(codeforcesId);
            setUserInfo(info);
            setMessage('✅ Valid Codeforces ID found!');
            
            if (onStatsUpdate) {
                onStatsUpdate();
            }
        } catch (error) {
            setUserInfo(null);
            setMessage('❌ Invalid Codeforces ID or user not found.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleStartVerification = async () => {
        if (!userInfo) {
            setMessage('Please validate your Codeforces ID first.');
            return;
        }

        setLoading(true);
        try {
            const challenge = await generateVerificationChallenge(codeforcesId);
            setVerificationChallenge(challenge);
            setCountdown(challenge.expiresIn * 60); 
            setMessage('🎯 Verification challenge generated! Follow the instructions below.');
        } catch (error) {
            setMessage('❌ Error generating verification challenge: ' + (error.response?.data?.message || 'Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOwnership = async () => {
        setIsVerifying(true);
        try {
            const response = await verifyCodeforcesOwnership();
            setMessage('🎉 ' + response.message);
            setVerificationChallenge(null);
            setCountdown(0);
            
            if (onStatsUpdate) {
                onStatsUpdate();
            }
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.message || 'Verification failed. Please try again.'));
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSyncRating = async () => {
        setIsSyncingRating(true);
        try {
            const response = await syncCodeforcesRating();
            setMessage(`✅ ${response.message} ${response.changeMessage || ''}`);
            
            if (onStatsUpdate) {
                onStatsUpdate();
            }
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.message || 'Error syncing rating'));
        } finally {
            setIsSyncingRating(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="codeforces-sync-container">
            <h3>🔗 Sync & Verify Codeforces Account</h3>
            <p>Link and verify your Codeforces account to prevent impersonation.</p>
            
            <div className="sync-form">
                <div className="input-group">
                    <label htmlFor="codeforcesId">Codeforces Username:</label>
                    <input
                        type="text"
                        id="codeforcesId"
                        value={codeforcesId}
                        onChange={(e) => {
                            setCodeforcesId(e.target.value);
                            setUserInfo(null);
                            setMessage('');
                            setVerificationChallenge(null);
                        }}
                        placeholder="e.g., tourist, Petr"
                        className="codeforces-input"
                        disabled={verificationChallenge}
                    />
                </div>

                <div className="button-group">
                    <button
                        onClick={handleValidate}
                        disabled={isValidating || verificationChallenge}
                        className="validate-btn"
                    >
                        {isValidating ? '🔍 Validating...' : '🔍 Validate & Sync Rating'}
                    </button>
                    
                    {userInfo && !verificationChallenge && (
                        <button
                            onClick={handleStartVerification}
                            disabled={loading}
                            className="verify-btn"
                        >
                            {loading ? '🔄 Generating...' : '🛡️ Start Verification'}
                        </button>
                    )}

                    {userInfo && (
                        <button
                            onClick={handleSyncRating}
                            disabled={isSyncingRating}
                            className="sync-btn"
                        >
                            {isSyncingRating ? '🔄 Syncing...' : '🔄 Sync Latest Rating'}
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div className={`message ${message.includes('✅') || message.includes('🎉') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {userInfo && !verificationChallenge && (
                <div className="user-info-card">
                    <h4>📋 Account Information</h4>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Handle:</span>
                            <span className="info-value">{userInfo.handle}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Rating:</span>
                            <span className="info-value rating">{userInfo.rating || 'Unrated'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Max Rating:</span>
                            <span className="info-value">{userInfo.maxRating || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Rank:</span>
                            <span className="info-value rank">{userInfo.rank || 'Unrated'}</span>
                        </div>
                    </div>
                </div>
            )}

            {verificationChallenge && (
                <div className="verification-challenge">
                    <h4>🎯 Verification Challenge</h4>
                    <div className="challenge-info">
                        <div className="countdown">
                            ⏰ Time remaining: <strong>{formatTime(countdown)}</strong>
                        </div>
                        
                        <div className="problem-info">
                            <h5>Problem to Submit:</h5>
                            <p><strong>{verificationChallenge.problem.name}</strong></p>
                            <a 
                                href={verificationChallenge.problem.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="problem-link"
                            >
                                🔗 Open Problem ({verificationChallenge.problem.contestId}{verificationChallenge.problem.index})
                            </a>
                        </div>

                        <div className="instructions">
                            <h5>📝 Instructions:</h5>
                            <ol>
                                <li>Click the link above to open the problem</li>
                                <li>Write any solution (it can even have compilation errors)</li>
                                <li>Include this verification code as a comment in your code:</li>
                                <div className="verification-code">
                                    <code>{verificationChallenge.verificationCode}</code>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(verificationChallenge.verificationCode)}
                                        className="copy-btn"
                                        title="Copy to clipboard"
                                    >
                                        📋
                                    </button>
                                </div>
                                <li>Submit your solution on Codeforces</li>
                                <li>Click "Verify Ownership" below</li>
                            </ol>
                        </div>

                        <div className="verify-section">
                            <button
                                onClick={handleVerifyOwnership}
                                disabled={isVerifying || countdown <= 0}
                                className="verify-ownership-btn"
                            >
                                {isVerifying ? '🔍 Verifying...' : '✅ Verify Ownership'}
                            </button>
                            
                            {countdown <= 0 && (
                                <p className="expired-message">
                                    ⚠️ Verification time expired. Please start again.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="sync-info">
                <h4>📊 Rating Sync Information</h4>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Auto-sync:</span>
                        <span className="info-value">Every time you view your stats</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Manual sync:</span>
                        <span className="info-value">Use the "Sync Latest Rating" button</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Rating changes:</span>
                        <span className="info-value">Automatically detected and displayed</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeforcesSync;