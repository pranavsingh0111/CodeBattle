import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

const Navbar = () => {
    const history = useHistory();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status on component mount and route changes
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, [location.pathname]); // Re-check when route changes

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId'); // Also remove stored user ID
        setIsLoggedIn(false);
        alert('Logged out successfully!');
        history.push('/');
    };

    const handleLogoClick = () => {
        if (isLoggedIn) {
            history.push('/dashboard');
        } else {
            history.push('/');
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <button 
                    onClick={handleLogoClick} 
                    className="nav-logo"
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'white', 
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        fontWeight: '700'
                    }}
                >
                    🏆 Codeforces Duels
                </button>
                
                <div className="nav-links">
                    {isLoggedIn ? (
                        <>
                            <Link to="/dashboard" className="nav-link">
                                📊 Dashboard
                            </Link>
                            <Link to="/friends" className="nav-link">
                                👥 Friends
                            </Link>
                            <Link to="/duels" className="nav-link">
                                ⚔️ Duels
                            </Link>
                            <Link to="/sync" className="nav-link">
                                🔗 Profile
                            </Link>
                            <button onClick={handleLogout} className="logout-btn">
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">
                                🔑 Login
                            </Link>
                            <Link to="/register" className="nav-link">
                                📝 Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
