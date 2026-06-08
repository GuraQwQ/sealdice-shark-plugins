// ==UserScript==
// @name         二维码生成
// @author       一只鲨鱼鱼
// @version      1.0.0
// @description  海洋与鲨鱼风格的二维码生成工具，将文字或链接转为二维码图片
// @timestamp    1745033610
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/二维码生成.js
// @sealVersion  1.4.5
// ==/UserScript==

let ext = seal.ext.find('二维码生成');
if (!ext) {
    ext = seal.ext['new']('二维码生成', '一只鲨鱼鱼', '1.0.0');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '无内容提示', '🌊 鲨鲨歪了歪脑袋：要生成什么内容的二维码呢？');
    seal.ext.registerStringConfig(ext, '内容过长提示', '🌊 内容太长了，鲨鲨的鱼鳍画不下啦……请控制在500字符以内～');
    seal.ext.registerStringConfig(ext, '生成失败提示', '🌊 二维码生成失败：{error}');
    seal.ext.registerStringConfig(ext, '结果为空提示', '🌊 鲨鲨画了半天，二维码却不见了……');
    seal.ext.registerStringConfig(ext, '网络错误提示', '🌊 海底网络波动，二维码没能生成……');
    seal.ext.registerTemplateConfig(ext, '成功前缀文案', [
        '🦈 鲨鲨用鱼鳍在海底沙地上画了一幅二维码：',
        '🌊 海浪冲上来一块刻着神秘图案的贝壳：',
        '🐚 你吹响海螺，海面上浮现出一枚二维码：',
        '✨ 深海的磷光汇聚成一张二维码，扫扫看吧：',
        '📜 鲨鲨把密文刻在古老的鲸骨上，化作二维码：'
    ]);
}

let cmdFile = seal.ext.newCmdItemInfo();
cmdFile.name = '二维码';
cmdFile.help = `鲨鲨帮你把文字或链接变成二维码
用法：
  .二维码 <文本或链接>   生成二维码图片
  。二维码 <文本或链接>  全角句号前缀同样支持
示例：
  .二维码 https://www.xxhzm.cn
  。二维码 今天天气真好`;

cmdFile.solve = (ctx, msg, cmd) => {
    const inputText = cmd.args.join(' ').trim();

    if (!inputText) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '无内容提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    if (inputText.length > 500) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '内容过长提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    const apiUrl = `https://v2.xxapi.cn/api/qrcode?text=${encodeURIComponent(inputText)}&return=json`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            if (data.code !== 200) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '生成失败提示').replace('{error}', data.msg || '未知错误'));
                return;
            }

            const qrUrl = data.data;
            if (!qrUrl) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '结果为空提示'));
                return;
            }

            const prefixes = seal.ext.getTemplateConfig(ext, '成功前缀文案');
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

            seal.replyToSender(ctx, msg, randomPrefix);
            seal.replyToSender(ctx, msg, `[CQ:image,file=${qrUrl}]`);
        })
        .catch(err => {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '网络错误提示'));
            console.error('QRCode API error:', err);
        });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['二维码'] = cmdFile;