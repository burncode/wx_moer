// pages/user/user.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        isLogin: false,
        userInfo: {},
        coupon: 0,
        invite: 0,
        canIUse: wx.canIUse('button.open-type.getUserInfo')
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
            util.sendRequest(util.urls.getMyPageCount, { uid: app.globalData.userInfo.userId }, function (res) {
                if (res.data.code == util.ERR_OK) {
                    const d = res.data.result;

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

        wx.setStorageSync('userInfo', null);
        wx.setStorageSync('isLogin', false);
        wx.setStorageSync('authorizePhone', 0);

        wx.removeTabBarBadge({
            index: 1
        });

        if (app.globalData.isLogin) {
            wx.setNavigationBarTitle({ title: '我' });
        } else {
            wx.setNavigationBarTitle({ title: '登录' });
        }
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
            phoneNumber: '010- 59082422'
        })
    }
})