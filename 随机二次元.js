// ==UserScript==
// @name         随机二次元图片
// @author       一只鲨鱼鱼
// @version      1.0.0
// @description  返回随机二次元图片（PC/手机端）
// @timestamp    1745033610
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/随机二次元.js
// @sealVersion  1.4.5
// ==/UserScript==

let ext = seal.ext.find('随机二次元图片');
if (!ext) {
    ext = seal.ext['new']('随机二次元图片', '一只鲨鱼鱼', '1.0.0');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '参数错误提示', '🌊 鲨鲨歪了歪脑袋：参数只能是 pc 或 wap 哦～');
    seal.ext.registerStringConfig(ext, '生成失败提示', '🌊 海浪把图片卷走了：{error}');
    seal.ext.registerStringConfig(ext, '结果为空提示', '🌊 这片海域没有找到图片……');
    seal.ext.registerStringConfig(ext, '网络错误提示', '🌊 海底光缆好像断开了，图片没能传过来……');
    seal.ext.registerTemplateConfig(ext, '成功前缀文案', [
        '🦈 鲨鲨从深海中捞起一张泛着荧光的画卷：',
        '🌊 海浪轻轻推来一个贝壳，里面藏着一张图片：',
        '🐚 你在沙滩上捡到一个漂流瓶，瓶中的画纸上画着：',
        '✨ 月光洒在海面，映出一幅神秘的影像：',
        '🧜 人鱼的低语传来，指引你看向这幅画面：'
    ]);
}

let cmdFile = seal.ext.newCmdItemInfo();
cmdFile.name = '二次元';
cmdFile.help = `随机获取一张二次元图片
用法：
  .二次元              随机PC端图片
  .二次元 pc           PC端图片
  .二次元 wap          手机端图片
  。二次元 ...         全角句号前缀同样支持`;

cmdFile.solve = (ctx, msg, cmd) => {
    let type = 'pc';
    const arg = cmd.args[0]?.toLowerCase();
    if (arg === 'wap' || arg === '手机') {
        type = 'wap';
    } else if (arg === 'pc' || arg === '电脑') {
        type = 'pc';
    } else if (arg) {
        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '参数错误提示'));
        return seal.ext.newCmdExecuteResult(true);
    }

    const apiUrl = `https://v2.xxapi.cn/api/randomAcgPic?type=${type}&return=json`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            if (data.code !== 200) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '生成失败提示').replace('{error}', data.msg || '未知错误'));
                return;
            }
            const imageUrl = data.data;
            if (!imageUrl) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '结果为空提示'));
                return;
            }

            const prefixes = seal.ext.getTemplateConfig(ext, '成功前缀文案');
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

            seal.replyToSender(ctx, msg, randomPrefix);
            seal.replyToSender(ctx, msg, `[CQ:image,file=${imageUrl}]`);
        })
        .catch(err => {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '网络错误提示'));
            console.error('AcgPic API error:', err);
        });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['二次元'] = cmdFile;