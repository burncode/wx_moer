// pages/user/user.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        isLogin: false,
        staticFile: util.staticFile,
        userInfo: {},
        coupon: 0,
        invite: 0,
        canIUse: wx.canIUse('button.open-type.feedback')
    },
    onLoad: function (options) {
        
    },
    onShow () {
        const self = this;

        self.setData({
            isLogin: app.globalData.isLogin,
            userInfo: app.globalData.userInfo
        });

        if (app.globalData.isLogin) {
            wx.setNavigationBarTitle({ title: '我' });
        } else {
            wx.setNavigationBarTitle({ title: '登录' });
        }
        
        self.getCount();
    },
    getCount () {
        const self = this;

        if (app.globalData.isLogin) {
            util.sendRequest({
                path: util.urls.getMyPageCount,
                data: { uid: app.globalData.userInfo.userId }
            }).then(res => {
                if (res.code == util.ERR_OK) {
                    const d = res.result;

                    self.setData({
                        coupon: d.couponCount,
                        invite: d.inviteCount
                    });
                }
            }); 
        }
    },
    switchAccount () {
        app.globalData.isLogin = false;
        app.globalData.userInfo = null;
        this.setData({
            isLogin: app.globalData.isLogin,
            userInfo: null
        });

        // 切换帐号后，清除本地缓存
        wx.clearStorage();
        wx.removeTabBarBadge({
            index: 1
        });

        if (app.globalData.isLogin) {
            wx.setNavigationBarTitle({ title: '我' });
        } else {
            wx.setNavigationBarTitle({ title: '登录' });
        }

        // 退出帐号后， 清除定时请求未读信息数
        clearInterval(app.data.timer);
    },
    wxLogin() {
        const self = this;

        util.wxLoginHandler(function () {

            if (app.globalData.isLogin) {
                wx.setNavigationBarTitle({ title: '我' });
            } else {
                wx.setNavigationBarTitle({ title: '登录' });
            }
            
            self.setData({
                userInfo: app.globalData.userInfo,
                isLogin: app.globalData.isLogin
            });
        }); 
    },
    goMoer() {
        wx.navigateTo({
            url: '/pages/component/login/login',
        });
    },
    phoneCall () {
        wx.makePhoneCall({
            phoneNumber: '400-803-6208'
        })
    },
    // 转发分享
    onShareAppMessage: function () {
        const { staticFile } = this.data;

        return {
            title: '调研通抢先试读券，免费领取中',
            imageUrl: `${staticFile}/share-00.jpg`,
            path: `/pages/tabBar/index/index?type=0&sort=0`
        }
    }
})