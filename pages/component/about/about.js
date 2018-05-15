// pages/component/desc/desc.js
var dataList = require('data.js');  

Page({
    data: {
        qa: dataList.qa,
        type: 0 // 显示的页面详情： 0、常见问题
    },
    onLoad: function (options) {
        const self = this;
        const { type } = options;

        self.setData({
            type: type
        });
        
        if (type == 0) {
            wx.setNavigationBarTitle({ title: '常见问题' });
        } else {
            // wx.setNavigationBarTitle({ title: '摩尔投研' });
        }
    }
})