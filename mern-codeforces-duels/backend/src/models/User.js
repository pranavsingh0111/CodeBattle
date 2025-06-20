const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    codeforcesId: {
        type: String,
        default: null
    },
    isCodeforcesVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: null
    },
    points: {
        type: Number,
        default: 0,
        min: 0 
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sentFriendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    receivedFriendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verificationChallenge: {
        codeforcesId: String,
        problemId: String,
        contestId: Number,
        index: String,
        verificationCode: String,
        createdAt: Date,
        expiresAt: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);