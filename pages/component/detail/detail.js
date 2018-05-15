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
        refresh: false,   // 是否 是购买后重新请求
        inviteUid: '',  // 当前文章分享者的UID
        articleInfo: null,        // 文章的详情数据
        buttonInfo: {},         // 按钮的状态数据
        showModalStatus: false, // 购买文章的对话框
        btnStatus: {
            pay: false,    // 单篇购买
            coupon: false, // 使用优惠券
            receive: false // 免费领取优惠券
        },
        tips: '最多可得3张免费试读券', // 按钮下优惠券的提示
        count: {}, // 文章阅读数、购买数、点赞数......
        serviceBuyInfo: {},  // 购买摩研社服务 展示价格等信息
        pack: ['包月', '包季', '包年'],
        agreementStatus: false,
        isAgree:true,  // 是否同意包时段协议
        useCouponStatus: false,
        useButtonType: '',  // 未登录时，按钮授权登录；已登录且未填写手机号，则是授权手机号
        authorizePhone: 0, // 手机号是否弹窗授权
        isPop: 0 // 是否显示购买文章后的弹窗
    },
    onShow: function () {
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
        const { articleId, inviteUid, sort } = options;

        this.setData({
            articleId: articleId || '',
            sort: sort || 0,
            inviteUid: inviteUid || ''
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
        const { articleId, refresh, inviteUid } = self.data;

        util.sendRequest(util.urls.articleDetails, {
            articleId: articleId, // 文章ID
            refresh: refresh,
            inviteUid: inviteUid         // 邀请者UID
        }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;
                let articleStr = d.articleInfo.content.replace(/&nbsp;/g, '');

                WxParse.wxParse('article', 'html', articleStr, self, 20);

                self.setData({
                    articleInfo: d.articleInfo,
                    buttonInfo: d.buttonInfo
                });

                wx.setNavigationBarTitle({
                    title: d.articleInfo.title
                });

                self.btnStatusHandler();
                self.getBrowseCount();
                self.articleInfo();
                wx.hideLoading();
            } else {
                wx.showToast({
                    title: res.data.message,
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
    getBrowseCount: function() {
        const self = this;
        const { articleId } = self.data;

        util.sendRequest(util.urls.getArticleCount, { articleId: articleId }, function (res) {
            if (res.data.code == util.ERR_OK) {
                self.setData({
                    count: res.data.result
                });
            }
        });
    },
    // 单篇文章支付购买
    goPay: function () {
        const self = this;
        const { articleId, useCouponStatus, buttonInfo } = self.data;
        const params = {
            goodsId: articleId, // 文章ID
            goodsType: '1',   //  商品类型 1、文章； 6、包时段
            orderType: '1', // 订单类型  1、文章购买  6、包时段购买
            payType: '19',  // 小程序购买
            couponId: '',  // 优惠券id
            checkoutType: ''  // 优惠券类型 1,.优惠券 2.卡券
        };

        if (useCouponStatus) {
            params['couponId'] = buttonInfo.couponId;
            params['checkoutType'] = buttonInfo.checkoutType;

            wx.showModal({
                title: '确认使用免费券吗？',
                content: '',
                success: function (res) {
                    if (res.confirm) {
                        self.payHandler(params);  
                    }
                }
            });
        } else {
            self.payHandler(params);  
        }
    },
    // 购买包时段服务
    goSub: function (e) {
        const self = this;
        const { id } = e.currentTarget;
        const { articleInfo, isAgree } = self.data;

        if (isAgree) { 
            util.sendRequest(util.urls.payPacket, { writerId: articleInfo.authorId, packetPay_id: id }, function (res) {
                if (res.data.code == util.ERR_OK) {
                    const d = res.data.result;
                    const params = {
                        goodsId: d.id, // 文章ID
                        goodsType: '6',   //  商品类型 1、文章； 6、包时段
                        orderType: '6', // 订单类型  1、文章购买  6、包时段购买
                        payType: '19',  // 小程序购买
                        couponId: '',  // 优惠券id
                        checkoutType: ''  // 优惠券类型 1,.优惠券 2.卡券
                    };

                    self.payHandler(params);
                }
            });
        }
    },
    // 按钮状态
    btnStatusHandler: function () {
        const self = this;
        const { buttonInfo } = self.data;
        const tips = '';

        self.setData({
            btnStatus: {
                pay: false,    // 单篇购买
                coupon: false, // 使用优惠券
                receive: false // 免费领取优惠券
            }
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

            if (buttonInfo.userUnlockRecord < 3) { //优惠券未到达上限 显示领取优惠券
                self.setData({
                    ['btnStatus.receive']: true
                });
            } else {
                self.setData({
                    ['btnStatus.receive']: false
                });
            }
        } else { //未登录

            self.setData({
                ['btnStatus.pay']: true,
                ['btnStatus.receive']: true
            });
        }
    },
    // 单篇购买文章 || 使用优惠券
    payArticle (options) {
        const self = this;
        const { kind } = options.currentTarget.dataset;

        if (!app.globalData.isLogin) {
            // 调用登录接口 
            self.loginBack();
        } else {
            const authorizePhone = wx.getStorageSync('authorizePhone') || 0;

            // 用户登录 且 (用户信息中有手机号 || 用户没有手机号但是弹过一次授权)
            if (app.globalData.isLogin && (app.globalData.userInfo.userPhone || authorizePhone)) {
                if( kind == 1) {
                    self.setData({
                        useCouponStatus: true
                    });
                    
                }
                self.showModal();
            }
        }
    },
    // 购买摩研社服务 展示价格等信息
    articleInfo () {
        const self = this;
        const { articleInfo } = self.data;

        util.sendRequest(util.urls.serviceBuyInfo, {
            articleId: articleInfo.articleId,
            writerId: articleInfo.authorId
        }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

                self.setData({
                    serviceBuyInfo: d
                });
            }
        });
    },
    agreementHanler () {
        const self = this;
        const { isAgree } = self.data;

        self.setData({
            isAgree: !isAgree
        })
    },
    // 线上摩尔金融包时段服务协议内容
    showAgreement: function () {
        const { agreementStatus } = this.data;

        this.setData({
            agreementStatus: !agreementStatus
        })
    },
    // 选择是否使用优惠券
    couponHandler: function () {
        const self = this;
        const { useCouponStatus } = this.data;

        self.setData({
            useCouponStatus: !useCouponStatus
        });
    },
    // 支付流程
    payHandler: function (params) {
        const self = this;

        // 生成购买订单
        wx.showLoading({
            title: '加载中',
            mask: true
        });

        wx.login({
            success: r => {
                util.sendRequest(util.urls.payOrder, params, function (res) {
                    if (res.data.success) {
                        const d = res.data.data;

                        util.sendRequest(util.urls.payment, { 
                            orderId: d.orderId,
                            wxjsapiCode: r.code
                        }, function (da) {
                            wx.hideLoading();

                            if (da.data.success) {
                                const d = da.data.data;

                                if (da.data.errorCode == 30001) {  // 使用优惠券
                                    //使用免费券 弹窗提示成功！
                                    wx.showToast({
                                        title: '使用成功',
                                        success: () => {
                                            wx.showLoading({
                                                title: '加载中',
                                                mask: true
                                            });

                                            self.setData({
                                                refresh: true
                                            });
                                            self.getInfo();
                                            self.hideModal();
                                        }
                                    });
                                } else {
                                    //微信支付
                                    wx.requestPayment({
                                        timeStamp: d.timestamp,
                                        nonceStr: d.nonceStr,
                                        package: d.package,
                                        signType: 'MD5',
                                        paySign: d.paySign,
                                        complete: function (res) {
                                            if (res.errMsg === 'requestPayment:ok') {

                                                self.setData({
                                                    refresh: true
                                                });

                                                self.getInfo();
                                                self.hideModal();
                                            } else if (res.errMsg === 'requestPayment:fail cancel') {
                                                wx.showModal({
                                                    title: '提示',
                                                    content: '支付失败',
                                                    cancelText: '取消',
                                                    confirmText: '重新支付',
                                                    success: function (f) {
                                                        if (f.confirm) {
                                                            self.payHandler(params);
                                                        } else if (f.cancel) {

                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        wx.hideLoading();
                    }
                });
            }
        });
    },
    // 免费领取优惠券  
    receiveHandler() {
        const self = this;

        if (!app.globalData.isLogin) {
            // 调用登录接口 
            self.loginBack(function () {
                wx.showToast({
                    title: '领取失败',
                    icon: 'none',
                    duration: 2000
                });
            });
        } else {
            const authorizePhone = wx.getStorageSync('authorizePhone') || 0;
            const { articleInfo, inviteUid, userInfo } = self.data;

            // 用户登录 且 (用户信息中有手机号 || 用户没有手机号但是弹过一次授权)
            if (app.globalData.isLogin && (app.globalData.userInfo.userPhone || authorizePhone)) {
                // 领取免费优惠券 TODO
                util.sendRequest(util.urls.freeCoupon, {
                    uid: userInfo.userId,
                    authorId: articleInfo.authorId,
                    inviteUid: inviteUid,
                    articleId: articleInfo.articleId
                }, function (r) {
                    if (r.data.code == util.ERR_OK) {

                        wx.showToast({
                            title: r.data.result,
                            icon: 'success',
                            duration: 2000,
                            complete: function () {
                                // 设置定时器，是因为API的BUG hideLoading 会把showToast 给关闭
                                setTimeout(function () {
                                    self.getInfo();
                                }, 1000)
                            }
                        });
                    }
                });
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
                    util.sendRequest(util.urls.savePhoneNumber, {
                        iv: options.detail.iv,
                        encryptedData: options.detail.encryptedData
                    }, function (r) {
                        const aaa = r;
                        if (r.data.code == util.ERR_OK) {

                            app.globalData.userInfo.userPhone = r.data.result;
                            wx.setStorageSync('userInfo', app.globalData.userInfo);
                        }
                    });
                },
                fail: function () {
                    wx.login({
                        success: res => {
                            const code = res.code;

                            util.sendRequest(util.urls.savePhoneNumber, {
                                code: code,
                                iv: options.detail.iv,
                                encryptedData: options.detail.encryptedData
                            }, function (r) {
                                const aaa = r;
                                if (r.data.code == util.ERR_OK) {

                                    app.globalData.userInfo.userPhone = r.data.result;
                                    wx.setStorageSync('userInfo', app.globalData.userInfo);
                                }
                            });
                        }
                    });
                }
            });
        }

        wx.setStorageSync('authorizePhone', 1);
        self.authorizeHandler();
    },
    // 购买和使用优惠券的按钮功能： 1、未登录：弹窗授权登录 2、已登录，但没手机号：弹窗授权手机号（有过一次弹窗记录则不弹）
    authorizeHandler () {
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
    wxParseTagATap (e) {
        const { src } = e.currentTarget.dataset;
        let articleId = '';

        articleId = this.GetQueryString(src, 'articleId');

        if (articleId) {
            wx.navigateTo({
                url: `/pages/component/detail/detail?articleId=${articleId}`
            });
        }
    },
    GetQueryString: function (url, name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var index = url.indexOf('?') + 1;
        var r = url.substr(index).match(reg);
        if (r != null) return unescape(r[2]); return null;
    },
    // 显示对话框 
    showModal: function () {
        const self = this;

        self.setData({
            showModalStatus: true
        })
    },
    // 隐藏对话框
    hideModal: function () {
        this.setData({
            showModalStatus: false
        });
    },
    // 点赞
    doZan () {
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

        util.sendRequest(util.urls.doZan, {
            targetId: articleId,
            isDoZan: flag,
            from:'miniProgram',
            zanType: 1
        }, function (r) {
            if (r.data.success) {
                self.setData({
                    ['count.isZan']: !isZan,
                    ['count.zanCount']: num
                });
            }
        });
    },
    // 未登录点赞 先授权，后点赞
    bindgetuserinfo () {
        const self = this;

        self.loginBack();
    },
    // 登录成功后，重新刷新文章数据
    loginBack (fn) {
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
    hideTips () {
        const { refresh } = this.data;

        wx.setStorageSync('isPop', 1);

        this.setData({
            refresh: !refresh,
            isPop: 1
        })
    },
    // 转发分享
    onShareAppMessage(res) {
        const self = this;
        const { articleInfo, sort } = self.data;
        const inviteUid = app.globalData.userInfo ? app.globalData.userInfo.userId:'';
        const titles = ['调研通抢先试读券，免费领取中', '第一时间获取券商晨会秘钥'];

        return {
            title: titles[sort],
            path: `/pages/component/detail/detail?articleId=${articleInfo.articleId}&inviteUid=${inviteUid}&sort=${sort}`,
            success: function (res) {
            },
            fail: function (res) {
            }
        }
    }
})