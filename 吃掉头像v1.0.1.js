// ==UserScript==
// @name         吃掉头像
// @author       一只鲨鱼鱼
// @version      1.0.3
// @description  海洋与鲨鱼风格的头像吃掉GIF生成，支持@或QQ号
// @timestamp    1745033610
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/吃掉头像.js
// @sealVersion  1.4.5
// ==/UserScript==

'use strict';

var ext = seal.ext.find('吃掉头像');
if (!ext) {
    ext = seal.ext.new('吃掉头像', '一只鲨鱼鱼', '1.0.3');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '无目标提示', '鲨鲨歪了歪脑袋：要吃谁的头像呢？告诉我QQ号或者@一下那个人吧～');
    seal.ext.registerStringConfig(ext, '生成失败提示', '鲨鲨咬空了：{error}');
    seal.ext.registerStringConfig(ext, '结果为空提示', '鲨鲨张了张嘴，但GIF不见了……');
    seal.ext.registerStringConfig(ext, '网络错误提示', '海底网络波动，鲨鲨没能吃到头像……');
    seal.ext.registerTemplateConfig(ext, '成功前缀文案', [
        '鲨鲨啊呜一口，把 {qq} 的头像吞下去了！',
        '海浪翻涌，鲨鲨从海底跃起，一口吃掉了 {qq} 的头像～',
        '咔嚓！鲨鲨咬住了 {qq} 的头像，嚼嚼嚼……',
        '深海中闪过一道光，鲨鲨对着 {qq} 的头像张开了大嘴：',
        '鲨鲨觉得 {qq} 的头像看起来很好吃，于是……'
    ]);
}

// 从海豹骰的userId中提取纯数字QQ号
function extractQQ(userId) {
    if (!userId) return null;
    var m = String(userId).match(/(\d+)/);
    return m ? m[1] : null;
}

// 从CQ码中提取QQ号
function extractQQFromCQ(message) {
    if (!message) return null;
    // 匹配 [CQ:at,qq=123456] 或 [CQ:at,qq=123456,name=xxx]
    var m = message.match(/\[CQ:at,qq=(\d+)/);
    return m ? m[1] : null;
}

// 获取目标QQ号
function getTargetQQ(ctx, msg, cmd) {
    var targetQQ = null;

    // 方法1: 从 cmd.at 解析（海豹骰原生解析的@信息）
    if (cmd.at && cmd.at.length > 0) {
        for (var i = 0; i < cmd.at.length; i++) {
            var atItem = cmd.at[i];
            var rawId = null;
            if (atItem && atItem.userId) {
                rawId = atItem.userId;
            } else if (typeof atItem === 'string') {
                rawId = atItem;
            }
            var qq = extractQQ(rawId);
            if (qq) {
                targetQQ = qq;
                break;
            }
        }
    }

    // 方法2: 从原始消息中解析 CQ:at 码
    if (!targetQQ) {
        targetQQ = extractQQFromCQ(msg.message);
    }

    // 方法3: 从命令参数解析纯数字QQ号
    if (!targetQQ) {
        var arg = cmd.getArgN ? cmd.getArgN(1) : (cmd.args && cmd.args[0] ? cmd.args[0] : '');
        if (arg && /^\d+$/.test(arg)) {
            targetQQ = arg;
        }
    }

    // 方法4: 如果没有指定目标，默认使用发送者自己
    if (!targetQQ) {
        targetQQ = extractQQ(msg.sender && msg.sender.userId);
    }

    return targetQQ;
}

var cmdFile = seal.ext.newCmdItemInfo();
cmdFile.name = '吃掉';
cmdFile.help = '鲨鲨张开大嘴，吃掉指定目标的头像\n用法：\n  .吃掉 <QQ号>         直接传入QQ号\n  .吃掉 @某人          吃掉被@的人的头像\n  .吃掉                吃掉自己的头像\n  。吃掉 ...           全角句号前缀同样支持';

cmdFile.solve = function(ctx, msg, cmd) {
    var targetQQ = getTargetQQ(ctx, msg, cmd);

    if (!targetQQ) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '无目标提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    var apiUrl = 'https://v2.xxapi.cn/api/bite?qq=' + targetQQ;

    fetch(apiUrl)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.code !== 200) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '生成失败提示').replace('{error}', data.msg || '未知错误'));
                return;
            }

            var gifUrl = data.data;
            if (!gifUrl) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '结果为空提示'));
                return;
            }

            var prefixes = seal.ext.getTemplateConfig(ext, '成功前缀文案');
            var randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)].replace('{qq}', targetQQ);

            // 合并为单条消息发送，cache=0 避免图片缓存导致不显示
            seal.replyToSender(ctx, msg, randomPrefix + '\n[CQ:image,file=' + gifUrl + ',cache=0]');
        })
        .catch(function(err) {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '网络错误提示'));
            console.error('Bite API error:', err);
        });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['吃掉'] = cmdFile;
