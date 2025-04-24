const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
    urlCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    longUrl: {
        type: String,
        required: true,
        trim: true
    },
    shortUrl: {
        type: String,
        required: true,
        trim: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// Add indexes for better query performance
// UrlSchema.index({ urlCode: 1 });
UrlSchema.index({ createdAt: 1 });
UrlSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Url', UrlSchema);