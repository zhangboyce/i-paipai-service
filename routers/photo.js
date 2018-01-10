'use strict';
const router = require('koa-router')();
const fs = require('fs');
const moment = require('moment');
const QiniuUploader = require('../utils/QiniuUploader');
const KoaUploadMiddleware = require('./KoaUploadMiddleware');
const User = require('../models/User');
const Photo = require('../models/Photo');

router.post('/api/photo/upload', KoaUploadMiddleware, function *() {
    let data = this.data || {};
    let files = this.files || {};
    let path = files.file && files.file.path;
    let filename = files.file && files.file.filename;
    if (!path || !path.trim()) {
        this.body = { errmsg: '没有选择要上传的文件' };
        return;
    }

    let openId = this.openId;
    let user = yield User.findOne({ openId });
    if (!user) {
        this.body = { errmsg: '用户的sessionId无效, 请尝试重新登录' };
        return;
    }

    let _id = user._id;
    let key = 'i-paipai/' + _id + '/' + filename;
    let respKey = yield QiniuUploader.upload(path, key);

    let stats = fs.statSync(path);
    let size = stats.size;

    let photo = new Photo({
        openId,
        key: respKey,
        size,
        location: data.location,
        tags: (data.tags || '').split(','),
        source: 'qiniu',
        uploadedDate: moment() });

    yield photo.save();

    this.body = { photo: photo };
});

router.get('/api/photo/count', function *() {
    let query = yield generateQuery(this);
    let count = yield Photo.count(query);
    this.body = { count: count };
});

router.get('/api/photo/list', function *() {
    let query = yield generateQuery(this);
    let pageSize = parseInt(this.query.pageSize || 9);
    let pageNum = parseInt(this.query.pageNum || 1);
    let offset = pageSize * (pageNum - 1);

    let photos = yield Photo.find(query, { openId: 0 }).skip(offset).limit(pageSize);
    this.body = { photos: photos };
});


function *generateQuery(ctx) {
    let openId = ctx.openId;
    let startDate = ctx.query.startDate;
    let endDate = ctx.query.endDate;
    let tag = ctx.query.tag;
    let location = ctx.query.location;

    let query = { openId };
    if (startDate) {
        let uploadedDate = { $gte: startDate };
        if(endDate) {
            uploadedDate['$lte'] = endDate;
        }
        query['uploadedDate'] = uploadedDate;
    }

    if (tag) query['tags'] = tag;
    if (location) query['location'] = location;

    return query;
}

module.exports = router;