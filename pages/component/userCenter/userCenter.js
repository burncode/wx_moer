// pages/userCenter/userCenter.js
const util = require('../../../utils/util.js');

Page({
    data: {
        types: 1, //数据类型：0、我的优惠券；
        title: ['我的优惠券'],
        list: []
    },

    onLoad: function (options) {
        let { types, title } = this.data;
        const params = {}

        types = options.type ? options.type : types;
        this.setData({
            types: types
        })
        wx.setNavigationBarTitle({ title: title[types] });

        if(types==0) {
            wx.setNavigationBarColor({
                frontColor: '#000000',
                backgroundColor: 'f6f6f7'
            });
            this.getCoupon(params);
        } else {
            
        }
    },
    getCoupon(params) {
        const self = this;

        util.sendRequest(util.urls.userCouponList, params, function (res) {
            if (res.data.code == util.ERR_OK) {
                const d = res.data.result;

                self.setData({
                    list: d
                })
            }
        });
    },
    useCoupon (e) {
        const { type } = e.currentTarget.dataset;
        let num = '';

        if (type == 1) {
            num = 1;
        } else if (type == 2) {
            num = 0;
        }

        wx.reLaunch({
            url: `/pages/tabBar/index/index?type=0&sort=${num}`
        })
    }
})