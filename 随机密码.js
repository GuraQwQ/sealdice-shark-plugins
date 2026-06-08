// ==UserScript==
// @name         随机密码
// @author       一只鲨鱼鱼
// @version      1.0.1
// @description  便携式随机生成指定位数的随机密码
// @timestamp    1745033610
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/随机密码.js
// @sealVersion  1.4.5
// ==/UserScript==

let ext = seal.ext.find('随机密码');
if (!ext) {
    ext = seal.ext['new']('随机密码', '一只鲨鱼鱼', '1.0.1');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '无长度提示', '格式错误：请指定密码长度，例如：.随机密码 16');
    seal.ext.registerStringConfig(ext, '非数字提示', '格式错误：长度必须是数字');
    seal.ext.registerStringConfig(ext, '范围错误提示', '长度超出范围，请在 3~64 之间指定');
    seal.ext.registerStringConfig(ext, '网络错误提示', '🌪️ 密码生成失败，也许远古的魔法暂时失效了……');
    seal.ext.registerTemplateConfig(ext, '成功前缀文案', [
        '🔮 鲨鲨找来了一段古老的亚特兰蒂斯密文：',
        '🌊 海浪送来一卷泛着金光的卷轴，上面写着：',
        '⚓ 从沉船宝藏里翻出一张密码纸条：',
        '✨ 元素精灵低语着传述这串秘符：'
    ]);
}

let cmdFile = seal.ext.newCmdItemInfo();
cmdFile.name = '随机密码';
cmdFile.help = `生成指定位数的随机密码（3~64位）
用法：
  .随机密码 <长度>     半角句号前缀
  。随机密码 <长度>    全角句号前缀
示例：
  .随机密码 16
  。随机密码 20`;

cmdFile.solve = (ctx, msg, cmd) => {
    const lengthArg = cmd.args[0];

    if (!lengthArg) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '无长度提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    const length = parseInt(lengthArg, 10);
    if (isNaN(length)) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '非数字提示'));
        return seal.ext.newCmdExecuteResult(true);
    }
    if (length < 3 || length > 64) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '范围错误提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    const apiUrl = `https://v2.xxapi.cn/api/password?length=${length}`;
    fetch(apiUrl)
        .then(res => res.text())
        .then(text => {
            let password = text;
            try {
                const json = JSON.parse(text);
                password = json.data || text;
            } catch (e) {
                // 非JSON响应直接使用原文本
            }
            const prefixes = seal.ext.getTemplateConfig(ext, '成功前缀文案');
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            seal.replyToSender(ctx, msg, `${randomPrefix}\n${password}`);
        })
        .catch(err => {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '网络错误提示'));
            console.error('Password API error:', err);
        });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['随机密码'] = cmdFile;