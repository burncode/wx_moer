//app.js
const util = require('utils/util.js');

App({
    data: {
        timer: null
    },
    onLaunch: function () {
        const self = this;
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLogin = wx.getStorageSync('isLogin') || false;
        
        self.globalData.userInfo = userInfo;
        self.globalData.isLogin = isLogin;
    },
    onLoad: function (options) {
    },
    onShow (options) {
        const self = this;

        this.getUserInfo();
    },
    /**  
    * 获取用户信息  
    */
    getUserInfo(callback) {
        const self = this;

        if (self.globalData.userInfo) {
            typeof callback == "function" && callback(self.globalData.userInfo);

            // 已购消息
            setInterval(function () {
                self.getUnReadMsg();
            }, 60000);

        } else {

            // 调用登录接口  
            wx.login({
                success: function (res) {
                    const code = res.code;

                    wx.getUserInfo({
                        success: function (d) {
                            const params = {
                                encryptedData: d.encryptedData,
                                iv: d.iv, 
                                code: code
                            };

                            util.sendRequest(util.urls.authorizedLogin, params, function(r) {
                                if (r.data.code == util.ERR_OK) {
                                    const data = r.data.result;

                                    self.globalData.userInfo = data;
                                    self.globalData.isLogin = true
                                    wx.setStorageSync('userInfo', self.globalData.userInfo);
                                    wx.setStorageSync('isLogin', self.globalData.isLogin);

                                    if (self.userInfoReadyCallback) {
                                        self.userInfoReadyCallback(self.globalData.userInfo);
                                    }

                                    setInterval(function () {
                                        self.getUnReadMsg();
                                    }, 60000);
                                }
                            });
                        },
                        fail: function (d) {
                            
                        }
                    })
                }
            })
        }
    },  
    getUnReadMsg() {
        util.sendRequest(util.urls.unReadMsg, {}, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

                if (d.msgCount > 0) {
                    wx.setTabBarBadge({
                        index: 1,
                        text: d.msgCount + ''  // 必须为字符串
                    });
                }

            }
        });
    },
    globalData: {
        userInfo: null,
        isLogin: false
    }
})