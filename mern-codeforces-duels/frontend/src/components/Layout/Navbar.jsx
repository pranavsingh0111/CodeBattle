import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

const Navbar = () => {
    const history = useHistory();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Check login status on component mount and route changes
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, [location.pathname]); // Re-check when route changes

    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            setDarkMode(savedTheme === 'dark');
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (prefersDark) {
            setDarkMode(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newTheme = darkMode ? 'light' : 'dark';
        setDarkMode(!darkMode);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

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
        <>
            {/* Dark Mode Toggle */}
            <button 
                onClick={toggleDarkMode}
                className="dark-mode-toggle"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {darkMode ? '☀️' : '🌙'}
            </button>

            <nav className="navbar">
                <div className="nav-container">
                    <button 
                        onClick={handleLogoClick} 
                        className="nav-logo"
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
        </>
    );
};

export default Navbar;