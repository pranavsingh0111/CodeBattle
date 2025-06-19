import React, { useState } from 'react';
import { loginUser } from '../../utils/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login for:', username);
            const response = await loginUser({ username, password });
            console.log('Login response:', response);
            
            if (response.token) {
                localStorage.setItem('token', response.token);
                
                try {
                    const payload = JSON.parse(atob(response.token.split('.')[1]));
                    localStorage.setItem('userId', payload.id);
                } catch (error) {
                    console.error('Error parsing token for user ID:', error);
                }
                
                alert('Login successful!');
                window.location.href = '/dashboard';
            } else {
                setError('Login failed - no token received');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;