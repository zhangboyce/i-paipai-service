'use strict';
const router = require('koa-router')();
const config = require('config');
const moment = require('moment');
const rp = require('request-promise');
const User = require('../models/User');
const Utils = require('../utils/Utils');
const client = require('../utils/RedisConnection').get();
const REDIS_SESSION_PREFIX = Utils.REDIS_SESSION_PREFIX;

function* login(openId) {
    let sessionId = Utils.random();
    let key = REDIS_SESSION_PREFIX + sessionId;
    yield client.setAsync(key, openId);
    yield client.expireAsync(key, 86400 * 7);
    return sessionId;
}

router.get('/api/user/logout/:sessionId', function *() {
    client.del(REDIS_SESSION_PREFIX + this.params.sessionId);
});

router.get('/api/user/login/:code', function* () {
    let code = this.params.code;

    if (!code || !code.trim()) {
        this.body = { errmsg: '非法的code' };
        return;
    }

    let getOpenIdUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${ config.get('weixin.appId') }&secret=${ config.get('weixin.appSecret') }&js_code=${ code }&grant_type=authorization_code`;
    let jsonStr = yield rp(getOpenIdUrl);
    let json = JSON.parse(jsonStr);

    if (json.errcode) {
        this.body = json;
        return;
    }

    let openId = json.openid;
    let sessionKey = json.session_key;
    let unionId = json.unionid;

    let user = yield User.findOne({ openId: openId });
    if (!user) {
        yield new User({ openId, sessionKey, unionId, createdDate: moment(), lastLoginDate: moment()}).save();
    }

    let sessionId = yield login(openId);
    yield User.update({ openId }, { $set: { lastLoginDate: moment() } });

    this.body = { sessionId: sessionId };

});

module.exports = router;