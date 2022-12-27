const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    tutorId: String,
    uniqueString: String,
    createdAt: Date,
    expiredAt: Date,
});

module.exports = mongoose.model('passwordReset', passwordResetSchema);
