// ==UserScript==
// @name         每日英语
// @author       一只鲨鱼鱼
// @version      1.0.0
// @description  海洋与鲨鱼风格的每日英语学习插件，返回随机单词及例句、短语等
// @timestamp    1745033610
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/每日英语.js
// @sealVersion  1.4.5
// ==/UserScript==

let ext = seal.ext.find('每日英语');
if (!ext) {
    ext = seal.ext['new']('每日英语', '一只鲨鱼鱼', '1.0.0');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '生成失败提示', '🌊 英语单词被海浪冲走了：{error}');
    seal.ext.registerStringConfig(ext, '结果为空提示', '🌊 鲨鲨在知识海洋里迷路了，没找到今天的单词……');
    seal.ext.registerStringConfig(ext, '网络错误提示', '🌊 海底网络不太稳定，鲨鲨没能找到单词……');
    seal.ext.registerTemplateConfig(ext, '成功前缀文案', [
        '🦈 鲨鲨从海洋图书馆衔来一张单词卡片：',
        '🌊 海浪卷来一个漂流瓶，里面写着今日单词：',
        '🐚 你捡起一枚会说话的贝壳，它轻轻念道：',
        '✨ 深海中浮现一行闪着磷光的文字：',
        '📜 鲨鲨展开一张古老的羊皮卷轴：'
    ]);
}

let cmdFile = seal.ext.newCmdItemInfo();
cmdFile.name = '每日英语';
cmdFile.help = `鲨鲨为你带来今日的英语单词与例句
用法：
  .每日英语            随机获取一个英语单词及学习内容
  。每日英语           全角句号前缀同样支持`;

cmdFile.solve = (ctx, msg, cmd) => {
    const apiUrl = 'https://v2.xxapi.cn/api/randomenglishwords';

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            if (data.code !== 200) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '生成失败提示').replace('{error}', data.msg || '未知错误'));
                return;
            }

            const wordData = data.data;
            if (!wordData || !wordData.word) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '结果为空提示'));
                return;
            }

            const word = wordData.word;
            const ukphone = wordData.ukphone || '';
            const usphone = wordData.usphone || '';
            const translation = wordData.translations?.[0];
            const transText = translation ? `[${translation.pos}] ${translation.tran_cn}` : '暂无翻译';

            let exampleText = '';
            if (wordData.sentences && wordData.sentences.length > 0) {
                const sen = wordData.sentences[0];
                exampleText = `📖 ${sen.s_content}\n    ${sen.s_cn}`;
            }

            let phraseText = '';
            if (wordData.phrases && wordData.phrases.length > 0) {
                const ph = wordData.phrases[0];
                phraseText = `🔖 ${ph.p_content} — ${ph.p_cn}`;
            }

            let phonetic = '';
            if (ukphone) phonetic += `英[${ukphone}]`;
            if (usphone) phonetic += ` 美[${usphone}]`;

            const prefixes = seal.ext.getTemplateConfig(ext, '成功前缀文案');
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

            let reply = `${randomPrefix}\n`;
            reply += `📌 单词：${word}\n`;
            if (phonetic) reply += `🔊 发音：${phonetic}\n`;
            reply += `📚 释义：${transText}`;
            if (exampleText) reply += `\n${exampleText}`;
            if (phraseText) reply += `\n${phraseText}`;

            seal.replyToSender(ctx, msg, reply);
        })
        .catch(err => {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '网络错误提示'));
            console.error('DailyEnglish API error:', err);
        });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['每日英语'] = cmdFile;