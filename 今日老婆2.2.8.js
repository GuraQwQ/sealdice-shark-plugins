// ==UserScript==
// @name         今日老婆
// @author       一只鲨鱼鱼
// @version      2.2.8
// @description  海洋与鲨鱼风格的今日老婆插件，支持结婚与换老婆功能
// @timestamp    1724394115
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/今日老婆.js
// @sealVersion  1.4.5
// ==/UserScript==

if (!seal.ext.find('wifeOfTheDay')) {
    const ext = seal.ext.new('wifeOfTheDay', '一只鲨鱼鱼', '2.2.8');
    seal.ext.register(ext);

    seal.ext.registerStringConfig(ext, '输出前缀', '🦈 今日老婆: ');
    seal.ext.registerStringConfig(ext, '无可选用户回复', '🌊 鲨鲨游遍了整个海域，也没有找到合适的人选呢……');
    seal.ext.registerStringConfig(ext, '重复抽取回复前缀', '🐚 你今天已经找到伴侣啦，ta是：');
    seal.ext.registerStringConfig(ext, '已婚再抽提示', '🌊 你今天已经和 {spouseName}({spouseQQ}) 结婚啦，不能再抽老婆咯～');
    seal.ext.registerStringConfig(ext, '已婚结婚提示', '🌊 你今天已经和 {spouseName}({spouseQQ}) 结婚啦，不能再结第二次哦。');
    seal.ext.registerStringConfig(ext, '未抽结婚提示', '🌊 你还没有抽到今日老婆呢，先使用 .今日老婆 抽取一位吧～');
    seal.ext.registerStringConfig(ext, '对方已婚提示', '🌊 你的今日老婆已经和别人结婚了呢……');
    seal.ext.registerStringConfig(ext, '黑名单结婚提示', '🌊 黑名单中的成员无法参与结婚哦。');
    seal.ext.registerStringConfig(ext, '已婚换老婆提示', '🌊 换不了老婆哦～你已经是 {spouseName}({spouseQQ}) 命定终身的另一半了！');
    seal.ext.registerStringConfig(ext, '未抽换老婆提示', '🌊 你今天还没有抽到老婆呢，不需要换哦。');
    seal.ext.registerStringConfig(ext, '设置更新提示', '🦈 设置已更新');
    seal.ext.registerStringConfig(ext, '设置值错误提示', '🌊 鲨鲨看不懂这个值呢，请使用 true 或 false。');
    seal.ext.registerStringConfig(ext, '黑名单操作无QQ提示', '🌊 请告诉鲨鲨要操作的QQ号呀～');
    seal.ext.registerStringConfig(ext, '黑名单添加成功', '🦈 已将 {qq} 加入黑名单');
    seal.ext.registerStringConfig(ext, '黑名单已存在', '🌊 {qq} 早就在黑名单里了哦。');
    seal.ext.registerStringConfig(ext, '黑名单移除成功', '🦈 已将 {qq} 从黑名单中释放～');
    seal.ext.registerStringConfig(ext, '黑名单不存在', '🌊 {qq} 不在黑名单里呢。');
    seal.ext.registerStringConfig(ext, '黑名单用法提示', '🌊 用法：.今日老婆 黑名单 添加/移除 QQ号');
    seal.ext.registerTemplateConfig(ext, '结婚前缀文案', [
        '💒 深海钟声回荡，神圣的婚礼殿堂向新人敞开大门——',
        '🌊 海浪为你们奏响婚礼进行曲，鲨鲨作为证婚人宣布：',
        '🐚 贝壳里传来古老的海誓山盟，今天我们将见证：'
    ]);
    seal.ext.registerStringConfig(ext, '结婚祝福文案', '新郎新娘，今日我以深海的祝福赠予你们：愿你们的爱情如星光恒久璀璨，誓言如四季永恒长青。愿你们如潮汐般默契相随，如珍珠般包容温润，携手共赴人生的浩瀚海洋。');
    const data = {};

    const DEFAULT_OPTIONS = { shouldAt: false, allowMultipleWifePerDay: false, allowRepeatSelectionByOthers: false };

    function makeDefaultGroupData() {
        return {
            userRecords: [],
            dailySelectionMap: {},
            marriageMap: {},
            blacklists: [],
            options: { shouldAt: false, allowMultipleWifePerDay: false, allowRepeatSelectionByOthers: false }
        };
    }

    function getData(groupId) {
        try {
            var groupData = JSON.parse(ext.storageGet(groupId) || '{}');
            data[groupId] = {
                userRecords: groupData.userRecords || [],
                dailySelectionMap: groupData.dailySelectionMap || {},
                marriageMap: groupData.marriageMap || {},
                blacklists: groupData.blacklists || [],
                options: groupData.options || DEFAULT_OPTIONS
            };
        } catch (error) {
            console.error('Failed to initialize group data for groupId ' + groupId + ':', error);
            data[groupId] = makeDefaultGroupData();
        }
    }

    const extractPureId = (userId) => {
        const match = userId.match(/(\d+)/);
        return match ? match[1] : userId;
    };

    ext.onNotCommandReceived = async (ctx, msg) => {
        if (msg.messageType === 'group') {
            const groupId = msg.groupId;
            const pureUserId = extractPureId(msg.sender.userId);
            const userInfo = { qqNumber: pureUserId, nickname: msg.sender.nickname };
            if (!data.hasOwnProperty(groupId)) getData(groupId);
            const existingUser = data[groupId].userRecords.find(user => user.qqNumber === userInfo.qqNumber);
            if (existingUser) {
                let index = data[groupId].userRecords.indexOf(existingUser);
                if (index !== -1) data[groupId].userRecords[index].nickname = userInfo.nickname;
            } else {
                data[groupId].userRecords.push(userInfo);
            }
        }
    };

    function saveData(groupId) {
        try {
            ext.storageSet(groupId, JSON.stringify(data[groupId]));
        } catch (error) {
            console.error('Failed to save group data for groupId ' + groupId + ':', error);
        }
    }

    function isMarriedToday(groupId, qqNumber, today) {
        if (!data[groupId].marriageMap[today]) return false;
        const marriages = data[groupId].marriageMap[today];
        return Object.values(marriages).includes(qqNumber) || marriages.hasOwnProperty(qqNumber);
    }

    // === 新增：获取配偶信息 ===
    function getSpouseInfo(groupId, qqNumber, today) {
        if (!data[groupId].marriageMap[today]) return null;
        const marriages = data[groupId].marriageMap[today];
        let spouseQQ = null;
        if (marriages[qqNumber]) spouseQQ = marriages[qqNumber];
        else {
            for (let groom in marriages) {
                if (marriages[groom] === qqNumber) {
                    spouseQQ = groom;
                    break;
                }
            }
        }
        if (!spouseQQ) return null;
        const spouseUser = data[groupId].userRecords.find(u => u.qqNumber === spouseQQ);
        return { qq: spouseQQ, nickname: spouseUser ? spouseUser.nickname : spouseQQ };
    }

    // 执行抽取老婆的核心逻辑，返回结果消息
    function drawWife(groupId, pureUserId, today, ctx, msg) {
        // 检查用户是否已抽过老婆（受allowMultipleWifePerDay影响）
        if (!data[groupId].options.allowMultipleWifePerDay && data[groupId].dailySelectionMap[today][pureUserId]) {
            const previousUserId = data[groupId].dailySelectionMap[today][pureUserId];
            const prevUser = data[groupId].userRecords.find(u => u.qqNumber === previousUserId);
            return {
                success: false,
                message: `${seal.ext.getStringConfig(ext, '重复抽取回复前缀')}${prevUser ? prevUser.nickname : previousUserId} (ID: ${previousUserId})`
            };
        }

        // 构建候选池：排除黑名单、自己、今日已婚者、今日已被选者（根据设置）
        let candidatePool = data[groupId].userRecords.filter(user =>
            !data[groupId].blacklists.includes(user.qqNumber) &&
            user.qqNumber !== pureUserId &&
            !isMarriedToday(groupId, user.qqNumber, today)
        );

        if (!data[groupId].options.allowRepeatSelectionByOthers) {
            const selectedUsersToday = Object.values(data[groupId].dailySelectionMap[today]);
            candidatePool = candidatePool.filter(user => !selectedUsersToday.includes(user.qqNumber));
        }

        if (candidatePool.length === 0) {
            return {
                success: false,
                message: seal.ext.getStringConfig(ext, '无可选用户回复')
            };
        }

        const selectedUser = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        const outputPrefix = seal.ext.getStringConfig(ext, '输出前缀');
        const resultMessage = `${outputPrefix}${selectedUser.nickname} (ID: ${selectedUser.qqNumber})`;
        const atMessage = data[groupId].options.shouldAt ? `[CQ:at,qq=${selectedUser.qqNumber}] ` : '';
        const avatarUrl = `https://q2.qlogo.cn/headimg_dl?dst_uin=${selectedUser.qqNumber}&spec=5,cache=0`;
        const finalMessage = `${atMessage}\n[CQ:image,file=${avatarUrl}]\n${resultMessage}`;

        // 记录
        data[groupId].dailySelectionMap[today][pureUserId] = selectedUser.qqNumber;
        saveData(groupId);

        return {
            success: true,
            message: finalMessage,
            selectedUser: selectedUser
        };
    }

    const cmdWifeOfTheDay = seal.ext.newCmdItemInfo();
    cmdWifeOfTheDay.name = '今日老婆';
    cmdWifeOfTheDay.help = `🦈 鲨鲨的今日老婆功能
用法：
  .今日老婆              随机选择一位群成员作为今日老婆
  .今日老婆 help         查看详细帮助
  .今日老婆 黑名单 添加/移除 QQ号  管理黑名单（管理员）
  .今日老婆 设置 [序号] [true/false]  修改设置（管理员）
  .结婚                  与今日抽到的老婆结为终身伴侣（需先抽到老婆）
  .换老婆                解除今日老婆关系并重新抽取（已婚状态下不可用）
  。前缀同样支持全角句号`;

    cmdWifeOfTheDay.solve = async (ctx, msg, cmdArgs) => {
        const groupId = msg.groupId;
        const pureUserId = extractPureId(msg.sender.userId);
        const today = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).split(' ')[0];
        if (!data.hasOwnProperty(groupId)) getData(groupId);

        if (!data[groupId].dailySelectionMap[today]) data[groupId].dailySelectionMap[today] = {};

        const subCommand = cmdArgs.getArgN(1);
        const rawMsg = msg.message.trim();
        const isMarryCmd = rawMsg.startsWith('.结婚') || rawMsg.startsWith('。结婚');
        const isChangeCmd = rawMsg.startsWith('.换老婆') || rawMsg.startsWith('。换老婆');

        // === 新增：检查是否已婚 ===
        const married = isMarriedToday(groupId, pureUserId, today);
        const spouseInfo = married ? getSpouseInfo(groupId, pureUserId, today) : null;

        // 帮助
        if (subCommand === 'help') {
            const helpMessage = `
🦈 今日老婆 使用方法：
1. .今日老婆 - 随机抽取一位出现过的群成员为今日老婆。
2. .结婚 - 与今日抽到的老婆结为夫妻（需先抽到老婆，双方均需未婚）。
3. .换老婆 - 解除今日老婆关系，并立刻重新抽取一位新老婆（已婚无法使用）。
4. .今日老婆 黑名单 添加/移除 用户ID - 管理黑名单（需管理员）。
5. .今日老婆 设置 [序号] [true/false] - 修改设置（需管理员）
   - 1. 是否添加@功能
   - 2. 是否允许一天多个老婆（普通抽取）
   - 3. 是否允许重复被选为老婆
`;
            seal.replyToSender(ctx, msg, helpMessage);
            return seal.ext.newCmdExecuteResult(true);
        }

        // 设置
        if (subCommand === '设置') {
            if (ctx.privilegeLevel > 49) {
                const optionIndex = parseInt(cmdArgs.getArgN(2), 10);
                const value = cmdArgs.getArgN(3);
                if (isNaN(optionIndex) || (optionIndex < 1 || optionIndex > 3)) {
                    let text = '⚙️ 当前设置状态如下:';
                    text += `\n1. 是否添加@功能 ${data[groupId].options.shouldAt ? '✅允许' : '❌不允许'}`;
                    text += `\n2. 是否允许一天多个老婆 ${data[groupId].options.allowMultipleWifePerDay ? '✅允许' : '❌不允许'}`;
                    text += `\n3. 是否允许重复被选为老婆 ${data[groupId].options.allowRepeatSelectionByOthers ? '✅允许' : '❌不允许'}`;
                    text += '\n\n使用 .今日老婆 设置 [序号] [true/false] 修改';
                    seal.replyToSender(ctx, msg, text);
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (value !== 'true' && value !== 'false') {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '设置值错误提示'));
                    return seal.ext.newCmdExecuteResult(true);
                }
                const boolVal = value === 'true';
                switch (optionIndex) {
                    case 1: data[groupId].options.shouldAt = boolVal; break;
                    case 2: data[groupId].options.allowMultipleWifePerDay = boolVal; break;
                    case 3: data[groupId].options.allowRepeatSelectionByOthers = boolVal; break;
                }
                saveData(groupId);
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '设置更新提示'));
            } else {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
            }
            return seal.ext.newCmdExecuteResult(true);
        }

        // 黑名单
        if (subCommand === '黑名单') {
            if (ctx.privilegeLevel > 49) {
                const action = cmdArgs.getArgN(2);
                const targetUserId = extractPureId(cmdArgs.getArgN(3));
                if (!targetUserId) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单操作无QQ提示'));
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (action === '添加') {
                    if (!data[groupId].blacklists.includes(targetUserId)) {
                        data[groupId].blacklists.push(targetUserId);
                        saveData(groupId);
                        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单添加成功').replace('{qq}', targetUserId));
                    } else {
                        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单已存在').replace('{qq}', targetUserId));
                    }
                } else if (action === '移除') {
                    let index = data[groupId].blacklists.indexOf(targetUserId);
                    if (index !== -1) {
                        data[groupId].blacklists.splice(index, 1);
                        saveData(groupId);
                        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单移除成功').replace('{qq}', targetUserId));
                    } else {
                        seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单不存在').replace('{qq}', targetUserId));
                    }
                } else {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单用法提示'));
                }
            } else {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
            }
            return seal.ext.newCmdExecuteResult(true);
        }

        // 结婚指令（.结婚）
        if (isMarryCmd) {
            // 检查是否已结婚
            if (married) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '已婚结婚提示').replace('{spouseName}', spouseInfo.nickname).replace('{spouseQQ}', spouseInfo.qq));
                return seal.ext.newCmdExecuteResult(true);
            }

            // 检查是否抽到了老婆
            const spouseId = data[groupId].dailySelectionMap[today][pureUserId];
            if (!spouseId) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '未抽结婚提示'));
                return seal.ext.newCmdExecuteResult(true);
            }

            // 检查对方是否已婚
            if (isMarriedToday(groupId, spouseId, today)) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '对方已婚提示'));
                return seal.ext.newCmdExecuteResult(true);
            }

            // 检查黑名单
            if (data[groupId].blacklists.includes(spouseId) || data[groupId].blacklists.includes(pureUserId)) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '黑名单结婚提示'));
                return seal.ext.newCmdExecuteResult(true);
            }

            const groomUser = data[groupId].userRecords.find(u => u.qqNumber === pureUserId);
            const brideUser = data[groupId].userRecords.find(u => u.qqNumber === spouseId);
            const groomName = groomUser ? groomUser.nickname : pureUserId;
            const brideName = brideUser ? brideUser.nickname : spouseId;

            // 记录结婚
            if (!data[groupId].marriageMap[today]) data[groupId].marriageMap[today] = {};
            data[groupId].marriageMap[today][pureUserId] = spouseId;
            saveData(groupId);

            // 生成结婚文案（单条消息）
            const prefixes = seal.ext.getTemplateConfig(ext, '结婚前缀文案');
            const randomPre = prefixes[Math.floor(Math.random() * prefixes.length)];
            const weddingText = seal.ext.getStringConfig(ext, '结婚祝福文案');
            const mainText = `今天，我们共同见证 ${groomName}(${pureUserId}) 与 ${brideName}(${spouseId}) 的结合！`;
            const groomAvatar = `[CQ:image,file=https://q2.qlogo.cn/headimg_dl?dst_uin=${pureUserId}&spec=5,cache=0]`;
            const brideAvatar = `[CQ:image,file=https://q2.qlogo.cn/headimg_dl?dst_uin=${spouseId}&spec=5,cache=0]`;

            const finalMsg = `${randomPre}\n${weddingText}\n${mainText}\n${groomAvatar}  ${brideAvatar}`;
            seal.replyToSender(ctx, msg, finalMsg);
            return seal.ext.newCmdExecuteResult(true);
        }

        // 换老婆指令（.换老婆）
        if (isChangeCmd) {
            // 检查是否已婚
            if (married) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '已婚换老婆提示').replace('{spouseName}', spouseInfo.nickname).replace('{spouseQQ}', spouseInfo.qq));
                return seal.ext.newCmdExecuteResult(true);
            }

            // 检查今日是否有抽选记录
            if (!data[groupId].dailySelectionMap[today][pureUserId]) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '未抽换老婆提示'));
                return seal.ext.newCmdExecuteResult(true);
            }

            // 删除原有记录
            delete data[groupId].dailySelectionMap[today][pureUserId];
            // 立即重新抽取并发送结果
            const drawResult = drawWife(groupId, pureUserId, today, ctx, msg);
            seal.replyToSender(ctx, msg, drawResult.message);
            return seal.ext.newCmdExecuteResult(drawResult.success);
        }

        // 普通抽取老婆 (.今日老婆)
        if (married) {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '已婚再抽提示').replace('{spouseName}', spouseInfo.nickname).replace('{spouseQQ}', spouseInfo.qq));
            return seal.ext.newCmdExecuteResult(false);
        }

        if (data[groupId].userRecords.length === 0) {
            seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '无可选用户回复'));
            return seal.ext.newCmdExecuteResult(true);
        }

        const drawResult = drawWife(groupId, pureUserId, today, ctx, msg);
        seal.replyToSender(ctx, msg, drawResult.message);
        return seal.ext.newCmdExecuteResult(drawResult.success);
    };

    ext.cmdMap['今日老婆'] = cmdWifeOfTheDay;
    ext.cmdMap['jrlp'] = cmdWifeOfTheDay;
    ext.cmdMap['结婚'] = cmdWifeOfTheDay;
    ext.cmdMap['换老婆'] = cmdWifeOfTheDay;
}