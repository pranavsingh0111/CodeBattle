import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginUser = async (userData) => {
    const response = await api.post('/users/login', userData);
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
};

export const getUserStats = async () => {
    const response = await api.get('/users/stats');
    return response.data;
};

export const getFriendActivities = async () => {
    const response = await api.get('/users/friends/activities');
    return response.data;
};

export const searchUser = async (username) => {
    const response = await api.get(`/users/search?username=${username}`);
    return response.data;
};

export const addFriend = async (friendId) => {
    const response = await api.post('/users/friends', { friendId });
    return response.data;
};

export const getFriends = async () => {
    const response = await api.get('/users/friends');
    return response.data;
};

export const removeFriend = async (friendId) => {
    const response = await api.delete(`/users/friends/${friendId}`);
    return response.data;
};

export const getPendingFriendRequests = async () => {
    const response = await api.get('/users/friends/requests');
    return response.data;
};

export const acceptFriendRequest = async (requesterId) => {
    const response = await api.post(`/users/friends/requests/${requesterId}/accept`);
    return response.data;
};

export const rejectFriendRequest = async (requesterId) => {
    const response = await api.post(`/users/friends/requests/${requesterId}/reject`);
    return response.data;
};

export const validateCodeforcesId = async (codeforcesId) => {
    const response = await api.post('/users/validate-codeforces', { codeforcesId });
    return response.data;
};

export const syncCodeforcesId = async (codeforcesId) => {
    const response = await api.post('/users/sync', { codeforcesId });
    return response.data;
};

export const generateVerificationChallenge = async (codeforcesId) => {
    const response = await api.post('/users/generate-verification', { codeforcesId });
    return response.data;
};

export const verifyCodeforcesOwnership = async () => {
    const response = await api.post('/users/verify-ownership');
    return response.data;
};

export const syncCodeforcesRating = async () => {
    const response = await api.post('/users/sync-rating');
    return response.data;
};

export const createDuel = async (duelData) => {
    const response = await api.post('/duels/challenge', duelData);
    return response.data;
};

export const getPendingDuels = async () => {
    const response = await api.get('/duels/pending');
    return response.data;
};

export const acceptDuel = async (duelId) => {
    const response = await api.post(`/duels/${duelId}/accept`);
    return response.data;
};

export const rejectDuel = async (duelId) => {
    const response = await api.post(`/duels/${duelId}/reject`);
    return response.data;
};

export const getUserDuels = async () => {
    const response = await api.get('/duels');
    return response.data;
};

export const getActiveDuel = async (duelId) => {
    const response = await api.get(`/duels/${duelId}/battle`);
    return response.data;
};

export const offerDraw = async (duelId) => {
    const response = await api.post(`/duels/${duelId}/offer-draw`);
    return response.data;
};

export const respondToDrawOffer = async (duelId, action) => {
    const response = await api.post(`/duels/${duelId}/respond-draw`, { action });
    return response.data;
};

export const withdrawDrawOffer = async (duelId) => {
    const response = await api.post(`/duels/${duelId}/withdraw-draw`);
    return response.data;
};

export const checkSubmissionStatus = async (duelId) => {
    const response = await api.get(`/duels/${duelId}/check-status`);
    return response.data;
};

export default api;