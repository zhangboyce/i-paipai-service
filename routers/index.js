'use strict';
const config = require('config');
const client = require('../utils/RedisConnection').get();
const Utils = require('../utils/Utils');
const REDIS_SESSION_PREFIX = Utils.REDIS_SESSION_PREFIX;

module.exports = function (server) {
    const user = require('./user');
    server.use(user.routes()).use(user.allowedMethods());

    server.use(function *(next) {
        try {
            let headers = this.headers;
            let sessionId = headers.sessionid;
            if (!sessionId) {
                this.body = { errmsg: '未登录用户不能执行此次访问' };
                return;
            }
            let openId = yield client.getAsync(REDIS_SESSION_PREFIX + sessionId);
            if (openId) {
                this.sessionId = sessionId;
                this.openId = openId;
                yield next;
            } else {
                this.body = { errmsg: '用户登录状态过期,请重新登录' };
            }
        }catch(e) {
            console.log(e);
        }
    });

    const service = require('./service');
    server.use(service.routes()).use(service.allowedMethods());
};