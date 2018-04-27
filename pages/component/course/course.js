// pages/course/course.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        isLogin: false,
        videoContext: '',
        videoId: '', //当前课程的ID
        courseId: '', // 当前课程类别的ID
        list: [],
        index: 0, //当前课程的索引值
        baseInfo: '', // 课程简介
        len: 4,  // 每次加载视频课程的数量
        max: 4,  // 视频已加载的总量： 默认是4课
        nextBtn: true,
    },
    onShow: function () {
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
        const { videoId, videoType } = options;

        this.setData({
            videoId: videoId,
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

        util.sendRequest(util.urls.stockCollegeVedioList, { courseId: id }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

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
    beforePlay () {
        const self = this;

        if (!app.globalData.isLogin) { //未登录
            self.videoContext.pause(0);
            util.wxLoginHandler(function () {
                self.setData({
                    isLogin: true
                });
                self.videoContext.play();
                self.playCount();
            }, function () {
                wx.openSetting({
                    success: (res) => {
                        res.authSetting = {
                        "scope.userInfo": true
                        }
                    }
                })
                // self.videoContext.pause();
            }); 
        } else {
            self.setData({
                isLogin: app.globalData.isLogin
            });

            self.playCount();
        }
    },
    // 记录播放次数
    playCount () {
        const self = this;
        const { videoId, courseId } = self.data;

        util.sendRequest(util.urls.playCount, { period_id: videoId, course_id: courseId }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;
            }
        });
    },
    waitHandler () {
        const self = this;

        // wx.showToast({
        //     title: '拼命加载中',
        //     icon: 'loading',
        //     duration: 2000
        // })
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
    }
})