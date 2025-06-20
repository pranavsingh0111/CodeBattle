import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Home = () => {
    const history = useHistory();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            history.replace('/dashboard');
        }
    }, [history]);

    return (
        <div className="home">
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">🏆 Codeforces Duels</h1>
                    <p className="hero-subtitle">Challenge your friends and level up your coding skills!</p>
                    <p className="hero-description">
                        Compete in real-time programming duels with carefully selected problems
                    </p>
                    
                    <div className="auth-buttons">
                        <Link to="/login" className="btn btn-primary">
                            Login
                        </Link>
                        <Link to="/register" className="btn btn-secondary">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Why Choose Codeforces Duels?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">👥</div>
                            <h3>Add Friends</h3>
                            <p>Connect with fellow programmers and build your coding network</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">⚔️</div>
                            <h3>Challenge Duels</h3>
                            <p>Send challenges to friends with custom rating ranges</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">🔗</div>
                            <h3>Sync Codeforces</h3>
                            <p>Link your Codeforces account for personalized experiences</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Track Progress</h3>
                            <p>Monitor your duel history and improvement over time</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <h3>Smart Problems</h3>
                            <p>Get problems tailored to your skill level and preferences</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">🏅</div>
                            <h3>Smart Point System</h3>
                            <p>Earn points based on your performance! Beat higher-rated opponents for bonus points, with ratings synced from Codeforces</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Start Your Coding Journey?</h2>
                    <p>Join thousands of programmers already improving their skills</p>
                    <Link to="/register" className="btn btn-large btn-primary">
                        Get Started Now
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;