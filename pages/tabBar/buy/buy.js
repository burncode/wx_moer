// pages/buy/buy.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        isLogin: false,
        type: 0, // 头部内容切换： 0、更新信息； 1、我的订单；
        info: [{
            text: "msg",
            scroll: 1,
            scrollHeight: 0,
            loading: 0     // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
        }, {
            text: "order",
            scroll: 1,
            scrollHeight: 0,
            loading: 0     // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
        }],
        scrollNum: 0,
        msg: [],
        order: [],
        loader: { up: false, down: false},
        noticeNum: 1, //更新消息加载的页码
        orderNum: 1, // 我的订单页码
        pagesize: 10
    },
    onLoad: function (options) {
        const self = this;
        const scrollHeight = 'info[0].scrollHeight';

        self.setData({
            type: 0,
            info: [{
                text: "msg",
                scroll: 1,
                scrollHeight: 0,
                loading: 0     // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
            }, {
                text: "order",
                scroll: 1,
                scrollHeight: 0,
                loading: 0     // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
            }]
        });
    },
    onShow () {
        const self = this;
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLogin = wx.getStorageSync('isLogin') || false;
        const scrollHeight = 'info[0].scrollHeight';

        app.globalData.userInfo = userInfo;
        app.globalData.isLogin = isLogin;

        wx.getSystemInfo({
            success: function (res) {
                self.setData({
                    isLogin: isLogin,
                    [scrollHeight]: res.windowHeight
                });

                if (isLogin) {
                    self.init();
                } else {
                    self.setData({
                        msg: [],
                        order: []
                    });
                }
            }
        });
    },
    init () {
        const self = this;

        self.getNotice(1);
        self.getOrder(1);
        self.updateMsg();
    },
    // 获取更新消息
    getNotice: function (num) {
        const self = this;
        const { msg, pagesize } = self.data;

        util.sendRequest(util.urls.noticeList, { pageNum: num }, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;
                let load = 0;

                if(num != 1) {
                    load = d.length >= pagesize? 0 : 2
                } else {
                    load = d.length != 0 && d.length != 10 ? 2 : 0
                }

                self.setData({
                    noticeNum: num,
                    msg: num == 1 ? d : msg.concat(d),
                    ['info[0].loading']: load
                });
            }
            
            self.loadingEnd();
        });
    },
    // 获取购买记录
    getOrder: function (num) {
        const self = this;
        const { order, pagesize } = self.data;

        util.sendRequest(util.urls.payRecords, { 
            page: num,       // 页数
            pagesize: pagesize,  // 每页条数
            orderTypes: '1,6', // 订单类型：1/6
            goodsTypes: '1,6', // 商品类型
            payStatuss: 2  // 订单状态
         }, function (res) {
            if (res.data.errorCode == util.ERR_OK) {
                const d = res.data.rows;
                let load = 0;

                if (num != 1) {
                    load = d.length >= pagesize ? 0 : 2
                } else {
                    load = d.length != 0 && d.length != 10 ? 2 : 0
                }

                self.setData({
                    orderNum: num,
                    order: num == 1 ? d : order.concat(d),
                    ['info[1].loading']: load
                });
            }
            
            self.loadingEnd();
        });
    },
    goArticle (e) {
        const { id } = e.currentTarget;

        if (id) {
            wx.navigateTo({
                url: `/pages/component/detail/detail?articleId=${id}`
            })
        }
    },
    changeType: function(e) {
        const num = e.currentTarget.dataset.type;
        const self = this;
        const { noticeNum, orderNum } = self.data;
        const scrollHeight = 'info[' + num + '].scrollHeight';
        const scroll = 'info[' + self.data.type + '].scroll';


        wx.getSystemInfo({
            success: function (res) {
                self.setData({
                    [scrollHeight]: res.windowHeight
                });
            }
        }); 

        self.setData({
            // [scroll]: self.data.scrollNum,
            type: num
        }); 
    },
    updateMsg () {
        util.sendRequest(util.urls.updateMsg, {}, function (res) {
            if (res.data.code == util.ERR_OK) {

                wx.removeTabBarBadge({
                    index: 1
                });
            }
        });
    },
    // 下拉加载最新
    refresh: function () {
        const self = this;
        const { type } = this.data;
        
        self.loadingStart();
        
        if (type == 0) {
            self.getNotice(1);
        } else if (type == 1) {
            self.getOrder(1);
        }
    },
    //  上拉加载更多
    loadMore: function(e) {
        const self = this;
        let { type, info, noticeNum, orderNum, loadingStatus } = self.data;
        const str = 'info[' + type + '].loading';

        if (info[type].loading != 2) {

            self.setData({
                [str]: 1
            });

            if (type == 0) {
                noticeNum++;
                self.getNotice(noticeNum);
            } else if (type == 1) {
                orderNum++;
                self.getOrder(orderNum);
            }
        }
    },
    scrollHandler: function(e) {
        const self = this;
        const num = e.detail.scrollTop;

        self.data.scrollNum = num;
    },
    loadingStart: function () {
        const self = this;
        const upper = 'loader.up';

        self.setData({
            [upper]: true
        });
    },
    loadingEnd: function () {
        const self = this;
        const upper = 'loader.up';

        self.setData({
            [upper]: false
        });
    }
});