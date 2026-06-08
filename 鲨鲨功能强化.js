// ==UserScript==
// @name         鲨鲨功能强化
// @author       一只鲨鱼鱼
// @version      1.6.0
// @description  进群时自动私聊通知master，附带查邀请人和状态查询指令。通知内容包含群名、群号、邀请人、邀请时间、群人数、群创建时间等。
// @timestamp    1714147200
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/鲨鲨功能强化.js
// @sealVersion  1.4.5
// ==/UserScript==

'use strict';

var PLUGIN_NAME = '鲨鲨功能强化';
var PLUGIN_VER = '1.6.0';
var PLUGIN_AUTHOR = '一只鲨鱼鱼';

if (!seal.ext.find(PLUGIN_NAME)) {
    var ext = seal.ext.new(PLUGIN_NAME, PLUGIN_AUTHOR, PLUGIN_VER);
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '通知QQ号', '', '接收进群通知的master QQ号');
    seal.ext.registerStringConfig(ext, 'OneBotHTTP地址', '', 'OneBot HTTP API地址，如 http://127.0.0.1:3000，用于获取群创建时间等额外信息，留空则不获取');
    seal.ext.registerStringConfig(ext, 'OneBotToken', '', 'OneBot HTTP API的Access Token，留空则不使用');

    function formatTime(timestamp) {
        if (!timestamp || timestamp === 0) return '未知';
        var d = new Date(timestamp * 1000);
        var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function extractRawGroupId(groupId) {
        if (!groupId) return '';
        return groupId.replace(/^[A-Za-z]+-Group:/, '');
    }

    function extractRawUserId(userId) {
        if (!userId) return '';
        return userId.replace(/^[A-Za-z]+:/, '');
    }

    function toNum(v) {
        if (v === undefined || v === null) return 0;
        var n = Number(v);
        return isNaN(n) ? 0 : n;
    }

    function onebotApiGet(endpoint, callback) {
        var httpAddr = seal.ext.getStringConfig(ext, 'OneBotHTTP地址');
        if (!httpAddr || httpAddr.trim() === '') {
            callback(null);
            return;
        }

        var url = httpAddr.replace(/\/+$/, '') + '/' + endpoint;
        var token = seal.ext.getStringConfig(ext, 'OneBotToken');
        var headers = {};
        if (token && token.trim() !== '') {
            headers['Authorization'] = 'Bearer ' + token.trim();
        }

        fetch(url, { method: 'GET', headers: headers })
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function(text) {
            try {
                var resp = JSON.parse(text);
                if (resp.retcode === 0 && resp.data) {
                    callback(resp.data);
                } else {
                    callback(null);
                }
            } catch (e) {
                console.log('[' + PLUGIN_NAME + '] OneBot API解析失败: ' + e.message);
                callback(null);
            }
        })
        .catch(function(err) {
            console.log('[' + PLUGIN_NAME + '] OneBot API请求失败: ' + err.message);
            callback(null);
        });
    }

    function formatDuration(totalSeconds) {
        if (!totalSeconds || totalSeconds <= 0) return '未知';
        var seconds = Math.floor(totalSeconds);
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;
        var parts = [];
        if (days > 0) parts.push(days + '天');
        if (hours > 0) parts.push(hours + '小时');
        if (minutes > 0) parts.push(minutes + '分');
        if (secs > 0) parts.push(secs + '秒');
        return parts.join('') || '0秒';
    }

    function getEpStateText(state) {
        var s = toNum(state);
        switch (s) {
            case 0: return '已断开';
            case 1: return '已连接';
            case 2: return '连接中';
            case 3: return '连接失败';
            default: return '未知(' + s + ')';
        }
    }

    function getSafeStr(v, defaultVal) {
        if (v === undefined || v === null || v === '') return defaultVal || '';
        return String(v);
    }

    function onebotSendPrivateMsg(rawUserId, text) {
        try {
            var httpAddr = seal.ext.getStringConfig(ext, 'OneBotHTTP地址');
            if (!httpAddr || httpAddr.trim() === '') {
                console.log('[' + PLUGIN_NAME + '] OneBotHTTP地址未配置，无法通过API发送私聊');
                return false;
            }
            var token = seal.ext.getStringConfig(ext, 'OneBotToken');
            var headers = { 'Content-Type': 'application/json' };
            if (token && token.trim() !== '') {
                headers['Authorization'] = 'Bearer ' + token.trim();
            }
            var url = httpAddr.replace(/\/+$/, '') + '/send_private_msg';
            fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    user_id: Number(rawUserId),
                    message: [{ type: 'text', data: { text: text } }]
                })
            })
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function(data) {
                if (data.retcode !== 0) {
                    console.log('[' + PLUGIN_NAME + '] OneBot发送私聊失败: ' + JSON.stringify(data));
                }
            })
            .catch(function(err) {
                console.log('[' + PLUGIN_NAME + '] OneBot发送私聊失败: ' + err.message);
            });
            return true;
        } catch (e) {
            console.log('[' + PLUGIN_NAME + '] OneBot发送私聊异常: ' + e.message);
            return false;
        }
    }

    function onebotSendGroupMsg(rawGroupId, text) {
        try {
            var httpAddr = seal.ext.getStringConfig(ext, 'OneBotHTTP地址');
            if (!httpAddr || httpAddr.trim() === '') {
                console.log('[' + PLUGIN_NAME + '] OneBotHTTP地址未配置，无法通过API发送群聊');
                return false;
            }
            var token = seal.ext.getStringConfig(ext, 'OneBotToken');
            var headers = { 'Content-Type': 'application/json' };
            if (token && token.trim() !== '') {
                headers['Authorization'] = 'Bearer ' + token.trim();
            }
            var url = httpAddr.replace(/\/+$/, '') + '/send_group_msg';
            fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    group_id: Number(rawGroupId),
                    message: [{ type: 'text', data: { text: text } }]
                })
            })
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function(data) {
                if (data.retcode !== 0) {
                    console.log('[' + PLUGIN_NAME + '] OneBot发送群聊失败: ' + JSON.stringify(data));
                }
            })
            .catch(function(err) {
                console.log('[' + PLUGIN_NAME + '] OneBot发送群聊失败: ' + err.message);
            });
            return true;
        } catch (e) {
            console.log('[' + PLUGIN_NAME + '] OneBot发送群聊异常: ' + e.message);
            return false;
        }
    }

    function sendPrivateNotice(ep, targetUserId, text) {
        try {
            var rawTargetId = extractRawUserId(targetUserId);
            if (rawTargetId) {
                return onebotSendPrivateMsg(rawTargetId, text);
            }
            console.log('[' + PLUGIN_NAME + '] 无法提取目标QQ号，跳过通知');
            return false;
        } catch (e) {
            console.log('[' + PLUGIN_NAME + '] 发送私聊通知失败: ' + e.message);
            return false;
        }
    }

    function getNoticeTargetId(ep) {
        var customQQ = seal.ext.getStringConfig(ext, '通知QQ号');
        if (customQQ && customQQ.trim() !== '') {
            var rawId = customQQ.trim().replace(/\D+/g, '');
            if (rawId) {
                var platform = 'QQ';
                try {
                    if (ep && ep.platform) platform = String(ep.platform);
                    else if (ep && ep.baseInfo && ep.baseInfo.platform) platform = String(ep.baseInfo.platform);
                } catch (e) {}
                return platform + ':' + rawId;
            }
        }
        return null;
    }

    function findOwnerFromMemberList(members) {
        if (!members || !Array.isArray(members)) return null;
        for (var i = 0; i < members.length; i++) {
            var m = members[i];
            if (m.role === 'owner') {
                return {
                    userId: m.user_id ? String(m.user_id) : '',
                    nickname: m.nickname || '',
                    card: m.card || ''
                };
            }
        }
        return null;
    }

    var _inOnGroupJoined = false;

    ext.onGroupJoined = function(ctx, msg) {
        if (_inOnGroupJoined) return;
        _inOnGroupJoined = true;
        try {
            var groupName = '未知群名';
            var groupId = '';
            var inviterId = '';
            var enteredTime = 0;
            var ep = ctx.endPoint;

            try {
                if (ctx.group) {
                    groupName = getSafeStr(ctx.group.groupName, '未知群名');
                    groupId = getSafeStr(ctx.group.groupId);
                    if (ctx.group.inviteUserId) {
                        inviterId = String(ctx.group.inviteUserId);
                    }
                    enteredTime = toNum(ctx.group.enteredTime);
                }
            } catch (e) {
                console.log('[' + PLUGIN_NAME + '] 获取群信息异常: ' + e.message);
            }

            var timeStr = formatTime(enteredTime > 0 ? enteredTime : Math.floor(Date.now() / 1000));
            var rawGroupId = extractRawGroupId(groupId);

            var targetId = getNoticeTargetId(ep);
            if (!targetId) {
                console.log('[' + PLUGIN_NAME + '] 未配置通知QQ号');
                return;
            }

            var savedEp = ep;
            var savedTargetId = targetId;
            var savedGroupName = groupName;
            var savedGroupId = groupId;
            var savedInviterId = inviterId;
            var savedTimeStr = timeStr;
            var savedRawGroupId = rawGroupId;

            var httpAddr = seal.ext.getStringConfig(ext, 'OneBotHTTP地址');
            if (httpAddr && httpAddr.trim() !== '' && rawGroupId) {
                var hasCoreInviter = savedInviterId && extractRawUserId(savedInviterId) !== '0';
                var pendingApis = hasCoreInviter ? 2 : 3;
                var apiMemberCount = 0;
                var apiGroupCreateTime = 0;
                var apiGroupName = '';
                var apiInviterNickname = '';
                var apiInviterRawId = '';
                var apiOwnerInfo = null;

                onebotApiGet('get_group_info?group_id=' + rawGroupId, function(data) {
                    if (data) {
                        apiMemberCount = toNum(data.member_count);
                        apiGroupCreateTime = toNum(data.group_create_time);
                        apiGroupName = getSafeStr(data.group_name);
                    }
                    pendingApis--;
                    if (pendingApis <= 0) buildAndSend();
                });

                if (hasCoreInviter) {
                    var rawInviterId = extractRawUserId(savedInviterId);
                    onebotApiGet('get_stranger_info?user_id=' + rawInviterId, function(data) {
                        if (data) {
                            apiInviterNickname = getSafeStr(data.nickname);
                            apiInviterRawId = getSafeStr(data.user_id ? String(data.user_id) : '');
                        }
                        pendingApis--;
                        if (pendingApis <= 0) buildAndSend();
                    });
                } else {
                    onebotApiGet('get_group_member_list?group_id=' + rawGroupId, function(data) {
                        if (data && Array.isArray(data)) {
                            apiOwnerInfo = findOwnerFromMemberList(data);
                        }
                        pendingApis--;
                        if (pendingApis <= 0) buildAndSend();
                    });

                    onebotApiGet('get_stranger_info?user_id=0', function() {
                        pendingApis--;
                        if (pendingApis <= 0) buildAndSend();
                    });
                }

                function buildAndSend() {
                    var memberCount = apiMemberCount > 0 ? String(apiMemberCount) : '未知';
                    var groupCreateTime = apiGroupCreateTime > 0 ? formatTime(apiGroupCreateTime) : '未知';
                    if (apiGroupName && savedGroupName === '未知群名') {
                        savedGroupName = apiGroupName;
                    }

                    var inviterDisplay = '未知';
                    if (savedInviterId && extractRawUserId(savedInviterId) !== '0') {
                        var rawId = extractRawUserId(savedInviterId);
                        if (apiInviterNickname) {
                            inviterDisplay = '<' + apiInviterNickname + '>(QQ:' + (apiInviterRawId || rawId) + ')';
                        } else if (rawId) {
                            inviterDisplay = 'QQ:' + rawId;
                        } else {
                            inviterDisplay = savedInviterId;
                        }
                    } else if (apiOwnerInfo) {
                        var ownerDisplay = apiOwnerInfo.card || apiOwnerInfo.nickname || '未知';
                        var ownerId = apiOwnerInfo.userId;
                        inviterDisplay = '<' + ownerDisplay + '>(QQ:' + ownerId + ')[群主]';
                    }

                    var noticeText = '收到QQ加群邀请: 群组<' + savedGroupName + '>(' + savedGroupId + ')' +
                        ' 邀请人:' + inviterDisplay +
                        ' 邀请时间:' + savedTimeStr +
                        ' 群人数:' + memberCount +
                        ' 群创建时间:' + groupCreateTime;

                    sendPrivateNotice(savedEp, savedTargetId, noticeText);
                }
            } else {
                var inviterDisplay = '未知';
                if (savedInviterId) {
                    var rawId = extractRawUserId(savedInviterId);
                    if (rawId && rawId !== '0') {
                        inviterDisplay = 'QQ:' + rawId;
                    } else {
                        inviterDisplay = savedInviterId;
                    }
                }

                var noticeText = '收到QQ加群邀请: 群组<' + savedGroupName + '>(' + savedGroupId + ')' +
                    ' 邀请人:' + inviterDisplay +
                    ' 邀请时间:' + savedTimeStr +
                    ' 群人数:未知' +
                    ' 群创建时间:未知';

                sendPrivateNotice(savedEp, savedTargetId, noticeText);
            }
        } catch (e) {
            console.log('[' + PLUGIN_NAME + '] onGroupJoined error: ' + e.message);
        } finally {
            _inOnGroupJoined = false;
        }
    };

    function getCtxById(epId, groupId, senderId) {
        var eps = seal.getEndPoints();
        for (var i = 0; i < eps.length; i++) {
            var epItem = eps[i];
            var epUserId = '';
            try {
                epUserId = getSafeStr(epItem.userId);
                if (!epUserId) {
                    epUserId = getSafeStr(epItem.baseInfo ? epItem.baseInfo.userId : '');
                }
            } catch (e) {}
            if (epUserId === epId) {
                var m = seal.newMessage();
                m.messageType = 'group';
                m.groupId = groupId;
                m.sender.userId = senderId;
                return seal.createTempCtx(epItem, m);
            }
        }
        return undefined;
    }

    var cmdInviter = seal.ext.newCmdItemInfo();
    cmdInviter.name = '查邀请人';
    cmdInviter.help = '查询指定群的邀请人信息\n用法：.查邀请人 <群号>\n示例：.查邀请人 123456789';

    cmdInviter.solve = function(ctx, msg, cmdArgs) {
        if (ctx.privilegeLevel < 50) {
            seal.replyToSender(ctx, msg, '权限不足，无法使用此指令');
            return seal.ext.newCmdExecuteResult(true);
        }

        var targetGroupId = cmdArgs.getArgN(1);
        if (!targetGroupId) {
            seal.replyToSender(ctx, msg, '请提供要查询的群号\n用法：.查邀请人 <群号>');
            return seal.ext.newCmdExecuteResult(true);
        }

        if (!/^\d+$/.test(targetGroupId)) {
            seal.replyToSender(ctx, msg, '群号格式错误，请输入纯数字群号');
            return seal.ext.newCmdExecuteResult(true);
        }

        var currentEpId = '';
        try {
            currentEpId = getSafeStr(ctx.endPoint.userId);
            if (!currentEpId) {
                currentEpId = getSafeStr(ctx.endPoint.baseInfo ? ctx.endPoint.baseInfo.userId : '');
            }
        } catch (e) {}
        var rawEpId = currentEpId.replace(/\D+/g, '');
        if (!rawEpId) {
            seal.replyToSender(ctx, msg, '无法获取当前账号信息');
            return seal.ext.newCmdExecuteResult(true);
        }

        try {
            var epId = 'QQ:' + rawEpId;
            var groupId = 'QQ-Group:' + targetGroupId;
            var mctx = getCtxById(epId, groupId, 'QQ:114514');

            if (!mctx) {
                seal.replyToSender(ctx, msg, '无法获取群信息');
                return seal.ext.newCmdExecuteResult(true);
            }

            var groupName = getSafeStr(mctx.group.groupName, '未知群名');
            var inviteUserId = '';
            try { inviteUserId = getSafeStr(mctx.group.inviteUserId); } catch (e) {}
            var enteredTime = 0;
            try { enteredTime = toNum(mctx.group.enteredTime); } catch (e) {}

            var savedEp = ctx.endPoint;
            var savedUserId = ctx.player.userId;
            var savedGroupId = ctx.group ? ctx.group.groupId : '';
            var savedIsPrivate = ctx.isPrivate;

            var httpAddr = seal.ext.getStringConfig(ext, 'OneBotHTTP地址');
            if (httpAddr && httpAddr.trim() !== '') {
                var hasCoreInviter = inviteUserId && extractRawUserId(inviteUserId) !== '0';
                var pendingQ = hasCoreInviter ? 2 : 3;
                var qMemberCount = 0;
                var qGroupCreateTime = 0;
                var qInviterNickname = '';
                var qInviterRawId = '';
                var qOwnerInfo = null;

                onebotApiGet('get_group_info?group_id=' + targetGroupId, function(data) {
                    if (data) {
                        qMemberCount = toNum(data.member_count);
                        qGroupCreateTime = toNum(data.group_create_time);
                    }
                    pendingQ--;
                    if (pendingQ <= 0) sendInviterReply();
                });

                if (hasCoreInviter) {
                    var rawInviter = extractRawUserId(inviteUserId);
                    onebotApiGet('get_stranger_info?user_id=' + rawInviter, function(data) {
                        if (data) {
                            qInviterNickname = getSafeStr(data.nickname);
                            qInviterRawId = getSafeStr(data.user_id ? String(data.user_id) : '');
                        }
                        pendingQ--;
                        if (pendingQ <= 0) sendInviterReply();
                    });
                } else {
                    onebotApiGet('get_group_member_list?group_id=' + targetGroupId, function(data) {
                        if (data && Array.isArray(data)) {
                            qOwnerInfo = findOwnerFromMemberList(data);
                        }
                        pendingQ--;
                        if (pendingQ <= 0) sendInviterReply();
                    });

                    onebotApiGet('get_stranger_info?user_id=0', function() {
                        pendingQ--;
                        if (pendingQ <= 0) sendInviterReply();
                    });
                }

                function sendInviterReply() {
                    var reply = '群信息查询结果：\n';
                    reply += '群号：' + targetGroupId + '\n';
                    reply += '群名：' + groupName + '\n';

                    var inviterDisplay = '无记录或未知';
                    if (inviteUserId && extractRawUserId(inviteUserId) !== '0') {
                        var rid = extractRawUserId(inviteUserId);
                        if (qInviterNickname) {
                            inviterDisplay = '<' + qInviterNickname + '>(QQ:' + (qInviterRawId || rid) + ')';
                        } else if (rid) {
                            inviterDisplay = 'QQ:' + rid;
                        } else {
                            inviterDisplay = inviteUserId;
                        }
                    } else if (qOwnerInfo) {
                        var ownerDisplay = qOwnerInfo.card || qOwnerInfo.nickname || '未知';
                        inviterDisplay = '<' + ownerDisplay + '>(QQ:' + qOwnerInfo.userId + ')[群主]';
                    }
                    reply += '邀请人：' + inviterDisplay + '\n';
                    reply += '入群时间：' + formatTime(enteredTime) + '\n';
                    reply += '群人数：' + (qMemberCount > 0 ? qMemberCount : '未知') + '\n';
                    reply += '群创建时间：' + (qGroupCreateTime > 0 ? formatTime(qGroupCreateTime) : '未知');

                    try {
                        var rawSenderId = extractRawUserId(savedUserId);
                        var rawReplyGroupId = extractRawGroupId(savedGroupId);
                        if (savedIsPrivate && rawSenderId) {
                            onebotSendPrivateMsg(rawSenderId, reply);
                        } else if (!savedIsPrivate && rawReplyGroupId) {
                            onebotSendGroupMsg(rawReplyGroupId, reply);
                        } else {
                            console.log('[' + PLUGIN_NAME + '] 查邀请人：无法确定回复目标');
                        }
                    } catch (e) {
                        console.log('[' + PLUGIN_NAME + '] 查邀请人回复发送失败: ' + e.message);
                    }
                }
            } else {
                var reply = '群信息查询结果：\n';
                reply += '群号：' + targetGroupId + '\n';
                reply += '群名：' + groupName + '\n';

                var inviterDisplay = '无记录或未知';
                if (inviteUserId) {
                    var rid = extractRawUserId(inviteUserId);
                    if (rid && rid !== '0') {
                        inviterDisplay = 'QQ:' + rid;
                    } else {
                        inviterDisplay = inviteUserId;
                    }
                }
                reply += '邀请人：' + inviterDisplay + '\n';
                reply += '入群时间：' + formatTime(enteredTime);

                seal.replyToSender(ctx, msg, reply);
            }
        } catch (e) {
            seal.replyToSender(ctx, msg, '查询失败：' + e.message);
        }

        return seal.ext.newCmdExecuteResult(true);
    };

    ext.cmdMap['查邀请人'] = cmdInviter;

    var cmdStatus = seal.ext.newCmdItemInfo();
    cmdStatus.name = '鲨鲨状态';
    cmdStatus.help = '查询bot状态信息\n用法：.鲨鲨状态';

    cmdStatus.solve = function(ctx, msg, cmdArgs) {
        if (ctx.privilegeLevel < 50) {
            seal.replyToSender(ctx, msg, '权限不足，无法使用此指令');
            return seal.ext.newCmdExecuteResult(true);
        }

        var ep = ctx.endPoint;

        var groupNum = -1;
        var cmdExecutedNum = -1;
        var onlineTotalTime = -1;
        var epState = -1;
        var epNickname = '未知';
        var epUserId = '未知';
        var epPlatform = '未知';

        try {
            if (ep) {
                try { groupNum = toNum(ep.groupNum); } catch (e) {}
                try { cmdExecutedNum = toNum(ep.cmdExecutedNum); } catch (e) {}
                try { onlineTotalTime = toNum(ep.onlineTotalTime); } catch (e) {}
                try { epState = toNum(ep.state); } catch (e) {}
                try { epNickname = getSafeStr(ep.nickname, '未知'); } catch (e) {}
                try { epUserId = getSafeStr(ep.userId, '未知'); } catch (e) {}
                try { epPlatform = getSafeStr(ep.platform, '未知'); } catch (e) {}

                if (groupNum === 0) {
                    try { groupNum = toNum(ep.baseInfo.groupNum); } catch (e) {}
                }
                if (cmdExecutedNum === 0) {
                    try { cmdExecutedNum = toNum(ep.baseInfo.cmdExecutedNum); } catch (e) {}
                }
                if (onlineTotalTime === 0) {
                    try { onlineTotalTime = toNum(ep.baseInfo.onlineTotalTime); } catch (e) {}
                }
                if (epState === 0 || epState === -1) {
                    try { epState = toNum(ep.baseInfo.state); } catch (e) {}
                }
                if (epNickname === '未知') {
                    try { epNickname = getSafeStr(ep.baseInfo.nickname, '未知'); } catch (e) {}
                }
                if (epUserId === '未知') {
                    try { epUserId = getSafeStr(ep.baseInfo.userId, '未知'); } catch (e) {}
                }
                if (epPlatform === '未知') {
                    try { epPlatform = getSafeStr(ep.baseInfo.platform, '未知'); } catch (e) {}
                }
            }
        } catch (e) {
            console.log('[' + PLUGIN_NAME + '] 获取端点信息异常: ' + e.message);
        }

        var sealVer = '未知';
        try {
            var ver = seal.getVersion();
            if (ver) {
                if (ver.versionSimple) {
                    sealVer = String(ver.versionSimple);
                } else if (ver.version) {
                    sealVer = String(ver.version);
                } else if (ver.versionDetail) {
                    var vd = ver.versionDetail;
                    sealVer = toNum(vd.major) + '.' + toNum(vd.minor) + '.' + toNum(vd.patch);
                    if (vd.prerelease) sealVer += '-' + String(vd.prerelease);
                }
            }
        } catch (e) {
            console.log('[' + PLUGIN_NAME + '] 获取版本信息异常: ' + e.message);
        }

        var savedEp = ep;
        var savedUserId = ctx.player.userId;
        var savedGroupId = ctx.group ? ctx.group.groupId : '';
        var savedIsPrivate = ctx.isPrivate;

        var httpAddr = seal.ext.getStringConfig(ext, 'OneBotHTTP地址');
        if (httpAddr && httpAddr.trim() !== '') {
            var pending = 5;
            var friendCount = -1;
            var obNickname = '';
            var obUserId = '';
            var obGood = null;
            var obOnline = null;
            var obAppName = '';
            var obAppVersion = '';
            var obProtocolVersion = '';
            var obGroupCount = -1;
            var obStartTime = 0;

            onebotApiGet('get_friend_list', function(data) {
                if (data && Array.isArray(data)) {
                    friendCount = data.length;
                }
                pending--;
                if (pending <= 0) sendStatusReply();
            });

            onebotApiGet('get_login_info', function(data) {
                if (data) {
                    obNickname = getSafeStr(data.nickname);
                    obUserId = data.user_id ? String(data.user_id) : '';
                }
                pending--;
                if (pending <= 0) sendStatusReply();
            });

            onebotApiGet('get_status', function(data) {
                if (data) {
                    if (data.good !== undefined) obGood = data.good;
                    if (data.online !== undefined) obOnline = data.online;
                    if (data.stat && data.stat.start_time) {
                        obStartTime = toNum(data.stat.start_time);
                    }
                }
                pending--;
                if (pending <= 0) sendStatusReply();
            });

            onebotApiGet('get_version_info', function(data) {
                if (data) {
                    obAppName = getSafeStr(data.app_name);
                    obAppVersion = getSafeStr(data.app_version);
                    obProtocolVersion = getSafeStr(data.protocol_version);
                }
                pending--;
                if (pending <= 0) sendStatusReply();
            });

            onebotApiGet('get_group_list', function(data) {
                if (data && Array.isArray(data)) {
                    obGroupCount = data.length;
                }
                pending--;
                if (pending <= 0) sendStatusReply();
            });

            function sendStatusReply() {
                var finalGroupNum = groupNum;
                if ((finalGroupNum <= 0) && obGroupCount >= 0) {
                    finalGroupNum = obGroupCount;
                }

                var finalOnlineTime = onlineTotalTime;
                if ((finalOnlineTime <= 0) && obStartTime > 0) {
                    finalOnlineTime = Math.floor(Date.now() / 1000) - obStartTime;
                }

                var reply = '── 鲨鲨状态 ──\n';
                reply += '账号昵称：' + (obNickname || epNickname) + '\n';
                reply += '账号ID：' + (obUserId || epUserId) + '\n';
                reply += '平台：' + epPlatform + '\n';
                reply += '连接状态：' + getEpStateText(epState) + '\n';
                reply += '加群数量：' + (finalGroupNum >= 0 ? finalGroupNum : '未知') + '\n';
                reply += '好友数量：' + (friendCount >= 0 ? friendCount : '未知') + '\n';
                reply += '运行时间：' + formatDuration(finalOnlineTime) + '\n';
                reply += '指令执行次数：' + (cmdExecutedNum >= 0 ? cmdExecutedNum : '未知') + '\n';
                reply += '海豹版本：' + sealVer;
                if (obGood !== null) reply += '\nOneBot状态：' + (obGood ? '正常' : '异常');
                if (obOnline !== null) reply += '\nOneBot在线：' + (obOnline ? '是' : '否');
                if (obAppName) reply += '\n框架名称：' + obAppName;
                if (obAppVersion) reply += '\n框架版本：' + obAppVersion;
                if (obProtocolVersion) reply += '\n协议版本：' + obProtocolVersion;

                try {
                    var rawSenderId = extractRawUserId(savedUserId);
                    var rawReplyGroupId = extractRawGroupId(savedGroupId);
                    if (savedIsPrivate && rawSenderId) {
                        onebotSendPrivateMsg(rawSenderId, reply);
                    } else if (!savedIsPrivate && rawReplyGroupId) {
                        onebotSendGroupMsg(rawReplyGroupId, reply);
                    } else {
                        console.log('[' + PLUGIN_NAME + '] 鲨鲨状态：无法确定回复目标');
                    }
                } catch (e) {
                    console.log('[' + PLUGIN_NAME + '] 状态信息发送失败: ' + e.message);
                }
            }
        } else {
            var reply = '── 鲨鲨状态 ──\n';
            reply += '账号昵称：' + epNickname + '\n';
            reply += '账号ID：' + epUserId + '\n';
            reply += '平台：' + epPlatform + '\n';
            reply += '连接状态：' + getEpStateText(epState) + '\n';
            reply += '加群数量：' + (groupNum >= 0 ? groupNum : '未知') + '\n';
            reply += '好友数量：未知(未配置OneBot)\n';
            reply += '运行时间：' + formatDuration(onlineTotalTime) + '\n';
            reply += '指令执行次数：' + (cmdExecutedNum >= 0 ? cmdExecutedNum : '未知') + '\n';
            reply += '海豹版本：' + sealVer;

            seal.replyToSender(ctx, msg, reply);
        }

        return seal.ext.newCmdExecuteResult(true);
    };

    ext.cmdMap['鲨鲨状态'] = cmdStatus;

    var cmdHelp = seal.ext.newCmdItemInfo();
    cmdHelp.name = '鲨鲨功能强化';
    cmdHelp.help = '提供了功能修正，私用';

    cmdHelp.solve = function(ctx, msg, cmdArgs) {
        seal.replyToSender(ctx, msg, cmdHelp.help);
        return seal.ext.newCmdExecuteResult(true);
    };

    ext.cmdMap['鲨鲨功能强化'] = cmdHelp;
}