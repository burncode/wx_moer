// pages/course/course.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        isLogin: false,
        staticFile: util.staticFile,
        videoContext: '',
        sort: 0,
        videoId: '', //当前课程的ID
        courseId: '', // 当前课程类别的ID
        list: [],
        index: 0, //当前课程的索引值
        baseInfo: '', // 课程简介
        len: 4,  // 每次加载视频课程的数量
        max: 4,  // 视频已加载的总量： 默认是4课
        nextBtn: true,
    },
    onShow: function (options) {
        const self = this;
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLogin = wx.getStorageSync('isLogin') || false;

        app.globalData.userInfo = userInfo;
        app.globalData.isLogin = isLogin;

        self.setData({
            isLogin: isLogin
        });
    },
    onReady: function (res) {
        this.videoContext = wx.createVideoContext('myVideo');
    },
    onLoad: function (options) {
        const { videoId, videoType, sort } = options;

        this.setData({
            videoId: videoId,
            sort: sort,
            courseId: videoType
        });
        this.collegeHandler(videoType);
    },
    // 课程目录
    collegeHandler: function (id) {
        const self = this;
        const { videoId, index } = self.data;

        wx.showLoading({
            title: '加载中',
            mask: true
        });

        util.sendRequest({
            path: util.urls.stockCollegeVedioList,
            data: { courseId: id }
        }).then(res => {
            if (res.code == util.ERR_OK) {
                const d = res.result;

                wx.hideLoading();
                self.setData({
                    baseInfo: d.baseInfo,
                    list: d.videoList
                });

                d.videoList.forEach((item, index) => {
                    if (item.videoId == videoId) {
                        self.setData({
                            index: index
                        });
                    }
                });
            }
        });
    },
    // 点击展开更多课程
    getVideo() {
        const { len, max, list } = this.data;
        const maxLen = Math.ceil(list.length / len);

        if (max < list.length) {
            this.setData({
                max: len + max
            })
        } else {
            this.setData({
                max: len
            })
        }
    },
    bindgetuserinfo() {
        const self = this;

        util.wxLoginHandler(function () {
            self.setData({
                userInfo: app.globalData.userInfo,
                isLogin: app.globalData.isLogin
            });

            self.videoContext.play();
            self.playCount();
        });
    },
    // 记录播放次数
    playCount () {
        const self = this;
        const { videoId, courseId } = self.data;

        util.sendRequest({
            path: util.urls.playCount,
            data: { period_id: videoId, course_id: courseId }
        }).then(res => {
            if (res.code == util.ERR_OK) {
                const d = res.result;
            }
        }); 
    },
    waitHandler () {
        const self = this;
    },
    // 下一课 ||  视频播放完成后自动播放下一课
    nextHandler() {
        let { index, list } = this.data;

        if (index < list.length - 1) {
            index++
            this.setData({
                index: index
            });
        }
    },
    // 播放当前点击的课程
    playHandler(e) {
        const { index} = e.currentTarget.dataset;

        this.setData({
            index: index
        });
    },
    sendMsgId(e) {
        const self = this;
        const { formId } = e.detail;
        const isLogin = app.globalData.isLogin;

        if (isLogin) {
            util.sendFormId(formId);
        }
    },
    onShareAppMessage: function () {
        const { sort } = this.data;
        const titles = ['一个向国内顶级私募学习的机会', '一套完整从低到高的缠论学习课程'];

        return {
            title: titles[sort],
            path: `/pages/component/course/course`
        }
    }
})