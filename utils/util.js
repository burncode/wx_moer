const domain = 'https://www.moer.cn';
const staticFile = 'https://static.moer.cn/staticFile/img/miniProgram';
const urls = {
    'stockCollegeHome': '/miniProgram/v1/stockCollegeHome.json', // 摩股学院
    'mResearchIndex': '/miniProgram/v1/mResearchIndex.json',  //摩研社首页
    'tryReadArticles': '/miniProgram/v1/tryReadArticles.json', //试读文章
    'latestArticles': '/miniProgram/v1/latestArticles.json', //最新文章
    'stockCollegeVedioList': '/miniProgram/v1/stockCollegeVedioList.json', //摩股学院课程目录
    'articleDetails': '/miniProgram/v1/articleDetails.json', //文章详情页
    'payRecords': '/miniProgram/v1/pay_findPurchaseRecords.json', //购买记录
    'payOrder':'/miniProgram/v1/pay_gotoSaveOrder.json', //生成订单记录
    'payment': '/miniProgram/v1/pay_toPayOnInternetPayment.json', //生成微信支付
    'getArticleCount' :'/miniProgram/v1/getArticleCount.json',  //跟文章相关的计数， 如：文章阅读量
    'getMyPageCount': '/miniProgram/v1/getMyPageCount.json', // 我的页面相关计数
    'serviceBuyInfo': '/miniProgram/v1/serviceBuyInfo.json', // 购买摩研社服务 展示价格等信息
    'payPacket': '/miniProgram/v1/pay_addUserPacketRecord.json', // 生成包时段商品订单ID
    'noticeList': '/miniProgram/v1/noticeList.json', // 更新消息列表
    'userInfo': '/miniProgram/v1/userInfo.json',  // 用户信息
    'login': '/miniProgram/v1/login.json', // 摩尔账户登录
    'userCouponList': '/miniProgram/v1/userCouponList.json', // 我的优惠券
    'unReadMsg':'/miniProgram/v1/findUnReadMsg.json', //未读消息数
    'updateMsg': '/miniProgram/v1/updateMsgStatus.json', // 更新消息数状态
    'authorizedLogin': '/miniProgram/v1/authorizedLogin.json', // 微信授权登录
    'savePhoneNumber': '/miniProgram/v1/savePhoneNumber.json',  // 保存获取的手机号
    'freeCoupon': '/miniProgram/v1/freeCoupon.json', // 领取试读券
    'playCount': '/miniProgram/v1/playCount.json', // 播放次数
    'isGetCoupon': '/miniProgram/v1/isGetCoupon.json', // 调研通领取试读券
    'doZan': '/wapcommon_doZan.json',                   //文章详情页点赞
    'actLog': '/miniProgram/v1/actLog.json',   // 数据统计
};
const ERR_OK = 0; //请求结果的状态 0：成功

  /**
    * 接口公共访问方法
    * @param {String} urlPath 开发者服务器接口地址
    * @param {Object} params 请求的参数
    * @param {Object} success 成功回调
    * @param {Object} fail 失败回调
    * @param {String} mode 请求的方法，有效值：OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
   */
const sendRequest = function (urlPath, params, success, fail, mode) {
    const app = getApp();
    const pptId = app.globalData.userInfo ? app.globalData.userInfo.pptId : '';
    const sessionId = app.globalData.userInfo ? app.globalData.userInfo.sessionId : '';

    wx.request({
        url: domain + urlPath,
        data: params || {},
        method: mode || 'GET',
        header: {
            'content-type': 'application/json',
            'Cookie': 'JSESSIONID=' + sessionId,
            'pptId': pptId
        },
        success: function (res) {
            success(res);
        },
        fail: function (res) {
            fail(res);
        }
    })
};

// 登录接口
const wxLoginHandler = function (success, fail) {
    const app = getApp();

    // 调用登录接口 
    wx.showLoading({
        title: '微信登录中...',
        mask: true
    });

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

                    sendRequest(urls.authorizedLogin, params, function (r) {
                        wx.hideLoading();

                        if (r.data.code == ERR_OK) {
                            const data = r.data.result;
                            
                            app.globalData.userInfo = {
                                pptId: data.pptId,
                                sessionId: data.sessionId,
                                userId: data.userId,
                                userImg: data.userImg,
                                userName: data.userName,
                                userPhone: data.userPhone
                            };
                            app.globalData.isLogin = true
                            wx.setStorageSync('userInfo', app.globalData.userInfo);
                            wx.setStorageSync('isLogin', app.globalData.isLogin);

                            success && success(r);
                        } else {
                            
                        }
                    });
                },
                fail: function (d) {
                    if (d.errMsg == 'getUserInfo:fail auth deny') {
                        // wx.openSetting({
                        //     success: (res) => {
                        //         res.authSetting = {
                        //         "scope.userInfo": true
                        //         }
                        //     }
                        // })
                        fail && fail(d);
                    } else {
                        fail && fail(d);
                    }
                    
                    wx.hideLoading();
                }
            })
        }
    })
};

const statistics = function (key, app) {
    const params = {
        key: key,
        value: ''
    };

    sendRequest(urls.actLog, params, function (r) {

        if (r.data.code == ERR_OK) {
            const data = r.data.result;

        } else {

        }
    });
}

module.exports = {
    domain: domain,
    urls: urls,
    ERR_OK: ERR_OK,
    sendRequest: sendRequest,
    wxLoginHandler: wxLoginHandler,
    staticFile: staticFile,
    statistics: statistics
}
