// pages/component/package/package.js
const util = require('../../../utils/util.js');

Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    properties: {
        articlePrice: {
            type: Number,
            value: 0
        },
        sort: { // 类别， 是从哪里过来的 文章或者直播间
            type: String,
            value: 'article'
        },
        goodsId: { // 商品ID： 文章ID  或者 包时段 为空
            type: String,
            value: ''
        },
        writerUid: { // 撰稿人ID ； 播主ID
            type: String,
            value: ''
        }
    },
    data: {
        showModalStatus: false, // 购买文章的对话框
        isAgree: true,  // 是否同意包时段协议
        agreementStatus: false,  // 是否展示协议内容
        couponStatus: false,  // 是否展示优惠券列表
        staticFile: util.staticFile,
        pack: ['包月', '包季', '包年'],
        choosePack: null,
        chooseMask: false, // 选择优惠券背景遮罩
        zIndex: 1000,
        serviceBuyInfo: {}, // 购买摩研社服务 展示价格等信息
        curIndex: null, // 默认选择第一个优惠券
        payType: '19', // 小程序购买
        goodsType: 6, // 默认是包时段类型
        couponList: [],  // 可用的优惠券列表
        packInfo: {}, // 包时段服务的相关信息
        price: '', // 价格计算的逻辑
        type: '' // 当前优惠券选择的是文章类型： 如： 'article' 文章优惠券列表，  或者其他文章包时段购买支付
    },
    methods: {
        // 包时段服务的信息
        subInfo() {
            const self = this;
            const { writerUid, goodsId, goodsType, articlePrice, showModalStatus } = self.data;

            wx.showLoading({
                title: '加载中...',
            });

            util.sendRequest({
                path: util.urls.serviceBuyInfo,
                data: { writerId: writerUid, articleId: goodsId }
            }).then(res => {
                wx.hideLoading();

                if (res.code == util.ERR_OK) {
                    const d = res.result;

                    self.setData({
                        serviceBuyInfo: d,
                        showModalStatus: !showModalStatus,
                        packInfo: d.packet,
                        price: articlePrice
                    }); 
                }
            }); 
        },
        // 包时段优惠券
        couponListHandler(goodsType, goodsId, price, fn) {
            const self = this;
            const { writerUid } = self.data;

            util.sendRequest({
                path: util.urls.optionCouponList,
                data: {
                    writerUid: writerUid,
                    goodsType: goodsType,
                    goodsId: goodsId,
                    price: price
                }
            }).then(res => {
                if (res.code == util.ERR_OK) {
                    const d = res.result;

                    self.setData({
                        couponList: d
                    });

                    fn && fn();
                }
            }); 
        },
        // 单篇文章支付购买
        goPay: function () {
            const self = this;
            const { goodsId, serviceBuyInfo } = self.data;
            const params = {
                goodsId: goodsId, // 文章ID
                goodsType: '1',   //  商品类型 1、文章； 6、包时段
                orderType: '1', // 订单类型  1、文章购买  6、包时段购买
                payType: '19',  // 小程序购买
                couponId: serviceBuyInfo.couponId || '',  // 优惠券id
                checkoutType: serviceBuyInfo.checkOutType || ''  // 优惠券类型 1,.优惠券 2.卡券
            };

            if (serviceBuyInfo.couponNum != '' && serviceBuyInfo.couponNum == 0 && serviceBuyInfo.checkOutType == 2) {
                wx.showModal({
                    title: '确认使用免费券吗？',
                    content: '',
                    success: function (res) {
                        if (res.confirm) {
                            util.payHandler(params, () => {
                                self._successHandler();
                            }, () => {
                                self._fileHandler();
                            });
                        }
                    }
                });
            } else {
                util.payHandler(params, () =>{
                    self._successHandler();
                }, () => {
                    self._fileHandler();
                });
            }
        },
        chooseArticleCoupon (e) {
            const self = this;
            const { couponStatus, goodsId, articlePrice } = self.data;
            const { id } = e.currentTarget.dataset;

            wx.showLoading({
                title: '加载中...',
            });

            self.setData({
                curIndex: id,
                type: 'article'
            });

            self.couponListHandler(1, goodsId, articlePrice, function () {
                wx.hideLoading();

                self.setData({
                    couponStatus: !couponStatus
                });
                self.showMask();

            });
        },
        // 购买包时段服务
        goSub: function (e) {
            const self = this;
            const { id } = e.currentTarget;
            const { index } = e.currentTarget.dataset;
            const { isAgree, writerUid, goodsType, goodsId, packInfo, payType } = self.data;

            if (isAgree) {
                util.sendRequest({
                    path: util.urls.payPacket,
                    data: { writerId: writerUid, packetPay_id: id }
                }).then(res => {
                    if (res.code == util.ERR_OK) {
                        const d = res.result;
                        const params = {
                            goodsId: d.id, // 文章ID
                            goodsType: goodsType,   //  商品类型 1、文章； 6、包时段
                            orderType: goodsType, // 订单类型  1、文章购买  6、包时段购买
                            payType: payType,  // 小程序购买
                            couponId: packInfo[index].couponId,  // 优惠券id
                            checkoutType: packInfo[index].checkOutType  // 优惠券类型 1,.优惠券 2.卡券
                        };

                        util.payHandler(params, () => {
                            self._successHandler();
                        }, () => {
                            self._fileHandler();
                        });
                    } else {
                        wx.showModal({
                            title: '购买失败',
                            content: res.data.message,
                            showCancel: false,
                            complete: function (res) {
                            }
                        });
                    }
                }); 
            }
        },
        // 查看包时段服务的优惠券
        chooseCoupon(e) {
            const self = this;
            const { couponStatus } = self.data;
            const { price, index, id, type } = e.currentTarget.dataset;

            wx.showLoading({
                title: '加载中...',
            });

            self.setData({
                choosePack: index,
                curIndex: id,
                type: ''
            });

            self.couponListHandler(6, '', price, function () {
                wx.hideLoading();

                self.setData({
                    couponStatus: !couponStatus
                });
                self.showMask();

            });
        },
        // 更换优惠券
        changeCoupon(e) {
            const self = this;
            const { packInfo, choosePack, couponList, type, serviceBuyInfo } = self.data;
            const { index } = e.currentTarget.dataset;
            const couponId = 'packInfo[' + choosePack + '].couponId';
            const couponNum = 'packInfo[' + choosePack + '].couponNum';
            const couponType = 'packInfo[' + choosePack + '].couponType';
            const checkOutType = 'packInfo[' + choosePack + '].checkOutType';

            if (type == 'article') {
                if (index != -1) {
                    self.setData({
                        ['serviceBuyInfo.checkOutType']: couponList[index].checkoutType,
                        ['serviceBuyInfo.couponId']: couponList[index].id,
                        ['serviceBuyInfo.couponNum']: couponList[index].money,
                        ['serviceBuyInfo.couponType']: couponList[index].type
                    });
                } else {
                    self.setData({
                        ['serviceBuyInfo.checkOutType']: '',
                        ['serviceBuyInfo.couponId']: '',
                        ['serviceBuyInfo.couponNum']: '',
                        ['serviceBuyInfo.couponType']: -1
                    });
                }
            } else {
                if (index != -1) {
                    self.setData({
                        curIndex: couponList[index].id,
                        [couponId]: couponList[index].id,
                        [checkOutType]: couponList[index].checkoutType,
                        [couponNum]: couponList[index].money,
                        [couponType]: couponList[index].type
                    });
                } else {
                    self.setData({
                        curIndex: null,
                        [couponId]: null,
                        [couponNum]: '',
                        [couponType]: '-1'
                    });

                }
            }

            self.hideMask();
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
            const self = this;
            const { agreementStatus } = self.data;

            self.setData({
                agreementStatus: !agreementStatus
            })
        },
        _successHandler() {
            const self = this;
            // 购买触发成功的回调
            self.triggerEvent("successHandler");
            self.hideMask();
        },
        _fileHandler() {
            const self = this;
            // 购买触发失败的回调
            self.triggerEvent("fileHandler");
            self.hideMask();
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

                zIndex = 1000;
            }

            self.setData({
                zIndex: zIndex,
                couponStatus: false
            });
        },
    }
})