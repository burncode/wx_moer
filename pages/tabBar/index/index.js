//index.js
//获取应用实例
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        userInfo: null,
        userImg: util.staticFile + '/index/moer.jpg',
        staticFile: util.staticFile,
        type: 0, // 展示的类型： 0、摩研社； 1、摩股学院；
        info: {}, // 切换的TAB数据
        sort: 0, // 栏目的切换，默认显示第一项
        status: {
            showBriefFlag: [false, false],  //  TAB下的简介
            tabFlag: [true, true], // TAB 是否滑动的状态
            loading: [0, 0]  // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
        },
        tryReadArticles: [],  // 试读文章的数据
        latestArticles: {},  // 最新文章的数据
        videoInfo: {},
        videoNum: {
            videoLen: 4,  // 每次加载视频课程的数量
            videoMax: 4,  // 视频已加载的总量： 默认是4课
            videoType: ''    // 课程ID：选项卡
        },        
        scrollLeft: 0,
        sortTime: [],  // 记录最新文章列表最后一次加载的时间戳
        flag: true,   //  防止最新文章列表多次加载数据
        isContact: true, //  是显示联系客服还是显示领取试读券 （调研通，且未领取试读券） 
        couponInfo: null,
        canIUse: wx.canIUse('button.open-type.getUserInfo')
    },
    onShow: function () {
        const self = this;
        const { type, sort } = self.data;
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLogin = wx.getStorageSync('isLogin') || false;

        app.globalData.userInfo = userInfo;
        app.globalData.isLogin = isLogin;

        self.setData({
            userInfo: userInfo
        });

        self.isConcatHandler(type);
    },
    onLoad: function (options) {
        const self = this;
        let { type, sort } = options;
        
        type = type || self.data.type;
        sort = sort || self.data.sort;
        //初始化，页面路径带有参数，默认显示对应的内容

        if (app.globalData.userInfo) {
            self.setData({
                userInfo: app.globalData.userInfo,
                type: type,
                sort: sort
            });
        } else if (self.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                self.setData({
                    userInfo: app.globalData.userInfo,
                    type: type,
                    sort: sort
                });

                // 当我拒绝授权登录，然后重新授权成功后，获取 是否显示优惠券的相关信息
                self.getCouponInfo();
            }
        } else {

        }
        
        self.switchHandler(type);
        self.getUnReadMsg();
    },
    //展示类型的切换： 0、摩研社； 1、摩股学院；
    changeType: function (e) {
        const self = this;
        const num = e.currentTarget.dataset.type;
        const tabStr = 'status.tabFlag';
        
        this.showBrief(e, true);
        this.setData({
            type: num,
            sort: 0,
            [tabStr]: [true, true]
        });

        self.switchHandler(num);
        self.isConcatHandler(num);
    },
    //Tab滑动的时候change事件
    changeTab: function (e) {
        const self = this;
        const { current, currentItemId, source} = e.detail;
        const { type, sort } = this.data;
        const { tabFlag } = this.data.status;
        const { videoLen } = this.data.videoNum;
        const tabStr = 'status.tabFlag[' + sort +']';
        const videoType = 'videoNum.videoType';
        const videoMax = 'videoNum.videoMax';
        let sortNum = '';

        this.showBrief(e, true);
        if(source === 'touch') {
            
            this.setData({
                sort: current,
                [tabStr]: false,
                [videoMax]: videoLen
            });

            if (type == 0) {
                sortNum = this.data.info[type].services[current].authorId;

                // if (tabFlag[current]) {
                    this.tryReadArticleHandler(sortNum);
                    this.latestArticlesHandler(sortNum);
                // }

            } else if (type == 1) {
                sortNum = this.data.info[type].services[current].id;

                if (tabFlag[current]) {
                    this.collegeHandler(sortNum);
                }
            }

            this.setData({
                [videoType]: sortNum,
                // scrollLeft: 0  切换TAB的时候 将试读文章位置重置到最左边
            });

            self.isConcatHandler(type);
        };
    },
    //0、摩研社； 1、摩股学院的数据请求
    switchHandler: function(num) {
        const self = this;
        let { sort, isContact } = self.data;
        const str = 'info['+ num +']';
        const videoStr = 'videoNum.videoType';

        // //摩研社数据请求
        if (num == 0) {
            util.sendRequest(util.urls.mResearchIndex, {}, function (res) {
                if (res.data.code == util.ERR_OK) {
                    const d = res.data.result;

                    self.setData({
                        [str]: d
                    });

                    self.tryReadArticleHandler();
                    self.latestArticlesHandler();
                }
            });            
        } else if (num == 1) {
            util.sendRequest(util.urls.stockCollegeHome, {}, function (res) {
                if (res.data.code == util.ERR_OK) {
                    const d = res.data.result;

                    self.setData({
                        [str]: d,
                        [videoStr]: d.services[sort].id
                    });

                    self.collegeHandler();
                }
            });  
        }
    },
    //试读文章数据请求
    tryReadArticleHandler: function () {
        const self = this;
        const { info, type, sort } = self.data;

        util.sendRequest(util.urls.tryReadArticles, { authorId: info[type].services[sort].authorId }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

                self.setData({
                    tryReadArticles: d
                });
            }
        });
    },
    //最新文章的数据请求
    latestArticlesHandler: function () {
        const self = this;
        const { latestArticles, sort, sortTime, info, type, flag } = self.data;
        const str = 'latestArticles[' + sort + ']';
        const strTimes = 'sortTime[' + sort +']';

        if (flag) {
            self.setData({
                flag: false
            });

            util.sendRequest(util.urls.latestArticles, {
                authorId: info[type].services[sort].authorId,
                sortTime: sortTime[sort] || ''
            }, function (res) {
                if (res.data.code == util.ERR_OK) {
                    const d = res.data.result;
                    const loading = 'status.loading[' + sort + ']'

                    if (d.length > 0) {
                        self.setData({
                            [loading]: 0,
                            [str]: latestArticles[sort] ? latestArticles[sort].concat(d) : d,
                            [strTimes]: d.length > 0 ? d[d.length - 1].sortTime : sortTime[sort],
                            flag: true
                        });
                    } else {
                        self.setData({
                            [loading]: 2,
                            flag: true
                        });
                    }

                }
            });
        };        
    },
    //课程目录
    collegeHandler: function() {
        const self = this;
        const { info, sort, type, videoInfo } = self.data;

        util.sendRequest(util.urls.stockCollegeVedioList, { courseId: info[type].services[sort].id }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;
                const str = 'videoInfo.'+ sort;

                self.setData({
                    [str]: d
                });
            }
        });
    },
    getVideo() {
        const { videoInfo, sort } = this.data;
        const { videoLen, videoMax } = this.data.videoNum;
        const max = 'videoNum.videoMax';

        if (videoMax < videoInfo[sort].videoList.length) {
            this.setData({
                [max]: videoLen + videoMax
            })
        } else {
            this.setData({
                [max]: videoLen
            })
        }
    },
    //展示Tab下的简介
    showBrief: function (e, flag) {
        const { showBriefFlag } = this.data.status;
        const str = "status.showBriefFlag[" + this.data.sort +"]"; 

        this.setData({
            [str]: flag ? false : !showBriefFlag[this.data.sort]
        });
    },
    goToArticle: function(e) {
        const { id } = e.currentTarget;

        wx.navigateTo({
            url: `/pages/component/detail/detail?articleId=${id}`
        });
    },
    goToCourse: function(e) {
        const { id } = e.currentTarget;
        const { videoType } = this.data.videoNum;

        wx.navigateTo({
            url: `/pages/component/course/course?videoId=${id}&videoType=${videoType}`
        });
    },
    isConcatHandler (num) {
        const self = this;
        let { sort, isContact, userInfo } = self.data;
        const isLogin = app.globalData.isLogin;

        if (num == 0 && sort == 0) { //是否在调研通频道
            if (isLogin) {
                self.getCouponInfo();
            } else {
                self.setData({
                    isContact: false
                });
            }
        } else {
            self.setData({
                isContact: true
            });
        }
    },
    // 点击领取试读券
    goCoupon () {
        const self = this;
        let { couponInfo, type } = self.data;
        const isLogin = app.globalData.isLogin;

        if (isLogin) {
            self.freeCoupon(couponInfo);
        } else {
            util.wxLoginHandler(function () {
                self.freeCoupon(couponInfo);
            }, function () {
                wx.openSetting({
                    success: (res) => {
                        res.authSetting = {
                            "scope.userInfo": true
                        }
                    }
                })
            }); 
        }
    },
    getCouponInfo () {
        const self = this;
        let { isContact, userInfo } = self.data;

        util.sendRequest(util.urls.isGetCoupon, { uid: userInfo.userId }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

                if (d.flag == 'false') {
                    isContact = false;
                } else {
                    isContact = true;
                }

                self.setData({
                    isContact: isContact,
                    couponInfo: d
                });
            }
        });
    },
    // 领取免费优惠券 TODO
    freeCoupon(params) {
        const self = this;
        
        util.sendRequest(util.urls.freeCoupon, params, function (r) {
            if (r.data.code == util.ERR_OK) {

                wx.showToast({
                    title: r.data.result,
                    icon: 'success',
                    duration: 2000,
                    success: function () {
                        self.setData({
                            isContact: true
                        });
                    }
                });
            }
        });
    },
    getUnReadMsg() {
        util.sendRequest(util.urls.unReadMsg, {}, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

                if (d.msgCount > 0) {
                    wx.setTabBarBadge({
                        index: 1,
                        text: d.msgCount + '' // 必须为字符串
                    });
                }
            }
        });
    },
    onPullDownRefresh() { 
        const self = this;
        const { sort, type } = self.data;
        const str = 'status.loading[' + sort + ']';

        self.setData({
            [str]: 0
        });

        self.switchHandler(type);
        wx.stopPullDownRefresh();
    },
    onReachBottom () {
        const { type, sort, status } = this.data;
        const str = 'status.loading[' + sort +']';

        if( type == 0) {
            this.setData({
                [str]: 1
            });
            this.latestArticlesHandler();
        }
    },
    onShareAppMessage: function () {
        const { type, sort, info } = this.data;
        
        return {
            title: '摩尔投研',
            path: `/pages/tabBar/index/index?type=${type}&sort=${sort}`
        }
    }
})
