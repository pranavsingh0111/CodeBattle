require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const duelRoutes = require('./routes/duelRoutes');
const cors = require('cors');
const { startCleanupService } = require('./controllers/duelController');
const { startRatingScheduler } = require('./utils/ratingScheduler');

const app = express();

app.use(express.json());
app.use(cors());

console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI is set' : 'URI is not set');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database name:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

app.use('/api/users', userRoutes);
app.use('/api/duels', duelRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

startCleanupService();
startRatingScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});