// ==UserScript==
// @name         答案之书
// @author       一只鲨鱼鱼
// @version      1.0.0
// @description  海洋与鲨鱼风格的答案之书，为你的问题提供神秘指引
// @timestamp    1745033610
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/答案之书.js
// @sealVersion  1.4.5
// ==/UserScript==

let ext = seal.ext.find('答案之书');
if (!ext) {
    ext = seal.ext['new']('答案之书', '一只鲨鱼鱼', '1.0.0');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '无问题提示', '🌊 鲨鲨歪着脑袋：你还没有提出问题呢，要问些什么呀？');
    seal.ext.registerStringConfig(ext, '生成失败提示', '🌊 答案之书被海水浸湿了：{error}');
    seal.ext.registerStringConfig(ext, '结果为空提示', '🌊 鲨鲨翻遍了书页，却没有找到答案……也许问题太深奥了？');
    seal.ext.registerStringConfig(ext, '网络错误提示', '🌊 海底暗流涌动，答案之书暂时打不开了……');
    seal.ext.registerTemplateConfig(ext, '成功前缀文案', [
        '🦈 鲨鲨轻轻翻开深海中的答案之书，书页泛起微光：',
        '🌊 海浪将答案之书推到你的脚边，上面写着：',
        '🐚 你听到贝壳里传来低沉的回响：',
        '✨ 月光照在书页上，浮现出一行字：',
        '📖 鲨鲨用鱼鳍指向书中的一行，念道：'
    ]);
}

let cmdFile = seal.ext.newCmdItemInfo();
cmdFile.name = '答案之书';
cmdFile.help = `鲨鲨翻开神秘的答案之书，为你的困惑给出指引
用法：
  .答案之书 <你的问题>     询问一个问题，获得书中的答案
  。答案之书 <你的问题>    全角句号前缀同样支持
示例：
  .答案之书 我该继续坚持吗
  。答案之书 今天会有好事发生吗`;

cmdFile.solve = (ctx, msg, cmd) => {
    const question = cmd.args.join(' ').trim();

    if (!question) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '无问题提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    const apiUrl = `https://v2.xxapi.cn/api/answers?question=${encodeURIComponent(question)}`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            if (data.code !== 200) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '生成失败提示').replace('{error}', data.msg || '未知错误'));
                return;
            }

            const answer = data.data;
            if (!answer || !answer.title_zh) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '结果为空提示'));
                return;
            }

            const prefixes = seal.ext.getTemplateConfig(ext, '成功前缀文案');
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

            const titleZh = answer.title_zh;
            const descZh = answer.description_zh;
            const titleEn = answer.title_en;
            const descEn = answer.description_en;

            let reply = `${randomPrefix}\n`;
            reply += `🔮 ${titleZh}\n`;
            reply += `   ${descZh}`;
            if (titleEn && descEn) {
                reply += `\n\n🌐 ${titleEn}\n   ${descEn}`;
            }

            seal.replyToSender(ctx, msg, reply);
        })
        .catch(err => {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '网络错误提示'));
            console.error('Answers API error:', err);
        });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['答案之书'] = cmdFile;