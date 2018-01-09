'use strict';

const uuid = require('node-uuid');
const crypto = require('crypto');
const REDIS_SESSION_PREFIX = 'i-paipai-sessionId-';

function random() {
    var uid = uuid.v1();
    var md5 = crypto.createHash('md5');
    md5.update(uid);
    return md5.digest('hex');
}

function md5ByString(str) {
    var md5 = crypto.createHash('md5');
    md5.update(str);
    return md5.digest('hex');
}

module.exports = { random, md5ByString, REDIS_SESSION_PREFIX };

const SALT = 'CCeGROUp-BOOM';
console.log(md5ByString('123456' + SALT));