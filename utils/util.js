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
    'unlock':'/miniProgram/v1/unlock.json', // 帮好友解锁
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
    'getHistory': '/v1/group/api/msg/history', // 获取直播间历史记录
    'lastestmsg': '/v1/group/api/msg/lastestmsg', // 获取直播间最新消息
    'getPersonalInfo': '/v1/group/api/group/member', // 获取个人信息
    'optionCouponList': '/miniProgram/v1/optionCouponList.json', // 包时段服务页面优惠券列表
    'prepare': '/v1/group/api/order/prepare', // 直播间包时段下单
    'groupInfo': '/v1/group/api/group/info', // 直播间的信息
    'lastestmsg': '/v1/group/api/msg/lastestmsg', // 最新消息
    'findAd': '/miniProgram/v1/findAd.json', // 广告
    'scanQrcode': '/miniProgram/v1/recordScanQrcode.json', // 扫码记录
    'sendTemplateMsg': '/miniProgram/v1/sendTemplateMsg.json', // 支付成功发送模版消息
    'recordFormId': '/miniProgram/v1/recordFormId.json', // 提交表单发送模版消息
};
const Emoji = {
    path: 'https://static.moer.cn/staticFile/img/emoji/',
    map: {
        '[微笑]': 'huanglianwx_thumb.gif',
        '[色眼]': 'huanglianse_thumb.gif',
        '[流泪]': 'sada_thumb.gif',
        '[爱你]': 'lovea_thumb.gif',
        '[白眼]': 'landeln_thumb.gif',
        '[抓狂]': 'crazya_thumb.gif',
        '[抱抱]': 'bba_thumb.gif',
        '[悲伤]': 'bs_thumb.gif',
        '[鄙视]': 'bs2_thumb.gif',
        '[闭嘴]': 'bz_thumb.gif',
        '[馋嘴]': 'cza_thumb.gif',
        '[太开心]': 'mb_thumb.gif',
        '[偷笑]': 'heia_thumb.gif',
        '[吃惊]': 'cj_thumb.gif',
        '[给力]': 'geiliv2_thumb.gif',
        '[鼓掌]': 'gza_thumb.gif',
        '[哈哈]': 'laugh.gif',
        '[哈欠]': 'haqianv2_thumb.gif',
        '[害羞]': 'shamea_thumb.gif',
        '[流汗]': 'sweata_thumb.gif',
        '[黑线]': 'h_thumb.gif',
        '[生气]': 'hatea_thumb.gif',
        '[挤眼]': 'zy_thumb.gif',
        '[可爱]': 'tza_thumb.gif',
        '[可怜]': 'kl_thumb.gif',
        '[得意]': 'cool_thumb.gif',
        '[发困]': 'kunv2_thumb.gif',
        '[勾引]': 'come_thumb.gif',
        '[发怒]': 'angrya_thumb.gif',
        '[怒骂]': 'numav2_thumb.gif',
        '[亲亲]': 'qq_thumb.gif',
        '[疑问]': 'yw_thumb.gif',
        '[阴险]': 'yx_thumb.gif',
        '[伤心]': 'unheart.gif',
        '[生病]': 'sb_thumb.gif',
        '[失望]': 'sw_thumb.gif',
        '[衰了]': 'cry.gif',
        '[睡觉]': 'huangliansj_thumb.gif',
        '[思考]': 'sk_thumb.gif',
        '[呕吐]': 't_thumb.gif',
        '[挖鼻]': 'wabi_thumb.gif',
        '[晕头]': 'dizzya_thumb.gif',
        '[委屈]': 'wq_thumb.gif',
        '[嘻嘻]': 'tootha_thumb.gif',
        '[笑哭]': 'xiaoku_thumb.gif',
        '[猪头]': 'pig.gif',
        '[爱心]': 'hearta_thumb.gif',
        '[别出声]': 'x_thumb.gif',
        '[左哼哼]': 'zhh_thumb.gif',
        '[右哼哼]': 'yhh_thumb.gif',
        '[拜拜]': '88_thumb.gif',
        '[bad]': 'sad_thumb.gif',
        '[弓虽]': 'good_thumb.gif',
        '[小狗]': 'doge_thumb.gif',
        '[no]': 'buyao_org.gif',
        '[ok]': 'ok_thumb.gif',
        '[胜利]': 'ye_thumb.gif'
    }
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
            fail && fail(res);
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
                        code: code,
                        channel: app.globalData.channel,
                        scene: app.globalData.scene
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

                            clearInterval(app.data.timer);
                            app.data.timer = setInterval(function () {
                                getUnReadMsg();
                            }, 60000);
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

// 摩尔统计
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

// 获取未读数
const getUnReadMsg = function () {
    sendRequest(urls.unReadMsg, {}, function (res) {
        if (res.data.code == ERR_OK) {
            const d = res.data.result;

            if (d.msgCount > 0) {
                wx.setTabBarBadge({
                    index: 1,
                    text: d.msgCount + ''  // 必须为字符串
                });
            }
        }
    });
};

// 时间戳转换
const formatTime = (date, format) => { // 毫秒时间戳； 日期格式："yyyy-MM-dd hh:mm:ss EEE"
    const t = new Date(Number(date));
    const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const o = {
        "M+": t.getMonth() + 1, //月份   
        "d+": t.getDate(), //日   
        "h+": t.getHours(), //小时   
        "m+": t.getMinutes(), //分   
        "s+": t.getSeconds() //秒   
    };
    format = format || "yyyy-MM-dd hh:mm:ss";

    if (/(y+)/.test(format)) { //根据y的长度来截取年  
        format = format.replace(RegExp.$1, (t.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    if (/(E+)/.test(format)) { // 星期
        format = format.replace(RegExp.$1, (weekday[t.getDay()] + ""));
    }
    
    for (var k in o) { // 时分秒
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }

    return format;
};

// 购买文章、包时段
const payHandler = function (params, successHandler, failHandler) {
    const self = this;

    // 生成购买订单
    wx.showLoading({
        title: '加载中',
        mask: true
    });

    wx.login({
        success: r => {
            sendRequest(urls.payOrder, params, function (res) {
                if (res.data.success) {
                    const d = res.data.data;

                    sendRequest(urls.payment, {
                        orderId: d.orderId,
                        wxjsapiCode: r.code
                    }, function (da) {
                        wx.hideLoading();

                        if (da.data.success) {
                            const d = da.data.data;

                            if (da.data.errorCode != 30001) {  // 30001 是使用0折优惠券 不走微信支付流程
                                //微信支付
                                wx.requestPayment({
                                    timeStamp: d.timestamp,
                                    nonceStr: d.nonceStr,
                                    package: d.package,
                                    signType: 'MD5',
                                    paySign: d.paySign,
                                    success: function() {
                                        setTimeout(()=>{
                                            sendRequest(urls.sendTemplateMsg, {
                                                orderType: params.orderType,
                                                goodsType: params.goodsType,
                                                goodsId: params.goodsId,
                                                prepayId: d.package
                                            }, function (r) {

                                            });
                                        }, 3 * 60 * 1000);
                                    },
                                    complete: function (res) {
                                        if (res.errMsg === 'requestPayment:ok') {
                                            successHandler && successHandler();
                                        } else if (res.errMsg === 'requestPayment:fail cancel') {
                                            wx.showModal({
                                                title: '提示',
                                                content: '支付失败',
                                                cancelText: '取消',
                                                confirmText: '重新支付',
                                                success: function (f) {
                                                    if (f.confirm) {
                                                        payHandler(params);
                                                    } else if (f.cancel) {
                                                        failHandler && failHandler();
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                // 使用免费券 弹窗提示成功！
                                wx.showToast({
                                    title: '使用成功',
                                    success: () => {
                                        wx.showLoading({
                                            title: '加载中',
                                            mask: true
                                        });

                                        successHandler && successHandler();
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
};

// 发送formId 模版消息
const sendFormIdHandler = function (formId) {
    sendRequest(urls.recordFormId, { formId: formId}, function (res) {
    });
};

module.exports = {
    domain: domain,
    urls: urls,
    ERR_OK: ERR_OK,
    sendRequest: sendRequest,
    wxLoginHandler: wxLoginHandler,
    staticFile: staticFile,
    statistics: statistics,
    getUnReadMsg: getUnReadMsg,
    Emoji: Emoji,
    formatTime: formatTime,
    payHandler: payHandler,
    sendFormId: sendFormIdHandler
}
