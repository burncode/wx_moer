// pages/component/live/live.js
const util = require('../../../utils/util.js');
const app = getApp();
const ERR_OK = 1000; //请求结果的状态 1000：成功

Page({
    data: {
        isLogin: false,
        gid: '47513290735617',
        staticFile: util.staticFile,
        uid: '',
        isIphoneX: app.globalData.isIphoneX,
        groupInfo: {}, // 直播间的信息
        type: 0,   // 默认显示区域，0： 直播区 1：交流区 
        groupsCache: {}, // 直播间相关信息
        userCache: {}, // 用户的相关信息
        num: 100, // 历史记录默认展示 3条
        isPrivate: false,  // 只看私密 
        msgList: {},
        role: {}, // 当前用户角色： 普通用户，播主，嘉宾，管理员，主持人
        status: {
            loading: [0, 0]  // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
        },
        onlyPrivate: {
            isShow: 0,
            isChange: 0
        }, // 只看私密
        isLoading: true, //  能否加载数据
        isMove: false,  // 是否能够拖拽加载
        maxTop: -100, // 拖动最大高度
        scrollTop: [0, 0], // 加载数据时，滚动的高度（解决滚动到上一次的位置）
        lastTop: [0, 0],   // 记录上一次内容的高度
    }, 
    onLoad: function (options) {
        const self = this;

        self.init(options);
    },
    init (options) {
        const self = this;
        const { gid, num } = self.data;
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
            wx.navigateTo({
                url: '/pages/component/login/login',
            });
        } else {
            self.setData({
                uid: app.globalData.userInfo.userId,
                gid: options.gid || gid,
                groupsCache: groupCache,
                isLogin: true
            });

            self.getPersonalInfo(gid, app.globalData.userInfo.userId, function () {
                const { gid, userCache, uid, num, type } = self.data;

                self.setData({
                    ['onlyPrivate.isShow']: userCache[uid + gid].private_expire_flag
                });
            });

            // 初始化 加载历史消息及当前用户在该直播间的角色信息
            self.getHistroy(gid, 0, num, function () {
                self.scrollLast(0);
            });
            self.getHistroy(gid, 1, num, function () {
                self.scrollLast(1);
            });
        }

        self.groupInfo();
    },
    groupInfo () {
        const self = this;
        const { gid } = self.data;

        util.sendRequest(util.urls.groupInfo, {
            gid: gid
        }, function (res) {
            if (res.data.code == 1000) {
                const d = res.data.data;

                self.setData({
                    groupInfo: d
                });

                wx.setNavigationBarTitle({ title: d.name });
            }
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
    tapTab (e) {
        const self = this;
        const { current } = e.currentTarget.dataset;

        self.setData({
            type: current
        });
    },
    loadHistory () {
        const self = this;
        const { gid, type } = self.data;

        self.getHistroy(gid, type, 20, function () {
            self.scrollLast(type);
        });
    },
    getHistroy (gid, type, amount, callback) {
        const self = this;
        let { num, msgList, status, groupsCache, onlyPrivate } = self.data;
        const count = amount || num;
        const loading = 'status.loading[' + type + ']';
        const show_type = {
            '00': '1',
            '01': '8',
            '10': '3',
            '11': '9'
        }; // 直播间类型： 1、直播区； 3、交流区

        if (status.loading[type] != 2) {

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
                if (res.data.code == ERR_OK) {
                    const datas = res.data.data;

                    let ext = {},
                        msg = null;

                    if (datas.length > 0) {
                        const oldTs = 'groupsCache.timeFlags[' + type + '].last';
                        const newTs = 'groupsCache.timeFlags[' + type + '].first';
                        const msgData = 'msgList[' + type + ']';
                        let list = [], timer = 0, timeStamp = '', dList = null;
                        
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

                        dList = (msgList[type] && msgList[type].length > 0) ? list.reverse().concat(msgList[type]) : list.reverse();

                        self.setData({
                            [oldTs]: datas[datas.length - 1].send_time, //  最旧一条消息的时间戳
                            [newTs]: dList[dList.length - 1].send_time, //  最新一条消息的时间戳
                            [loading]: 0,
                            [msgData]: dList,
                            isLoading: true
                        });

                        callback && callback();
                    } else {
                        self.setData({
                            [loading]: 2,
                            isLoading: true
                        });
                    }
                } else {
                    self.setData({
                        [loading]: 0,
                        isLoading: true
                    });
                }
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
                send_time: data.send_time,
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
                                data.msg = data.msg.replace(face, '<img style="vertical-align: top; width:20px;height:20px" class="emoji" src="' + emoji.path + emoji.map[face] + '" />');
                            }
                        }
                    }
                    
                    msg = {
                        data: '<div style="font-size:16px;">' + (reply ? '@' + data.nick_name + '：':'') + data.msg + '</div>',
                        type: 'txt',
                        mid: data.mid,
                        send: data.send,
                        recv: data.recv,
                        send_time: data.send_time,
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
                        // data: '<img class="img" style="width:auto; height:auto; max-width: 100%;" src="' + iSrc + '" />',
                        data: iSrc,
                        type: 'img',
                        size: data.msg.size,
                        mid: data.mid,
                        send: data.send,
                        recv: data.recv,
                        send_time: data.send_time,
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
    scrollLast (type) {
        const self = this;
        let { msgList, lastTop, scrollTop } = self.data;
        const last = 'to' + msgList[type][msgList[type].length - 1].mid; 
        const scorllT = 'scrollTop[' + type + ']'; 
        const lastT = 'lastTop[' + type +']';

        wx.createSelectorQuery().select('#' + last).boundingClientRect(function (rect) {
            let top = 0;

            self.setData({
                [scorllT]: rect.top - lastTop[type],
                [lastT]: rect.top
            })
        }).exec()
    },
    // 订阅包时段弹窗
    subPackage () {
        const self = this;

        // 调用自定义组件里 包时段接口
        self.package = self.selectComponent("#package");
        self.package.subInfo();
    },
    // 切换私密按钮
    changePrivate () {
        const self = this;
        const { onlyPrivate } = self.data;
        
        self.setData({
            ['onlyPrivate.isChange']: !onlyPrivate.isChange
        })
    },
    successHandler () {
        const self = this;

        self.init();
    },
    previewImg (e) {
        const self = this;
        const { src } = e.target.dataset;
        
        if (typeof (src) != 'undefined') {
            wx.previewImage({
                urls: [src] // 当前显示图片的http链接
            })
        } 
    },
    imgError (e) {
        const self = this;

        if (e.type == 'error') {
            
        }
        console.log(e)
    },
    // 拖动加载历史消息
    scroll (ev) {
        const self = this;
        const { maxTop, isMove } = self.data;
        const { scrollTop, scrollHeight } = ev.detail;

        if (scrollTop <= maxTop && !isMove) {
            self.setData({
                isMove: true
            });
        }
    },
    touchstart() {
        const self = this;

        self.setData({
            isMove: false,
            isLoading: true
        });
    },
    touchmove(ev) {
        const self = this;
        const { isMove, type } = self.data;
        const loading = 'status.loading[' + type + ']';

        if (isMove) {
            self.setData({
                [loading]: 1
            });
        }
    },
    touchend() {
        const self = this;
        const { isMove, isLoading } = self.data;

        if (isMove && isLoading) {
            self.loadHistory();
            self.setData({
                isMove: false
            });
            return
        }
    },
})