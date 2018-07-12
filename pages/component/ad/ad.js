// pages/component/ad/ad.js
Page({
    data: {
        path: ''
    },
    onLoad: function (options) {
        const self = this;

        self.setData({
            path: options.url
        })
    }
})