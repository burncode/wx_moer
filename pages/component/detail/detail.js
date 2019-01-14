// pages/detail/detail.js
const util = require('../../../utils/util.js');
const WxParse = require('../../../plugin/wxParse/wxParse.js');
const app = getApp();

Page({
    data: {
        isLogin: false,
        userInfo: {},
        sort: 0,
        staticFile: util.staticFile,
        articleId: '',    // 文章ID
        freeFlag: 0,      // 是否是付费文章标识 0： 免费 1：收费
        refresh: false,   // 是否 是购买后重新请求
        inviteUid: '',  // 当前文章分享者的UID
        source: null,   // 来源，是否是通过APP分享的卡片
        articleInfo: null,        // 文章的详情数据
        buttonInfo: {},         // 按钮的状态数据
        btnStatus: {
            pay: false,    // 单篇购买
            coupon: false, // 使用优惠券
            help: false,   // 帮解锁
            share: false   // 达到上限 
        },
        isIphoneX: app.globalData.isIphoneX,
        count: {}, // 文章阅读数、购买数、点赞数......
        useButtonType: '',  // 未登录时，按钮授权登录；已登录且未填写手机号，则是授权手机号
        authorizePhone: 0, // 手机号是否弹窗授权
        tips: '',  // 解锁按钮下的提示
        isShowHome: '',  // 不是从首页进入文章的 显示 回到首页的按钮 否则显示客服的按钮
        isPop: 0, // 是否显示购买文章后的弹窗
        buyImg: [], // 付费文章购买者的头像
        liveInfo: {}, // 直播间相关信息
        noScroll: false
    },
    onShow: function (options) {
        const self = this;
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLogin = wx.getStorageSync('isLogin') || false;
        const isPop = wx.getStorageSync('isPop') || 0;

        app.globalData.userInfo = userInfo;
        app.globalData.isLogin = isLogin;

        self.setData({
            userInfo: userInfo,
            isLogin: isLogin,
            isPop: isPop
        });
    },
    onLoad: function (options) {
        const { articleId, inviteUid, sort, source, jump } = options;

        this.setData({
            articleId: articleId || '',
            sort: sort || '',
            inviteUid: inviteUid || '',
            source: source || '',
            isShowHome: jump || ''
        });

        wx.showLoading({
            title: '加载中',
            mask: true
        });

        this.getInfo();
        this.authorizeHandler();
    },
    // 获取文章信息
    getInfo: function () {
        const self = this;
        const { articleId, refresh, inviteUid, sort } = self.data;
        let index = sort;

        util.sendRequest({
            path: util.urls.articleDetails,
            data: {
                articleId: articleId, // 文章ID
                refresh: refresh,
                inviteUid: inviteUid         // 邀请者UID
            }
        }).then(res => {
            if (res.code == util.ERR_OK) {
                const d = res.result;
                const articleStr = self.showColor(d.articleInfo.content);
                const updateLog = d.articleInfo.updateLog;
                const keys = [1110012, 1110011];
                const uids = ['117558573', '117521660'];

                WxParse.wxParse('article', 'html', articleStr, self, 20);

                if (updateLog && updateLog.length > 0) {
                    updateLog.forEach(function (item, index) {
                        const updateArticle = self.showColor(item.content);

                        WxParse.wxParse('upArticle[' + index + ']', 'html', updateArticle, self, 20);
                    });
                }

                self.setData({
                    articleInfo: d.articleInfo,
                    buttonInfo: d.buttonInfo,
                    freeFlag: d.freeFlag,
                    buyImg: d.images,
                    liveInfo: d.liveInfo
                });

                if ((sort == '' || sort == 0) && uids[0] == d.articleInfo.authorId) {
                    index = 0;
                    wx.setNavigationBarTitle({ title: '调研通' });
                } else if ((sort == '' || sort == 1) && uids[1] == d.articleInfo.authorId) {
                    index = 1;
                    wx.setNavigationBarTitle({ title: '券商晨会速递' });
                }

                self.btnStatusHandler();
                self.getBrowseCount();
                wx.hideLoading();
                util.statistics(keys[index], app);
            } else {
                wx.showToast({
                    title: res.message,
                    icon: 'none',
                    complete: function (r) {
                        setTimeout(() => {
                            wx.navigateBack({ changed: true });
                        }, 1500);
                    }
                })
            }
        }); 

        self.authorizeHandler();
    },
    // 获取文章阅读数
    getBrowseCount: function () {
        const self = this;
        const { articleId } = self.data;

        util.sendRequest({
            path: util.urls.getArticleCount,
            data: { articleId: articleId }
        }).then(res => {
            if (res.code == util.ERR_OK) {
                const d = res.result;

                self.setData({
                    count: d
                });
            }
        });
    },
    // 购买包时段成功后的回调
    successHandler () {
        const self = this;

        self.setData({
            refresh: true
        });

        self.getInfo();
    },
    // 按钮状态
    btnStatusHandler: function () {
        const self = this;
        const { buttonInfo, source, inviteUid } = self.data;

        self.setData({
            btnStatus: {
                pay: false,    // 单篇购买
                coupon: false, // 使用优惠券
                help: false,   // 帮解锁
                share: false   // 达到上限 
            },
            tips: ''
        })

        if (app.globalData.isLogin) { //已登录

            // 优惠券 开始
            if (buttonInfo.userCouponCount > 0) { //有优惠券
                self.setData({
                    ['btnStatus.coupon']: true
                });
            } else { //无优惠券
                self.setData({
                    ['btnStatus.pay']: true
                });
            }
            // 优惠券 结束

            if (source && inviteUid) {  //  有来源即APP分享的卡片，并且有分享者的uid（有可能会未登录分享）
                if (buttonInfo.userUnlockRecord < 3) {
                    self.setData({
                        ['btnStatus.help']: true,
                        tips: '解锁后，您将免费获得本文'
                    });
                } else {
                    self.setData({
                        ['btnStatus.share']: true,
                        tips: '已获得3张试读券'
                    });
                }
            }
        } else { //未登录

            self.setData({
                ['btnStatus.pay']: true
            });

            if (source && inviteUid) {
                self.setData({
                    ['btnStatus.help']: true,
                    tips: '解锁后，您将免费获得本文'
                });
            }
        }
    },
    // 单篇购买文章 || 使用优惠券
    payArticle(options) {
        const self = this;
        const { noScroll } = self.data;
        const { kind } = options.currentTarget.dataset;

        if (!app.globalData.isLogin) {
            // 调用登录接口 
            self.loginBack();
        } else {
            const authorizePhone = wx.getStorageSync('authorizePhone') || 0;

            // 用户登录 且 (用户信息中有手机号 || 用户没有手机号但是弹过一次授权)
            if (app.globalData.isLogin && (app.globalData.userInfo.userPhone || authorizePhone)) {

                // 调用自定义组件里 包时段接口
                // self.package = self.selectComponent("#package");
                // self.package.subInfo();
            }
        }
    },
    // 未登录，获取用户信息
    userBtnHandler(res) {
        const self = this;
        const d = res.detail.errMsg;

        if (d == 'getUserInfo:ok') {
            self.loginBack();
        } else {
            wx.getSetting({
                success: (res) => {
                    res.authSetting = {
                        "scope.userInfo": true,
                        "scope.userLocation": true
                    }
                }
            })
        }
    },
    // 获取手机号
    phoneBtnHandler(options) {
        const self = this;
        const d = options.detail.errMsg;

        if (d == 'getPhoneNumber:ok') {
            wx.checkSession({
                success: function () {

                    util.sendRequest({
                        path: util.urls.savePhoneNumber,
                        data: {
                            iv: options.detail.iv,
                            encryptedData: options.detail.encryptedData
                        }
                    }).then(res => {
                        if (res.code == util.ERR_OK) {
                            const d = res.result;

                            app.globalData.userInfo.userPhone = d;
                            wx.setStorageSync('userInfo', app.globalData.userInfo);
                        }
                    });
                },
                fail: function () {
                    util.login().then(res => {
                        const code = res.code;

                        util.sendRequest({
                            path: util.urls.savePhoneNumber,
                            data: {
                                code: code,
                                iv: options.detail.iv,
                                encryptedData: options.detail.encryptedData
                            }
                        }).then(res => {
                            if (res.code == util.ERR_OK) {
                                const d = res.result;

                                app.globalData.userInfo.userPhone = d;
                                wx.setStorageSync('userInfo', app.globalData.userInfo);
                            }
                        });
                    });
                }
            });
        }

        wx.setStorageSync('authorizePhone', 1);
        self.authorizeHandler();
    },
    // 购买和使用优惠券的按钮功能： 1、未登录：弹窗授权登录 2、已登录，但没手机号：弹窗授权手机号（有过一次弹窗记录则不弹）
    authorizeHandler() {
        const self = this;

        if (app.globalData.userInfo) {
            let str = '';

            if (!app.globalData.userInfo.userPhone) {
                const authorizePhone = wx.getStorageSync('authorizePhone') || 0;

                if (!authorizePhone) {
                    str = 'getPhoneNumber';
                }

            } else {
                str = '';
            }
            this.setData({
                userInfo: app.globalData.userInfo,
                useButtonType: str
            });
        } else {
            self.setData({
                useButtonType: 'getUserInfo'
            });
        }
    },
    // 文章之间跳转
    wxParseTagATap(e) {
        const { src } = e.currentTarget.dataset;
        let articleId = '', gid = '';

        articleId = this.GetQueryString(src, 'articleId');
        gid = this.GetQueryString(src, 'gid');

        if (articleId) {
            wx.navigateTo({
                url: `/pages/component/detail/detail?articleId=${articleId}&jump=article`
            });
        } else if (gid) {
            wx.navigateTo({
                url: `/pages/component/live/live?gid=${gid}`
            });
        }
    },
    GetQueryString: function (url, name) {
        const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        const index = url.indexOf('?') + 1;
        const r = url.substr(index).match(reg);
        if (r != null) return unescape(r[2]); return null;
    },
    // 为了显示可点击的链接
    showColor(data) {
        var temp = '';

        data = data.split(/(\<a.+?\a>)/)
        data.forEach(function (item) {
            var href = item.match(/href=\"([^(\}>)]+)\"/);

            if (href) {
                if (GetQueryString(href[1], 'articleId') || GetQueryString(href[1], 'gid')) {
                    temp += item;
                } else {
                    temp += '<span>' + item.replace(/<a.+?">|<\/a>/g, "") + '</span>';
                }
            } else {
                temp += item;
            }

        });

        function GetQueryString(url, name) {
            const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            const index = url.indexOf('?') + 1;
            const r = url.substr(index).match(reg);
            if (r != null) return unescape(r[2]); return null;
        }

        return temp;
    },
    // 点赞
    doZan() {
        const self = this;
        const { articleId, isLogin } = self.data;
        const { isZan, zanCount } = self.data.count;
        let flag = 'Y', num = zanCount;

        if (!isLogin) {
            return;
        }
        if (isZan) {
            flag = 'N';
            num--;
        } else {
            flag = 'Y';
            num++;
        }

        util.sendRequest({
            path: util.urls.doZan,
            data: {
                targetId: articleId,
                isDoZan: flag,
                from: 'miniProgram',
                zanType: 1
            }
        }).then(res => {
            if (res.success) {
                self.setData({
                    ['count.isZan']: !isZan,
                    ['count.zanCount']: num
                });
            }
        });
    },
    // 未登录点赞 先授权，后点赞
    bindgetuserinfo() {
        const self = this;

        self.loginBack();
    },
    // 登录成功后，重新刷新文章数据
    loginBack(fn) {
        const self = this;

        util.wxLoginHandler(function () {
            self.setData({
                userInfo: app.globalData.userInfo,
                isLogin: app.globalData.isLogin
            });

            self.getInfo();
        }, function () {
            fn && fn();
        });
    },
    // 购买文章后的弹窗
    hideTips() {
        const { refresh } = this.data;

        
        wx.setStorageSync('isPop', 1);

        this.setData({
            refresh: !refresh,
            isPop: 1
        });
    },
    JoinLive () {
        const self = this;

        self.hideTips();

        wx.navigateTo({
            url: `/pages/component/live/live`,
        });
    },
    // 帮好友解锁
    unlock() {
        const self = this;
        const { articleId, inviteUid, articleInfo, authorizePhone } = self.data;

        if (app.globalData.isLogin && (app.globalData.userInfo.userPhone || authorizePhone)) {

            util.sendRequest({
                path: util.urls.unlock,
                data: {
                    inviteUid: inviteUid,
                    articleId: articleId,
                    authorId: articleInfo.authorId
                }
            }).then(res => {
                if (res.code == util.ERR_OK) {
                    wx.showModal({
                        title: '解锁成功',
                        content: '您获得了一张试读券',
                        showCancel: false,
                        complete: function () {
                            self.getInfo();
                        }
                    });
                } else {
                    wx.showModal({
                        content: res.message,
                        showCancel: false,
                        complete: function () {
                            self.getInfo();
                        }
                    });
                }
            });
        }
    },
    goLive () {
        const self = this;
        const { isLogin, liveInfo } = self.data;

        if (isLogin) {
            wx.navigateTo({
                url: `/pages/component/live/live?gid=${liveInfo.gid}`,
            });
        } else {
            wx.switchTab({
                url: '/pages/tabBar/user/user',
            });
        }
    },
    // 发送模版消息
    sendMsgId(e) {
        const self = this;
        const { formId } = e.detail;
        const isLogin = app.globalData.isLogin;

        if (isLogin) {
            util.sendFormId({
                data: {
                    formId
                }
            });
        }
    },
    // 转发分享
    onShareAppMessage(res) {
        const self = this;
        const { articleInfo, sort } = self.data;
        const inviteUid = app.globalData.userInfo ? app.globalData.userInfo.userId : '';
        const titles = ['调研通抢先试读券，免费领取中', '第一时间获取券商晨会秘钥'];

        return {
            title: titles[sort],
            path: `/pages/component/detail/detail?articleId=${articleInfo.articleId}&inviteUid=${inviteUid}&sort=${sort}`,
            success: function (res) {
            },
            fail: function (res) {
            }
        }
    },
})