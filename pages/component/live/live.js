// pages/component/live/live.js
const util = require('../../../utils/util.js');
const app = getApp();
const ERR_OK = 1000; //请求结果的状态 1000：成功

Page({
    data: {
        gid: '16823659593729',
        staticFile: util.staticFile,
        uid: '',
        type: 1,   // 默认显示区域，0： 直播区 1：交流区 
        groupsCache: {}, // 直播间相关信息
        userCache: {}, // 用户的相关信息
        num: 5, // 历史记录默认展示 3条
        isPrivate: false,  // 只看私密 
        msgList: {},
        role: {}, // 当前用户角色： 普通用户，播主，嘉宾，管理员，主持人
        status: {
            loading: [0, 0]  // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
        },
        toView: [], // 滚动到该元素
        onlyPrivate: {
            isShow: 0,
            isChange: 0
        }, // 只看私密
        showModalStatus: false, // 购买包时段的对话框
    }, 
    onLoad: function (options) {
        const self = this;
        const { gid, num, type } = self.data;

        if (!app.globalData.userInfo) {
            return false;
        }

        self.setData({
            uid: app.globalData.userInfo.userId
        });
        self.getPersonalInfo(gid, app.globalData.userInfo.userId, function () {
            const { gid, userCache, uid, num, type } = self.data;

            self.setData({
                ['onlyPrivate.isShow']: userCache[uid + gid].private_expire_flag
            });
        });
    },
    onShow: function (options) {
        const self = this;
        const { gid, userCache, uid, num, type } = self.data;
        const time = new Date().getTime();
        let groupCache = {};

        groupCache = {
            timeFlags: {
                0: {
                    first: time,  // 历史记录里最新的一条时间戳
                    last: time  // 历史记录里最后一条消息的时间戳，拉取历史记录
                },
                1: {
                    first: time,
                    last: time
                }
            },
            scroll: [0, 0]
        };

        if (!app.globalData.userInfo) {
            return false;
        }

        self.setData({
            groupsCache: groupCache
        });
        // 初始化 加载历史消息及当前用户在该直播间的角色信息
        self.getHistroy(gid, 0, num);
        self.getHistroy(gid, 1, num, function () {
            self.scrollLast();
        });
    },
    changeTab (e) {
        const self = this;
        const { current, currentItemId, source } = e.detail;
        const { gid, type } = self.data;
        
        if (source === 'touch') {
            self.setData({
                type: current
            });
        };
    },
    loadHistory () {
        const self = this;
        const { gid, type, msgList } = self.data;

        wx.startPullDownRefresh();
        self.getHistroy(gid, type, 20, function() {
            self.scrollLast(); 
        });  
    },
    getHistroy (gid, type, amount, callback) {
        const self = this;
        let { num, msgList, status, groupsCache, toView, onlyPrivate } = self.data;
        const count = amount || num;
        const loading = 'status.loading[' + type + ']';
        const toViews = wx.getStorageSync('toView') || toView;
        const show_type = {
            '00': '1',
            '01': '8',
            '10': '3',
            '11': '9'
        }; // 直播间类型： 1、直播区； 3、交流区

        if (status.loading[type] == 0) {

            self.setData({
                [loading]: 1
            });
            
            util.sendRequest(util.urls.getHistory, {
                from: 'wechat',  // 小程序特殊消息过滤
                gid: gid,
                show_type: show_type['' + type + Number(onlyPrivate.isChange)],
                count: count,
                ts: groupsCache.timeFlags[type].last
            }, function (res) {
                wx.stopPullDownRefresh();

                if (res.data.code == ERR_OK) {
                    const datas = res.data.data;

                    let ext = {},
                        msg = null;

                    if (datas.length > 0) {
                        const setTs = 'groupsCache.timeFlags[' + type + '].last';
                        const msgData = 'msgList[' + type + ']';
                        let list = [], timer = 0, timeStamp = '';
                        
                        datas.forEach((item, index) => {
                            ext = JSON.parse(item.extp);
                            msg = self.getMsgObj(item, ext, timeStamp);
                            msg['timeStamp'] = self.timeShift(timer, ext.time_stamp); // 处理好的时间戳
                            if (item.show_type != 8 && item.show_type != 9) {
                                msg['objects'] = self.sourceMsg(ext.objects);
                            }
                            
                            // 只看私密
                            if (onlyPrivate.isChange && (item.show_type != 8 && item.show_type != 9)) {
                                return false;
                            }

                            list.push(msg);
                            self.getPersonalInfo(item.recv, item.send);
                            timer = ext.time_stamp;
                        });

                        self.setData({
                            [setTs]: datas[datas.length - 1].send_time, //  最旧一条消息的时间戳
                            [loading]: 0,
                            [msgData]: (msgList[type] && msgList[type].length > 0) ? list.reverse().concat(msgList[type]) : list.reverse(),
                            toView: toViews
                        });
                    } else {
                        self.setData({
                            [loading]: 2
                        });
                    }
                } else {
                    self.setData({
                        [loading]: 0
                    });
                }

                callback && callback();
            }); 
        }
        
    },
    // 消息处理
    getMsgObj (data, ext, reply) {
        const self = this;
        const { groupsCache, userCache, gid, uid} = self.data;
        const info = userCache[uid + gid];
        let msg = null, time = null, localMsg = '', objects = null;

        if (info && info.private_expire_flag != 1 && (ext.show_type == 8 || ext.show_type == 9)) {

            // 没有权限的私密消息文本
            if (ext.show_type == 8) {
                localMsg = '<div style="font-size:16px;">' + (reply ? '@' + data.nick_name + '：' : '') + '一条私密直播，<span style="color:#e84c3d">立即订阅</span></div>';
            } else {
                localMsg = '<div style="font-size:16px;">' + (reply ? '@' + data.nick_name + '：' : '') + '一条私密交流，<span style="color:#e84c3d">立即订阅</span></div>';
            }

            msg = {
                data: localMsg,
                mid: data.mid,
                // ext: ext,
                send: data.send,
                recv: data.recv,
                show_type: data.show_type,
                subReply: (data.show_type == 8 || data.show_type == 9) ? true : false,
                subSource: (data.extp.show_type == 8 || data.extp.show_type == 9) ? true : false,
                privateIcon: !reply
            };
        } else {
            switch (String(data.msg_type)) {
                case '1':
                    // 文字
                    const emoji = util.Emoji;

                    for (var face in emoji.map) {
                        if (emoji.map.hasOwnProperty(face)) {
                            while (data.msg.indexOf(face) > -1) {
                                data.msg = data.msg.replace(face, '<img style="vertical-align: top;" class="emoji" src="' + emoji.path + emoji.map[face] + '" />');
                            }
                        }
                    }

                    
                    msg = {
                        data: '<div style="font-size:16px;">' + (reply ? '@' + data.nick_name + '：':'') + data.msg + '</div>',
                        mid: data.mid,
                        send: data.send,
                        recv: data.recv,
                        show_type: data.show_type,
                        privateIcon: false
                    };
                    break;
                case '2':
                    // 图片
                    let iSrc = null;

                    if (data.msg.flag) {
                        iSrc = data.msg.nurl.replace(/static.moer.cn/, 'www.moer.cn').replace(/.amr/, '.mp3');
                    } else {
                        iSrc = data.msg.url;
                    }

                    msg = {
                        data: '<img class="img" style="width:auto; height:auto; max-width: 100%;" src="' + iSrc + '" />',
                        mid: data.mid,
                        send: data.send,
                        recv: data.recv,
                        show_type: data.show_type,
                        privateIcon: false
                    };
                    break;
                case '3':
                    // 语音
                   
                    break;
                case '4':
                    // 表情
                    
                    break;
            }
        }

        return msg;
    },
    sourceMsg (objects) {
        const self = this;
        const obj = [];

        if (objects && objects.length > 0) {
            objects.forEach(function(item, index) {
                switch (item.type) {
                    case 114:
                        item['msg_type'] = 1;
                        obj.push(self.getMsgObj(item, item.extp, true));
                    break;
                }
            });
        }

        return obj;
    },
    //  获取角色在直播间的相关信息
    getPersonalInfo (gid, who, callback) {
        const self = this;
        const { userCache, role } = self.data;
        const cache = `userCache.` + who + gid;
        const roleInfo = `role.` + who + gid;

        if (!userCache[who + gid] && who != '') {
            self.setData({
                [cache]: '1' // 防止重复发送Ajax
            });
            
            util.sendRequest(util.urls.getPersonalInfo, {
                gid: gid,
                uid: who
            }, function (r) {
                const d = r.data;
                let info = {};

                if (d.code == ERR_OK) {
                    
                    if (d.data) {
                        if (d.data.role_flag == 1) {
                            info = { 'role': 'admin', 'title': '播主', 'part': 'admin' };
                        } else if (d.data.role_flag == 2) {
                            info = { 'role': 'manager', 'title': '管理员', 'part': 'manager' };
                        } else {
                            info = { 'role': 'normal', 'title': '用户', 'part': 'normal' };
                        }

                        if (d.data.is_host) {
                            info['role'] = 'host'
                            info['title'] = '主持人';
                        }

                        if (d.data.is_guest) {
                            info = { 'role': 'guest', 'title': '嘉宾', 'part': 'manager' };
                        }

                        self.setData({
                            [cache]: r.data.data,
                            [roleInfo]: info
                        })

                    }

                    callback && callback();
                }
            });
        }
    },
    //  时间戳
    timeShift (date, onlyToday) { //上一条信息的时间戳， 当前消息的时间戳
        const self = this;
        const day = 24 * 60 * 60 * 1000;
        const cur = new Date().getTime();
        const sub = Math.abs(onlyToday - date);
        let timeText = '';

        if (sub > 60000 || date == 0) {  // 当两条消息间隔大于一分钟
            if (new Date(Number(onlyToday)).toDateString() === new Date().toDateString()) {  // 判断当前时间戳是否是今天
                timeText = util.formatTime(onlyToday, "hh:mm:ss");
            } else if (cur - onlyToday < day * 7) { //  时间戳不是今天且小于7天
                timeText = util.formatTime(onlyToday, "EEE hh:mm:ss");
            } else { // 大于7天，显示完整的时间戳
                timeText = util.formatTime(onlyToday);
            }

        }

        return timeText;
    },
    scrollLast () {
        const self = this;
        let { type, msgList, toView } = self.data;
        const mid = 'to' + msgList[type][0].mid;

        toView[type] = mid;

        wx.setStorageSync('toView', toView);
    },
    // 订阅包时段弹窗
    subPackage () {
        const self = this;

        self.showModal();
    },
    // 切换私密按钮
    changePrivate () {
        const self = this;
        const { onlyPrivate } = self.data;
        
        self.setData({
            ['onlyPrivate.isChange']: !onlyPrivate.isChange
        })
    },
    // 显示对话框 
    showModal: function () {
        const self = this;

        self.setData({
            showModalStatus: true
        })
    },
    // 隐藏对话框
    hideModal: function () {
        this.setData({
            showModalStatus: false
        });
    },
})