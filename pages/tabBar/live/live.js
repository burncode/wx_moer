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
        show_type: ['1', '3'], // 直播间类型： 1、直播区； 3、交流区
        num: 5, // 历史记录默认展示 3条
        isPrivate: false,  // 只看私密 
        msgList: {},
        role: {}, // 当前用户角色： 普通用户，播主，嘉宾，管理员，主持人
        status: {
            loading: [0, 0]  // 加载更多的状态： 0、未加载； 1、加载中； 2、没有更多内容
        },
        aaa: 0
    }, 
    onLoad: function (options) {
        const self = this;
        const { gid, num, type } = self.data;
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

        self.setData({
            ts: [time, time],
            groupsCache: groupCache,
            uid: app.globalData.userInfo.userId
        });
        self.getPersonalInfo(gid, app.globalData.userInfo.userId);
    },
    onShow: function (options) {
        const self = this;
        const { gid, num, type } = self.data;

        // 初始化 加载历史消息及当前用户在该直播间的角色信息
        self.getHistroy(gid, 0, num);
        self.getHistroy(gid, 1, num);
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
    loadHistory() {
        const self = this;
        const { gid, type } = self.data;

        self.getHistroy(gid, type, 20);
    },
    getHistroy(gid, type, amount, callback) {
        const self = this;
        let { show_type, num, msgList, status, groupsCache } = self.data;
        const count = amount || num;
        const loading = 'status.loading[' + type + ']';

        if (status.loading[type] == 0) {
            self.setData({
                [loading]: 1
            });

            util.sendRequest(util.urls.getHistory, {
                from: 'wechat',  // 小程序特殊消息过滤
                gid: gid,
                show_type: show_type[type],
                count: count,
                ts: groupsCache.timeFlags[type].last
            }, function (res) {
                if (res.data.code == ERR_OK) {
                    const datas = res.data.data;

                    let ext = {},
                        msg = null;

                    if (datas.length > 0) {
                        const setTs = 'groupsCache.timeFlags[' + type + '].last';
                        const msgData = 'msgList[' + type + ']';
                        let list = [], timer = 0;
                        if (!groupsCache.timeFlags[type]) {
                            console.log(groupsCache.timeFlags[type])
                        }
                        
                        datas.forEach((item, index) => {

                            ext = JSON.parse(item.extp);
                            msg = self.getMsgObj(item, ext);

                            list.push(msg);
                            self.getPersonalInfo(item.recv, item.send);
                            self.timeShift(timer, ext.time_stamp);
                            timer = ext.time_stamp;
                        });

                        self.setData({
                            [setTs]: datas[datas.length - 1].send_time, //  最旧一条消息的时间戳
                            [loading]: 0,
                            aaa: 1,
                            [msgData]: (msgList[type] && msgList[type].length > 0) ? list.reverse().concat(msgList[type]) : list.reverse()
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
            }); 
        }
        
    },
    getMsgObj: function (data, ext, flag) {
        const self = this;
        const { groupsCache, userCache, gid, uid} = self.data;
        const info = userCache[uid + gid];
        let timeStamp = ext.time_stamp;
        let msg = null, time = null, localMsg = '';

        timeStamp = new Date(parseInt(ext.time_stamp));

        // if (Math.abs(prevTime - timeStamp) > 60000) {
        //     var sevenDay = 7 * 24 * 60 * 60 * 1000;

        //     timeStamp = new Date(parseInt(timeStamp));
        //     curTime = new Date(parseInt(this.clock));
            
        // }

        if (info && info.private_expire_flag != 1 && (ext.show_type == 8 || ext.show_type == 9)) {
            // 没有权限的私密消息文本
            if (ext.show_type == 8) {
                localMsg = '<div style="font-size:16px;">一条私密直播，<span style="color:#e84c3d">立即订阅</span></div>';
            } else {
                localMsg = '<div style="font-size:16px;">一条私密交流，<span style="color:#e84c3d">立即订阅</span></div>';
            }

            msg = {
                data: localMsg,
                ext: ext,
                send: data.send,
                recv: data.recv,
                private: true,
                timeStamp: util.formatTime(timeStamp)
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
                        data: '<div style="font-size:16px;">' + data.msg + '</div>',
                        ext: ext,
                        send: data.send,
                        recv: data.recv,
                        private: false,
                        timeStamp: util.formatTime(timeStamp)
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
                        data: '<img class="img" style="width:100%; height:auto" src="' + iSrc + '" />',
                        ext: ext,
                        send: data.send,
                        recv: data.recv,
                        private: false
                    };
                    break;
                case '3':
                    // 语音
                    // msg = {
                    //     data: data.msg,
                    //     ext: ext,
                    //     send: data.send,
                    //     recv: data.recv
                    // };
                    break;
                case '4':
                    // 表情
                    // msg = {
                    //     data: [{
                    //         data: data.msg,
                    //         type: 'emotion'
                    //     }],
                    //     ext: ext,
                    //     send: data.send,
                    //     recv: data.recv
                    // };
                    break;
            }
        }

        return msg;
    },
    getPersonalInfo (gid, who) {
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
                            info = { 'role': 'admin', 'title': '播主' }
                        } else if (d.data.role_flag == 2) {
                            info = { 'role': 'manager', 'title': '管理员' }
                        } else {
                            info = { 'role': 'normal', 'title': '用户' }
                        }

                        if (d.data.is_host) {
                            info = { 'role': 'host', 'title': '主持人' }
                        }

                        if (d.data.is_guest) {
                            info = { 'role': 'guest', 'title': '嘉宾' }
                        }

                        self.setData({
                            [cache]: r.data.data,
                            [roleInfo]: info
                        })

                    }
                }
            });
        }
    },
    timeShift (date, onlyToday) {
        console.log(date - onlyToday)

        // if (Math.abs(prevTime - timeStamp) > 60000) {
        //     var sevenDay = 7 * 24 * 60 * 60 * 1000;

        //     timeStamp = new Date(parseInt(timeStamp));
        //     curTime = new Date(parseInt(this.clock));

        // }
    }

})