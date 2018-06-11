// pages/component/package/package.js
const util = require('../../../utils/util.js');

Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    properties: {
        serviceBuyInfo: { // 包时段服务相关信息
            type: Object,
            value: {}
        },
        showModalStatus: {
            type: Boolean,
            value: false
        },
        articleId: { // 购买摩研社服务 展示价格等信息
            type: String,
            value: ''
        },
        authorId: {
            type: String,
            value: ''
        }
    },
    data: {
        isAgree: true,  // 是否同意包时段协议
        agreementStatus: false,
        staticFile: util.staticFile,
        pack: ['包月', '包季', '包年'],
        chooseMask: false, // 选择优惠券背景遮罩
        zIndex: 1000,
    },
    methods: {
        // 购买包时段服务
        goSub: function (e) {
            const self = this;
            const { id } = e.currentTarget;
            const { isAgree, authorId } = self.data;

            if (isAgree) {
                util.sendRequest(util.urls.payPacket, { writerId: authorId, packetPay_id: id }, function (res) {
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
        // 包时段支付流程
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

                                    if (da.data.errorCode != 30001) {  // 30001 是使用0折优惠券 不走微信支付流程
                                        //微信支付
                                        wx.requestPayment({
                                            timeStamp: d.timestamp,
                                            nonceStr: d.nonceStr,
                                            package: d.package,
                                            signType: 'MD5',
                                            paySign: d.paySign,
                                            complete: function (res) {
                                                if (res.errMsg === 'requestPayment:ok') {
                                                    self._successHandler();
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
                                                                self._fileHandler();
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
        // 同意协议按钮
        agreementHanler() {
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
        chooseCoupon () {
            const self = this;

            self.showMask();
        },
        _successHandler() {
            // 购买触发成功的回调
            this.triggerEvent("successHandler")
        },
        _fileHandler() {
            // 购买触发失败的回调
            this.triggerEvent("fileHandler")
        },
        // 显示对话框 
        showMask: function () {
            const self = this;
            let { zIndex } = self.data;

            zIndex++;
            self.setData({
                showModalStatus: true,
                zIndex: zIndex
            })
        },
        // 隐藏对话框
        hideMask: function () {
            const self = this;
            let { zIndex } = self.data;

            zIndex--;

            if (zIndex === 999) {
                self.setData({
                    showModalStatus: false
                });
            }

            self.setData({
                zIndex: zIndex
            });
        },
    }
})