// pages/login/login.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
    data: {
        warn: false,
        user: '',
        passwd: '',
        warnTxt: ''
    },
    //用户名和密码输入框事件
    usernameInput: function (e) {
        this.setData({
            user: e.detail.value
        })
    },
    passwordInput: function (e) {
        this.setData({
            passwd: e.detail.value
        })
    },
    loginHandler: function () {
        const self = this;
        let params = {};
        const { user, passwd } = self.data;

        if(user == '' || passwd == '') {

            self.showWarn();
            if (user == '') {
                self.setData({
                    warnTxt: '请输入摩尔金融账户'
                });
                return;
            }

            if (passwd == '') {
                self.setData({
                    warnTxt: '请输入登录密码'
                });
                return;
            }
        } else {
            wx.login({
                success: function (res) {
                    const code = res.code;

                    params = {
                        code: code,
                        email: user,
                        password: passwd
                    }
                    util.sendRequest(util.urls.login, params, function (res) {
                        if (res.data.code == util.ERR_OK) {
                            const d = res.data.result;

                            app.globalData.userInfo = {
                                pptId: d.pptId,
                                sessionId: d.sessionId,
                                userId: d.userId,
                                userImg: d.userImg,
                                userName: d.userName,
                                userPhone: d.userPhone
                            };
                            app.globalData.isLogin = true
                            wx.setStorageSync('userInfo', app.globalData.userInfo);
                            wx.setStorageSync('isLogin', app.globalData.isLogin);

                            wx.switchTab({
                                url: '/pages/tabBar/user/user',
                            });
                        } else {
                            self.setData({
                                warnTxt: res.data.message
                            });
                            self.showWarn();
                        }
                    });
                }
            });
            
        }
    },
    phoneCall() {
        wx.makePhoneCall({
            phoneNumber: '010- 59082422'
        })
    },
    showWarn () {
        const self = this;

        self.setData({
            warn: true
        });

        setTimeout(function () {
            self.hideWarn();
        }, 2000); 
    },
    hideWarn () {
        this.setData({
            warn: false
        })
    }
})