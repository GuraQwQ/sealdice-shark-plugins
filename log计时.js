// ==UserScript==
// @name         log记时
// @author       一只鲨鱼鱼
// @version      1.1.0
// @timestamp    1748000000
// @description  鲨鲨帮你记录跑团时长～ 所有提示文案均可自定义。
// @license      MIT
// @sealVersion  1.4.5
// ==/UserScript==

if (!seal.ext.find('log-timer')) {
    const ext = seal.ext.new('log-timer', '一只鲨鱼鱼', '1.1.0');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, 'msgLogOn', 
        '🦈✨ 潮汐流转，鲨鲨已经帮你打开了亚特兰蒂斯的计时沙漏，记录每一次深潜的时光！');
    seal.ext.registerStringConfig(ext, 'msgLogOffNoData', 
        '🌊 嘘…… 计时沙漏还没有开始流动呢，鲨鲨没有找到记录哦～');
    seal.ext.registerStringConfig(ext, 'msgLogOffNotRunning', 
        '🐟 鲨鲨歪头～ 沙漏本来就没有在计时呀，不要戏弄鲨鲨啦！');
    seal.ext.registerStringConfig(ext, 'msgLogOffSuccess', 
        '💤 鲨鲨停下来啦，让波浪轻轻抚平指针～\n本次深潜时长：{segment}\n累计深潜总时长：{total}');
    seal.ext.registerStringConfig(ext, 'msgLogEndNoData', 
        '🐚 珊瑚丛中没有发现任何计时痕迹，鲨鲨什么也没找到……');
    seal.ext.registerStringConfig(ext, 'msgLogEndSuccess', 
        '👑 亚特兰蒂斯的精粹沙漏缓缓停下，深海的流转回到了原点——\n深潜总时长：{final}');

    function formatTime(ms) {
        const total = Math.floor(ms / 1000);
        const h = String(Math.floor(total / 3600)).padStart(2, '0');
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const s = String(total % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    ext.onCommandReceived = (ctx, msg, cmdArgs) => {
        if (
            msg.messageType !== 'group' ||
            cmdArgs.command !== 'log' ||
            cmdArgs.args.length === 0
        ) {
            return seal.ext.newCmdExecuteResult(true);
        }

        const groupId = msg.groupId;
        const key = `LOG_TIMER_${groupId}`;
        const now = Date.now();
        const cmd = cmdArgs.args[0].toLowerCase();
        let reply = '';

        const msgOn = seal.ext.getStringConfig(ext, 'msgLogOn');
        const msgOffNoData = seal.ext.getStringConfig(ext, 'msgLogOffNoData');
        const msgOffNotRunning = seal.ext.getStringConfig(ext, 'msgLogOffNotRunning');
        const msgOffSuccess = seal.ext.getStringConfig(ext, 'msgLogOffSuccess');
        const msgEndNoData = seal.ext.getStringConfig(ext, 'msgLogEndNoData');
        const msgEndSuccess = seal.ext.getStringConfig(ext, 'msgLogEndSuccess');

        if (cmd === 'on' || cmd === 'new') {
            let data = ext.storageGet(key) || '';
            let timer;
            if (data) {
                try {
                    timer = JSON.parse(data);
                } catch (e) {
                    timer = { total: 0, start: now, running: true };
                }
            } else {
                timer = { total: 0, start: now, running: true };
            }

            timer.start = now;
            timer.running = true;
            ext.storageSet(key, JSON.stringify(timer));
            reply = msgOn;

        } else if (cmd === 'off') {
            const data = ext.storageGet(key) || '';
            if (!data) {
                reply = msgOffNoData;
            } else {
                let timer;
                try {
                    timer = JSON.parse(data);
                } catch (e) {
                    reply = msgOffNoData;
                    seal.replyToSender(ctx, msg, reply);
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (!timer.running) {
                    reply = msgOffNotRunning;
                } else {
                    const segment = now - timer.start;
                    timer.total += segment;
                    timer.running = false;
                    ext.storageSet(key, JSON.stringify(timer));
                    reply = msgOffSuccess
                        .replace('{segment}', formatTime(segment))
                        .replace('{total}', formatTime(timer.total));
                }
            }

        } else if (cmd === 'end' || cmd === 'halt') {
            const data = ext.storageGet(key) || '';
            if (!data) {
                reply = msgEndNoData;
            } else {
                let timer;
                try {
                    timer = JSON.parse(data);
                } catch (e) {
                    reply = msgEndNoData;
                    seal.replyToSender(ctx, msg, reply);
                    return seal.ext.newCmdExecuteResult(true);
                }
                let final = timer.total;
                if (timer.running) {
                    final += now - timer.start;
                }
                ext.storageSet(key, '');
                reply = msgEndSuccess.replace('{final}', formatTime(final));
            }
        }

        if (reply) {
            seal.replyToSender(ctx, msg, reply);
        }

        return seal.ext.newCmdExecuteResult(true);
    };
}