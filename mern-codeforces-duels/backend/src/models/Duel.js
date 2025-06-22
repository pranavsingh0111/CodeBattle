const mongoose = require('mongoose');

const duelSchema = new mongoose.Schema({
    challenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'expired', 'draw'],
        default: 'pending'
    },
    challengeDetails: {
        ratingRange: {
            min: { type: Number, required: true },
            max: { type: Number, required: true }
        },
        tags: [{ type: String, required: true }],
        selectedProblem: {
            contestId: Number,
            index: String,
            name: String,
            rating: Number,
            url: String
        }
    },
    battleDetails: {
        startTime: Date,
        endTime: Date,
        duration: {
            type: Number,
            default: 3600
        },
        drawOffer: {
            offeredBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            offeredAt: Date,
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
                default: 'pending'
            }
        }
    },
    result: {
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        completedAt: Date,
        winCondition: {
            type: String,
            enum: ['first_solve', 'timeout', 'draw', 'withdrawal']
        },
        submissions: {
            challenger: {
                submissionId: String,
                verdict: String,
                submittedAt: Date
            },
            opponent: {
                submissionId: String,
                verdict: String,
                submittedAt: Date
            }
        }
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 5 * 60 * 1000); 
        }
    }
}, {
    timestamps: true
});

duelSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Duel', duelSchema);