//app.js
const util = require('utils/util.js');

App({
    data: {
        timer: null
    },
    onLaunch: function (options) {
        const self = this;
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isLogin = wx.getStorageSync('isLogin') || false;
        
        self.globalData.userInfo = userInfo;
        self.globalData.isLogin = isLogin;

        self.scanQrcode(options);
    },
    onShow (options) {
        const self = this;

        wx.getSystemInfo({
            success: res => {
                const modelmes = res.model;
                let flag = false;

                if (modelmes.search('iPhone X') != -1) {
                    flag = true
                } 

                self.globalData.isIphoneX = flag;
            }
        });
        this.getUserInfo();
    },
    /**  
    * 获取用户信息  
    */
    getUserInfo(callback) {
        const self = this;
        let { timer } = self.data;
        let num = null;

        clearInterval(self.data.timer);

        if (self.globalData.userInfo) {
            typeof callback == "function" && callback(self.globalData.userInfo);

            // 已购消息
            self.data.timer = setInterval(function () {
                util.getUnReadMsg();
            }, 60000);

        } else {

            // 调用登录接口  
            // wx.login({
            //     success: function (res) {
            //         const code = res.code;

            //         wx.getUserInfo({
            //             success: function (d) {
            //                 const params = {
            //                     encryptedData: d.encryptedData,
            //                     iv: d.iv, 
            //                     code: code
            //                 };

            //                 util.sendRequest(util.urls.authorizedLogin, params, function(r) {
            //                     if (r.data.code == util.ERR_OK) {
            //                         const data = r.data.result;
            //                         let num = null;

            //                         self.globalData.userInfo = data;
            //                         self.globalData.isLogin = true
            //                         wx.setStorageSync('userInfo', self.globalData.userInfo);
            //                         wx.setStorageSync('isLogin', self.globalData.isLogin);

            //                         if (self.userInfoReadyCallback) {
            //                             self.userInfoReadyCallback(self.globalData.userInfo);
            //                         }

            //                         self.data.timer = setInterval(function () {
            //                             util.getUnReadMsg();
            //                         }, 60000);
            //                     }
            //                 });
            //             },
            //             fail: function (d) {
                            
            //             }
            //         })
            //     }
            // })
        }
    },  
    scanQrcode(options) {
        const self = this;
        const { channel } = options.query;
        const scene = decodeURIComponent(options.scene);
        let params = {};

        self.globalData.channel = channel || '';
        self.globalData.scene = scene;

        params = {
            channel: channel || '',
            scene: scene,
            uid: self.globalData.userInfo ? self.globalData.userInfo.userId : ''
        };

        wx.login({
            success: function (res) {
                util.sendRequest(util.urls.scanQrcode, params, function (r) { });
            }
        });
        
    },
    globalData: {
        userInfo: null,
        isIphoneX: false,
        isLogin: false,
        channel: '',
        scene: ''
    }
})