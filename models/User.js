const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    openId: String,
    sessionKey: String,
    unionId: String,
    avatarUrl: String,
    nickName: String,
    createdDate: Date,
    lastLoginDate: Date
});

module.exports = mongoose.model('User', UserSchema);