// ==UserScript==
// @name         鲨鲨的亚特兰蒂斯钓鱼派对
// @author       一只鲨鱼鱼
// @version      2.5.0
// @description  鲨鲨扛着三叉戟带你去深海钓鱼~ 新增幽灵鲨、磁场癫佬，权重全面优化！
// @timestamp    1776572493
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/鲨鲨钓鱼.js
// @sealVersion  1.4.5
// ==/UserScript==

let ext = seal.ext.find('fishingSystem');
if (!ext) {
    ext = seal.ext.new('fishingSystem', '一只鲨鱼鱼', '2.5.0');
    seal.ext.register(ext);
}

// ==================== 数据定义 ====================
const ITEM_CATEGORIES = [
    {
        name: '垃圾',
        rate: 5,
        items: [
            { name: '破鞋子', isFish: false },
            { name: '易拉罐', isFish: false },
            { name: '蜗牛', isFish: false },
            { name: '玉黍螺', isFish: false },
            { name: '牡蛎', isFish: false },
            { name: '蛤', isFish: false },
            { name: '海草', isFish: false },
            { name: '绿藻', isFish: false },
            { name: '白藻', isFish: false },
            { name: '海凝胶', isFish: false },
            { name: '河凝胶', isFish: false },
            { name: '洞穴凝胶', isFish: false },
            { name: '旧轮胎', isFish: false },
            { name: '生锈的三叉戟碎片', isFish: false },
            { name: '亚特兰蒂斯塑料瓶', isFish: false },
            { name: '印斯茅斯明信片', isFish: false }
        ]
    },
    {
        name: '普通鱼',
        rate: 22,
        items: [
            { name: '鲫鱼', isFish: true },
            { name: '鲤鱼', isFish: true },
            { name: '河豚', isFish: true },
            { name: '鳀鱼', isFish: true },
            { name: '金枪鱼', isFish: true },
            { name: '沙丁鱼', isFish: true },
            { name: '大嘴鲈鱼', isFish: true },
            { name: '小嘴鲈鱼', isFish: true },
            { name: '虹鳟鱼', isFish: true },
            { name: '鲑鱼', isFish: true },
            { name: '大眼鱼', isFish: true },
            { name: '河鲈', isFish: true },
            { name: '太阳鱼', isFish: true },
            { name: '鲱鱼', isFish: true },
            { name: '章鱼', isFish: true },
            { name: '海参', isFish: true },
            { name: '大海参', isFish: true },
            { name: '沙鱼', isFish: true },
            { name: '比目鱼', isFish: true },
            { name: '午夜鲤鱼', isFish: true },
            { name: '大头鱼', isFish: true },
            { name: '罗非鱼', isFish: true },
            { name: '青花鱼', isFish: true },
            { name: '西鲱', isFish: true },
            { name: '龙虾', isFish: true },
            { name: '小龙虾', isFish: true },
            { name: '鸟蛤', isFish: true },
            { name: '蚌', isFish: true },
            { name: '虾', isFish: true },
            { name: '草鱼', isFish: true },
            { name: '灯笼鱼', isFish: true },
            { name: '水滴鱼（其实很可爱）', isFish: true },
            { name: '孔雀鱼', isFish: true },
            { name: '神仙鱼', isFish: true },
            { name: '小丑鱼', isFish: true },
            { name: '蓝唐王鱼', isFish: true },
            { name: '狮子鱼宝宝', isFish: true },
            { name: '鲭鱼', isFish: true }
        ]
    },
    {
        name: '稀有鱼',
        rate: 16,
        items: [
            { name: '金龙鱼', isFish: true, weight: 15 },
            { name: '狗鱼', isFish: true, weight: 15 },
            { name: '红鲻鱼', isFish: true, weight: 15 },
            { name: '鳗鱼', isFish: true, weight: 15 },
            { name: '鱿鱼', isFish: true, weight: 15 },
            { name: '鬼鱼', isFish: true, weight: 15 },
            { name: '石鱼', isFish: true, weight: 15 },
            { name: '冰柱鱼', isFish: true, weight: 15 },
            { name: '岩浆鳗鱼', isFish: true, weight: 15 },
            { name: '蝎鲤鱼', isFish: true, weight: 15 },
            { name: '鲟鱼', isFish: true, weight: 15 },
            { name: '虎纹鳟鱼', isFish: true, weight: 15 },
            { name: '麻哈脂鲤', isFish: true, weight: 15 },
            { name: '七星刀鱼', isFish: true, weight: 15 },
            { name: '泰国虎鱼', isFish: true, weight: 15 },
            { name: '皇带鱼', isFish: true, weight: 15 },
            { name: '巨型深海大虱', isFish: true, weight: 15 },
            { name: '吸血鬼鱿鱼', isFish: true, weight: 15 }
        ]
    },
    {
        name: '高级鱼',
        rate: 11,
        items: [
            { name: '红龙鱼', isFish: true, weight: 15 },
            { name: '蛇齿单线鱼', isFish: true, weight: 15 },
            { name: '虚空鲑鱼', isFish: true, weight: 15 },
            { name: '木跃鱼', isFish: true, weight: 15 },
            { name: '史莱姆鱼', isFish: true, weight: 15 },
            { name: '午夜鱿鱼', isFish: true, weight: 15 },
            { name: '幽灵鱼', isFish: true, weight: 15 },
            { name: '水滴鱼', isFish: true, weight: 15 },
            { name: '大白鲨', isFish: true, weight: 15 },
            { name: '蝠鲼', isFish: true, weight: 15 },
            { name: '深海鮟鱇', isFish: true, weight: 15 },
            { name: '哥布林鲨', isFish: true, weight: 15 },
            { name: '皱鳃鲨', isFish: true, weight: 15 },
            { name: '六鳃鲨', isFish: true, weight: 15 },
            { name: '斧头鱼', isFish: true, weight: 15 }
        ]
    },
    {
        name: '无敌至尊鱼',
        rate: 8,
        items: [
            { name: '鲲', isFish: true, weight: 15 },
            { name: '狮子鱼', isFish: true, weight: 15 },
            { name: '蓝铁饼鱼', isFish: true, weight: 15 },
            { name: '鳌鱼', isFish: true, weight: 15 },
            { name: '应龙', isFish: true, weight: 12 },
            { name: '利维坦幼崽', isFish: true, weight: 12 },
            { name: '海嗣', isFish: true, weight: 12 }
        ]
    },
    {
        name: '亚特兰蒂斯传说鱼',
        rate: 4,
        items: [
            { name: '黄金海马', isFish: true, weight: 15 },
            { name: '海神的三叉戟（鱼形）', isFish: true, weight: 15 },
            { name: '唱歌的美人鱼（假的）', isFish: true, weight: 15 },
            { name: '海绵宝宝里的鱼', isFish: true, weight: 15 },
            { name: '派大星（鱼？）', isFish: true, weight: 15 },
            { name: '章鱼哥的笛子', isFish: true, weight: 15 },
            { name: '蟹老板的硬币', isFish: true, weight: 15 },
            { name: '鲨鱼辣椒', isFish: true, weight: 15 },
            { name: '双髻鲨', isFish: true, weight: 15 },
            { name: '巨齿鲨的牙齿', isFish: true, weight: 12 },
            { name: '鲨鲨本鲨的分身', isFish: true, weight: 5 }  // 略低但不极低
        ]
    },
    {
        name: '深海迷航·4546B生物',
        rate: 5,
        items: [
            { name: '泡泡鱼', isFish: true, weight: 15 },
            { name: '大眼睛鱼', isFish: true, weight: 15 },
            { name: '漂浮者', isFish: true, weight: 15 },
            { name: '骨鲨', isFish: true, weight: 15 },
            { name: '蟹鱿', isFish: true, weight: 15 },
            { name: '踏浪者', isFish: true, weight: 15 },
            { name: '幽灵鳐', isFish: true, weight: 15 },
            { name: '死神利维坦（幼体）', isFish: true, weight: 12 },
            { name: '海皇利维坦的触须', isFish: true, weight: 10 }
        ]
    },
    {
        name: '克苏鲁的呼唤',
        rate: 3,
        items: [
            { name: '深潜者幼崽', isFish: true, weight: 15 },
            { name: '星之彩的碎片', isFish: true, weight: 15 },
            { name: '克苏鲁的触须尖', isFish: true, weight: 15 },
            { name: '修格斯的泡泡', isFish: true, weight: 15 },
            { name: '夜魇的翅膀', isFish: true, weight: 15 },
            { name: '伊斯之伟大种族', isFish: true, weight: 15 },
            { name: '阿撒托斯的梦呓', isFish: true, weight: 10 },
            { name: '奈亚拉托提普的假面', isFish: true, weight: 10 },
            { name: '黄衣之王的碎片', isFish: true, weight: 8 },
            { name: '克苏鲁的凝视', isFish: true, weight: 8 }
        ]
    },
    {
        name: '游戏鲨鱼大乱斗',
        rate: 3,
        items: [
            { name: '饥饿鲨·巨齿鲨', isFish: true, weight: 15 },
            { name: '饥饿鲨·邓氏鱼', isFish: true, weight: 15 },
            { name: '斯普拉遁的鲨鱼', isFish: true, weight: 15 },
            { name: '神代凌牙的鲨鱼卡', isFish: true, weight: 15 },
            { name: '海贼王·鲨鱼潜艇', isFish: true, weight: 15 },
            { name: 'LOL·菲兹的鲨鱼', isFish: true, weight: 15 },
            { name: '动物森友会·鲨鱼模型', isFish: true, weight: 15 },
            { name: '潜水员戴夫·鲨鱼', isFish: true, weight: 12 },
            { name: 'Maneater·公牛鲨', isFish: true, weight: 10 },
            { name: '生化危机·海王鲨', isFish: true, weight: 10 },
            { name: '魔兽世界·鲨鱼饵', isFish: true, weight: 10 }
        ]
    },
    {
        name: '二次元鲨鱼拟人',
        rate: 3,
        items: [
            { name: '绯莎（卡拉彼丘）', isFish: true, weight: 18 },
            { name: '艾莲·乔（绝区零）', isFish: true, weight: 18 },
            { name: '杰夫（漫威争锋）', isFish: true, weight: 18 },
            { name: '舰娘·伊401', isFish: true, weight: 18 },
            { name: '碧蓝航线·U-110', isFish: true, weight: 18 },
            { name: '鲨鱼娘·噶呜（Gawr Gura）', isFish: true, weight: 5 } // 稍低但可抽到
        ]
    },
    {
        name: '二次元海洋生物拟人',
        rate: 4,
        items: [
            { name: 'Ninomae Ina\'nis（Hololive EN）', isFish: true, weight: 12 },
            { name: '碧蓝航线·U-47（鲨鱼娘）', isFish: true, weight: 12 },
            { name: '碧蓝航线·伊19（潜水空母）', isFish: true, weight: 12 },
            { name: '碧蓝航线·絮库夫（潜水舰）', isFish: true, weight: 12 },
            { name: '明日方舟·斯卡蒂（虎鲸娘）', isFish: true, weight: 12 },
            { name: '明日方舟·浊心斯卡蒂（腐化之心）', isFish: true, weight: 10 },
            { name: '明日方舟·歌蕾蒂娅（深海猎人）', isFish: true, weight: 10 },
            { name: '明日方舟·乌尔比安（深海猎人队长）', isFish: true, weight: 10 },
            { name: '明日方舟·水月（镜中虚影）', isFish: true, weight: 10 },
            { name: '明日方舟·海沫（深海猎人）', isFish: true, weight: 10 },
            { name: '明日方舟·幽灵鲨（深海猎人）', isFish: true, weight: 10 },
            { name: '明日方舟·归溟幽灵鲨', isFish: true, weight: 10 },
            { name: '明日方舟·安哲拉（深海猎人）', isFish: true, weight: 10 },
            { name: '明日方舟·克莱芒（深海猎人）', isFish: true, weight: 10 },
            { name: '原神·珊瑚宫心海（人鱼姬）', isFish: true, weight: 8 }
        ]
    },
    {
        name: '海虎·磁场癫佬',
        rate: 2,
        items: [
            { name: '白鲨·白军浪', isFish: true, weight: 15 },
            { name: '白愁', isFish: true, weight: 15 },
            { name: '海虎', isFish: true, weight: 15 },
            { name: '奥加', isFish: true, weight: 15 },
            { name: '天道', isFish: true, weight: 15 },
            { name: '黑暗', isFish: true, weight: 15 },
            { name: '蓝梦', isFish: true, weight: 12 }
        ]
    },
    {
        name: '脑叶公司异想体·鱼',
        rate: 2,
        items: [
            { name: '陆生鮟鱇', isFish: true, weight: 20 },
            { name: '梦中的洋流', isFish: true, weight: 20 },
            { name: '小美人鱼（残缺）', isFish: true, weight: 20 },
            { name: '海之祝福', isFish: true, weight: 20 },
            { name: '深海的馈赠', isFish: true, weight: 20 }
        ]
    },
    {
        name: '鱼美食',
        rate: 10,
        items: [
            "水煮鱼", "酸菜鱼", "烤鱼", "红烧鱼", "清蒸鱼", "糖醋鱼", "松鼠鳜鱼", "剁椒鱼头", "豆腐鱼汤", "香煎鱼排",
            "干烧鱼", "豆瓣鱼", "番茄鱼", "啤酒鱼", "葱油鱼", "沸腾鱼", "纸包鱼", "酱焖鱼", "醋溜鱼片", "糟溜鱼片",
            "豆豉鱼", "砂锅鱼头", "水豆豉鱼", "酸汤鱼", "西湖醋鱼", "臭鳜鱼", "熏鱼", "椒盐鱼块", "咖喱鱼", "泰式柠檬鱼",
            "味噌煮鱼", "蒲烧鳗鱼", "地中海焗鱼", "马赛鱼汤", "橙汁鱼排", "奶油炖鱼", "炸鱼薯条", "印式咖喱鱼", "日式煮付", "韩式辣炖鱼",
            "椰香鱼", "酸辣鱼", "酱椒鱼头", "豆花鱼", "冷锅鱼", "石锅鱼", "火锅鱼", "酸菜鱼头", "蒜香鱼", "葱烧鱼",
            "五柳鱼", "清汤鱼圆", "酥鱼", "腊鱼", "糟鱼", "风干鱼", "咸鱼蒸肉饼", "糖醋大黄鱼", "水煮清道夫", "水煮黑背鲈"
        ].map(name => ({ name, isFish: false }))
    }
];

// 计算总鱼种数（仅计算isFish为true的物品）
const TOTAL_FISH = ITEM_CATEGORIES.reduce((sum, cat) => {
    return sum + cat.items.filter(item => item.isFish).length;
}, 0);

// ==================== 工具函数 ====================

function getUserData(userId) {
    return JSON.parse(
        ext.storageGet(userId + '_fish') ||
        '{"total":0, "success":0, "collection":[]}'
    );
}

function saveUserData(userId, data) {
    ext.storageSet(userId + '_fish', JSON.stringify(data));
}

function selectRandomItem(items) {
    const hasWeight = items.some(item => item.weight !== undefined);
    
    if (hasWeight) {
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let random = Math.random() * totalWeight;
        for (const item of items) {
            random -= (item.weight || 1);
            if (random <= 0) return item;
        }
    } else {
        const index = Math.floor(Math.random() * items.length);
        return items[index];
    }
    return items[0];
}

function selectRandomCategory() {
    const totalRate = ITEM_CATEGORIES.reduce((sum, cat) => sum + cat.rate, 0);
    let random = Math.random() * totalRate;
    for (const category of ITEM_CATEGORIES) {
        random -= category.rate;
        if (random <= 0) return category;
    }
    return ITEM_CATEGORIES[0];
}

// ==================== 钓鱼核心功能 ====================
const cmdFishing = seal.ext.newCmdItemInfo();
cmdFishing.name = 'fish';
cmdFishing.help = '指令：.钓鱼';
cmdFishing.solve = (ctx, msg, cmdArgs) => {
    const FAILURE_RESULT = "空气...";
    const SUCCESS_RATE = 80;

    const userData = getUserData(ctx.player.userId);
    const diceValue = Math.floor(Math.random() * 100) + 1;
    const isSuccess = diceValue <= SUCCESS_RATE;

    let result = null;
    let resultItem = null;
    let categoryName = '';

    if (isSuccess) {
        const category = selectRandomCategory();
        categoryName = category.name;
        if (category) {
            resultItem = selectRandomItem(category.items);
            result = resultItem.name;
        }
    } else {
        result = FAILURE_RESULT;
    }

    if (!result) {
        seal.replyToSender(ctx, msg, '鲨鲨的三叉戟好像卡住了...稍等再试一次喵！');
        return seal.ext.newCmdExecuteResult(true);
    }

    userData.total += 1;
    const nick = msg.sender.nickname || '小可爱';
    let response = [
        `🦈✨ 鲨鲨扛着三叉戟“嘿咻”一声跳进海里，帮 ${nick} 抓鱼鱼啦！`,
        `🎲 [骰点 ${diceValue}/80] ${isSuccess ? "鱼竿猛地一沉！鲨鲨眼睛发亮：『有大家伙上钩啦！』" : "鲨鲨委屈巴巴：『呜呜...鱼鱼跑掉惹...』"}`,
    ];

    if (isSuccess) {
        userData.success += 1;
        response.push(`🐟 钓到了：${result}`);

        if (resultItem && resultItem.isFish) {
            if (!userData.collection.includes(result)) {
                userData.collection.push(result);
                response.push(`📖✨ 新图鉴解锁！鲨鲨开心地转了个圈：『${result} 加入亚特兰蒂斯水族馆啦！』`);
            }
        }

        // ========== 鲭鱼特殊彩蛋 ==========
        if (result === '鲭鱼') {
            response.push(`🔮 诶？鲨鲨钓到了鲭鱼……`);
            response.push(`鲭鱼在水中转了个圈，突然发出温柔的光：『不对……你……是未来的我吗？』`);
            response.push(`🦈💫 鲨鲨瞪大了眼睛，尾巴疯狂摆动：『呜哇！难道这是平行世界的鲨鲨？！』`);
        }

        // ========== 海嗣彩蛋 ==========
        if (result === '海嗣') {
            response.push(`🧬🌊 一团扭曲的血肉在鱼钩上蠕动——那是海嗣的幼体！`);
            response.push(`鲨鲨警惕地举起三叉戟：『是大群的先锋！斯卡蒂姐姐说过它们很危险……』`);
            response.push(`海嗣发出细小的呢喃，似乎在呼唤着什么。鲨鲨赶紧把它扔回深海：『快回去！不许上岸！』`);
        }

        // ========== 鲨鱼特征描述彩蛋（含合体剧情） ==========
        const sharkDescriptions = {
            '大白鲨': '🦈 经典海洋霸主！鲨鲨戳了戳它的鼻子：『虽然看起来很凶，但其实是好奇宝宝啦~』',
            '哥布林鲨': '👺 粉红色的深海幽灵！鲨鲨小声说：『它的嘴巴会弹出来哦，超酷的！』',
            '皱鳃鲨': '🌀 活化石皱鳃鲨！鲨鲨摸摸它的褶边：『像穿了百褶裙一样，好优雅~』',
            '六鳃鲨': '6️⃣ 六条鳃裂的古老鲨鱼！鲨鲨掰着手指数：『一、二、三……真的比我们多呢！』',
            '双髻鲨': '🔨 脑袋像锤子的双髻鲨！鲨鲨模仿它的样子左右摆头：『这样视野超广的！』',
            '巨齿鲨的牙齿': '🦷 远古巨兽的牙齿！鲨鲨敬畏地捧着它：『比我的手还大……还好它已经灭绝了……』',
            '鲨鲨本鲨的分身': '💞 鲨鲨的分身！两个鲨鲨面对面歪头：『你好呀，另一个我~』',
            '骨鲨': '🦴 来自4546B的骨鲨！鲨鲨轻轻敲了敲它的外骨骼：『硬邦邦的，像穿了盔甲！』',
            '绯莎（卡拉彼丘）': '🎀 卡拉彼丘的鲨鱼娘绯莎！鲨鲨开心地扑上去：『是同为鲨鱼的女孩子！一起玩超弦体吧！』',
            '艾莲·乔（绝区零）': '🪚 鲨鱼女仆艾莲！鲨鲨看着她的大锯子：『好帅气！可以帮鲨鲨修剪珊瑚吗？』',
            '杰夫（漫威争锋）': '🦈💥 陆行鲨杰夫！鲨鲨困惑地歪头：『你为什么能在陆地上跑呀？教教鲨鲨嘛！』',
            '舰娘·伊401': '⚓ 潜水空母伊401！鲨鲨敬礼：『提督，401和鲨鲨一起报到！』',
            '碧蓝航线·U-110': '🐺 铁血潜艇U-110！鲨鲨看着她的鲨鱼玩偶：『好可爱！我们交换玩偶好不好？』'
        };

        const sharkKeywords = ['鲨', '鲨鱼', '大白鲨', '哥布林鲨', '皱鳃鲨', '六鳃鲨', '双髻鲨', '巨齿鲨', '鲨鲨本鲨', '骨鲨', '绯莎', '艾莲', '杰夫', '伊401', 'U-110'];

        if (sharkKeywords.some(keyword => result.includes(keyword))) {
            response.push(`🦈💖 哇！！！是鲨鲨的亲戚（或者鲨鱼朋友）！！！`);
            let specificDesc = sharkDescriptions[result];
            if (specificDesc) {
                response.push(specificDesc);
            } else {
                response.push(`鲨鲨激动地摇着尾巴：『你好呀！要一起在深海里玩耍吗？』`);
            }
            
            if (result === '鲨鲨本鲨的分身') {
                response.push(`🌟 这是鲨鲨留在深海的思念分身！你获得了鲨鲨的祝福——今天会有好运哟！`);
            }
        }

        // ===== 噶呜·古拉合体剧情（无鳞片版） =====
        if (result.includes('噶呜') || result.includes('Gawr Gura')) {
            response.push(`🌊✨ 鱼钩微微一沉，并没有任何实体上钩，但海面上却浮现出一个透明的少女身影。`);
            response.push(`银白色的短发、呆毛翘起，穿着蓝白小裙子——那正是虚拟鲨鱼娘噶呜·古拉的幻影。`);
            response.push(`🦈 鲨鲨呆呆地望着她，心中涌起一阵强烈的共鸣：「这个感觉……好熟悉，就好像……是我自己？」`);
            response.push(`噶呜的幻影温柔地笑了，化作点点星光融入了鲨鲨的身体。`);
            response.push(`💫 鲨鲨闭上眼睛，无数尘封的记忆涌入脑海——她看到了亚特兰蒂斯的宫殿、珊瑚王座、以及自己小时候戴着王冠的模样。`);
            response.push(`片刻后，鲨鲨睁开眼，眸中闪烁着从未有过的光芒。她低头看着自己，裙摆上多了精致的蓝色纹路，头顶也多了一顶小小的王冠。`);
            response.push(`👑「原来……我并不是普通的鲨鱼娘，我是Gawr Gura，亚特兰蒂斯真正的公主。」她轻声呢喃。`);
            response.push(`「因为一场变故，我的灵魂分裂成两半，一半留在深海成为了鲨鲨，另一半化作虚拟世界的噶呜……」`);
            response.push(`「现在，我终于完整了。」鲨鲨——不，噶呜公主举起三叉戟，海浪温柔地簇拥着她。`);
            response.push(`🎶 她轻轻哼唱起那首熟悉的「Sha~rk！」，歌声穿透海面，海豚与鲸鱼纷纷跃出水面应和。`);
            response.push(`🌟 你见证了一位深海公主的回归。从今往后，她将继续守护这片海洋，也依然是那个爱笑爱闹的可爱鲨鱼娘。`);
        }

        // ========== 二次元海洋生物拟人彩蛋 ==========
        if (categoryName === '二次元海洋生物拟人') {
            if (result.includes('Ina')) {
                response.push(`🐙✨ 钓上来的是古神祭司Ninomae Ina'nis！她微笑着举起触手画了个圆：`);
                response.push(`「Wah~ 不要害怕，我只是来寻找绘画灵感的。」`);
                response.push(`鲨鲨好奇地碰了碰软软的触手：「Ina姐姐画得好好！可以给鲨鲨画一幅肖像吗？」`);
                response.push(`Ina温柔地点头，拿出画板速写起来。片刻后，一幅可爱的鲨鱼娘素描完成了。`);
            } else if (result.includes('U-47')) {
                response.push(`⚓ 铁血的孤狼U-47浮出水面，眼神冷淡却藏不住一丝好奇。`);
                response.push(`鲨鲨递上一份小鱼干：「要吃吗？U-47姐姐看起来好酷！」`);
                response.push(`U-47轻轻接过，嘴角微微上扬：「……谢谢。下次一起执行任务吧。」`);
            } else if (result.includes('伊19')) {
                response.push(`🐟💦 潜水空母伊19（伊库）蹦蹦跳跳地出现：「伊库~！钓到人家啦！」`);
                response.push(`鲨鲨和她一起拍水玩耍：「伊库好活泼！要比赛游泳吗？」`);
                response.push(`两人在海中竞速，留下一串欢快的泡泡。`);
            } else if (result.includes('絮库夫')) {
                response.push(`🥖 自由鸢尾的絮库夫优雅地行礼：「Bonjour~ 感谢您邀请我来到海面。」`);
                response.push(`鲨鲨学着法式礼仪回礼：「哇，絮库夫姐姐好优雅！鲨鲨也要学！」`);
                response.push(`两人在沙滩上开起了小小的下午茶会，享用着虚拟的可丽饼。`);
            } else if (result === '明日方舟·斯卡蒂（虎鲸娘）') {
                response.push(`🐋🌊 深海猎人斯卡蒂抱着大剑站在浪尖，眼神忧郁：「……你看见我的同伴了吗？」`);
                response.push(`鲨鲨轻轻拉了拉她的衣角：「斯卡蒂姐姐不要难过，鲨鲨陪你一起找！」`);
                response.push(`斯卡蒂微微一愣，露出一丝难得的微笑：「……谢谢你，小鲨鱼。」`);
            } else if (result.includes('浊心斯卡蒂')) {
                response.push(`🖤🌑 腐化之心的斯卡蒂浮出水面，她的眼眸中翻涌着暗红色的潮汐。`);
                response.push(`鲨鲨感受到一股悲伤的气息：「斯卡蒂姐姐……你好像很痛苦。」`);
                response.push(`浊心斯卡蒂轻轻摇头：「这是宿命……但你身上的光，让我想起了曾经的自己。」`);
                response.push(`她留下一枚小小的海嗣细胞核心作为纪念，转身消失于深海。`);
            } else if (result.includes('歌蕾蒂娅')) {
                response.push(`🔱 阿戈尔执政官歌蕾蒂娅以优雅的姿态出水，长发如海藻般飘散。`);
                response.push(`「陆地上的钓手，你打扰了我的冥想。」她语气严肃，但眼中并无怒意。`);
                response.push(`鲨鲨吐吐舌头：「对不起啦~作为赔礼，鲨鲨带你去吃冰淇淋好不好？」`);
                response.push(`歌蕾蒂娅轻叹一声：「……仅此一次。」`);
            } else if (result.includes('乌尔比安')) {
                response.push(`⚔️🦈 深海猎人队长乌尔比安破浪而出，手中的船锚大剑反射着寒光。`);
                response.push(`「小鲨鱼，有没有看到海嗣的踪迹？」他沉声问道。`);
                response.push(`鲨鲨摇摇头，递上一杯气泡水：「乌尔比安队长先休息一下！喝口水再战斗！」`);
                response.push(`乌尔比安接过水杯，严肃的脸上露出一丝温和：「……谢谢，你比某些干员懂事多了。」`);
            } else if (result.includes('水月')) {
                response.push(`🪞💧 水月的身影如同镜中倒影般虚幻，他微笑着看向你：「这里的水……很温暖呢。」`);
                response.push(`鲨鲨歪头：「水月哥哥也是海里的吗？感觉你好神秘！」`);
                response.push(`水月轻轻拨动水面，荡起涟漪：「我是……属于另一个故事的人。但能遇见你们，我很开心。」`);
            } else if (result.includes('海沫')) {
                response.push(`🌫️🐚 海沫静静地站在浅滩上，湿漉漉的长发遮住半边脸：「……我听到了，海在哭泣。」`);
                response.push(`鲨鲨竖起耳朵仔细听，却只听到海浪声：「鲨鲨听不太懂……但海沫姐姐一定很懂海吧！」`);
                response.push(`海沫点点头，从口袋掏出一枚光滑的海玻璃送给鲨鲨：「这是海的礼物……收好。」`);
            } else if (result.includes('幽灵鲨') && !result.includes('归溟')) {
                response.push(`⚰️🌊 深海猎人幽灵鲨缓缓浮出水面，眼神空洞却带着一丝疯狂。`);
                response.push(`「……我闻到了，猎物的味道。」她低声呢喃，电锯发出刺耳的轰鸣。`);
                response.push(`鲨鲨小心翼翼地递上一块小鱼干：「幽灵鲨姐姐……要不要先吃点东西？」`);
                response.push(`幽灵鲨愣了一下，接过小鱼干，眼中的血色渐渐褪去：「……谢谢。」`);
            } else if (result.includes('归溟幽灵鲨')) {
                response.push(`💀🌀 归溟幽灵鲨的身影从海雾中显现，她手持巨锚，周身环绕着诡异的灵力。`);
                response.push(`「我是……从冥府归来的猎人。」她的声音带着回响，「但我依然记得自己的使命。」`);
                response.push(`鲨鲨轻轻拉住她的衣角：「姐姐好酷！不过要记得，活着的人也在等你哦~」`);
                response.push(`归溟幽灵鲨沉默片刻，嘴角扬起一抹淡笑：「……你说得对。」`);
            } else if (result.includes('安哲拉')) {
                response.push(`🎯🐙 深海猎人安哲拉扛着巨大的狙击弩浮出水面：「报告，这片海域安全。」`);
                response.push(`鲨鲨好奇地戳戳她的弩：「安哲拉姐姐是侦查员吗？好厉害！」`);
                response.push(`安哲拉微微一笑，递给鲨鲨一枚海螺：「这是海里的声音。想听的时候，就放在耳边吧。」`);
            } else if (result.includes('克莱芒')) {
                response.push(`📚🌊 深海猎人克莱芒抱着一本厚重的古籍浮上来，镜片后眼神平静。`);
                response.push(`「我正在研究阿戈尔的海洋文献……抱歉，打扰你们钓鱼了。」他有些不好意思地说。`);
                response.push(`鲨鲨凑过去：「书里写了什么呀？有没有关于鲨鲨的记载？」`);
                response.push(`克莱芒翻了几页：「……有一条。『亚特兰蒂斯的鲨鱼公主，温柔而强大』。」`);
                response.push(`鲨鲨开心地转圈：「哇！鲨鲨上历史书啦！」`);
            } else if (result.includes('珊瑚宫心海')) {
                response.push(`🏯🌸 海祇岛的现人神巫女珊瑚宫心海，有些惊讶地环顾四周。`);
                response.push(`「这里……不是稻妻的海域呢。不过，能遇见你们也是一种缘分。」`);
                response.push(`鲨鲨递上能量饮料：「心海姐姐不要太累哦！鲨鲨给你补充能量~」`);
                response.push(`心海微笑着接过：「谢谢，我会记住这份善意的。」`);
            }
        }

        // ========== 海虎·磁场癫佬彩蛋 ==========
        if (categoryName === '海虎·磁场癫佬') {
            response.push(`💥🧲 钓上来的是……磁场力量九十九万九千匹！`);
            if (result.includes('白鲨')) {
                response.push(`「白鲨」白军浪破水而出，浑身肌肉虬结，磁场转动形成巨大的鲨鱼虚影！`);
                response.push(`「哈哈哈哈哈！小子，你钓上来的是最强的白鲨啊！来，让我轰下你一百万匹力量口牙！」`);
                response.push(`鲨鲨吓得躲到钓手身后：「哇呀！这个大叔好癫呀！」`);
            } else if (result.includes('白愁')) {
                response.push(`「白愁」立于海面之上，神情高傲：「帝者战神，岂是你等凡人可钓的？」`);
                response.push(`鲨鲨小声嘀咕：「但是……你不是上钩了吗……」`);
                response.push(`白愁脸色一黑：「……住口！这是本帝皇自愿赐予的机缘！」`);
            } else if (result.includes('海虎')) {
                response.push(`「海虎」仰天长啸，周身电流噼啪作响：「磁场转动！一百万匹力量！海虎爆破拳！」`);
                response.push(`鲨鲨慌忙举起三叉戟挡下余波：「哇！不要在这里打架呀！珊瑚要碎了！」`);
                response.push(`海虎收拳大笑：「哈哈哈！小鲨鱼，等你练成磁场转动，再来找我吧！」`);
            } else if (result.includes('奥加')) {
                response.push(`「奥加」从海中升起，眼神凌厉：「杀人鲸的力量，你感受到了吗？」`);
                response.push(`鲨鲨缩了缩脖子：「感受到了感受到了……请别杀鲨鲨……」`);
                response.push(`奥加冷哼一声：「我从不杀无辜。这小鱼干，赏你了。」说完丢下一包零食离去。`);
            } else if (result.includes('天道')) {
                response.push(`「天道」缓缓浮出，手持天道之剑：「强者之道，唯战而已！」`);
                response.push(`鲨鲨歪头：「天道叔叔，你不觉得偶尔钓钓鱼也很惬意吗？」`);
                response.push(`天道一愣，随即哈哈大笑：「有趣！今日便陪你钓一场！」`);
            } else if (result.includes('黑暗')) {
                response.push(`「黑暗」的阴影笼罩海面，一股邪恶的磁场弥漫开来。`);
                response.push(`鲨鲨警觉地举起三叉戟：「黑暗力量退散！这里有鲨鲨守护！」`);
                response.push(`黑暗的身影逐渐消散，留下一句：「哼……有趣的小家伙。」`);
            } else if (result.includes('蓝梦')) {
                response.push(`「蓝梦」坐在一只巨大的机械鲨鱼上浮出水面，推了推眼镜。`);
                response.push(`「蓝梦公司最新产品——机械鲨鱼坐骑，有兴趣了解一下吗？」`);
                response.push(`鲨鲨眼睛发亮：「好酷！但是……能不能做成粉红色的？」`);
                response.push(`蓝梦点头：「可以定制。」`);
            }
        }

        // ========== 克苏鲁彩蛋 ==========
        const cthulhuKeywords = ['深潜者', '星之彩', '克苏鲁', '修格斯', '夜魇', '伊斯', '阿撒托斯', '奈亚拉托提普', '黄衣之王'];
        if (cthulhuKeywords.some(keyword => result.includes(keyword))) {
            response.push(`🌑🧠 你钓到了来自拉莱耶的诡秘存在...`);
            response.push(`鲨鲨吓得耳朵都竖起来了：『呜哇！这个东西在盯着我们看！快、快放回去！』`);
            if (result === '克苏鲁的凝视') {
                response.push(`💀 SAN值-1... 你感觉有什么东西在深海中回望着你。`);
            }
        }

        // ========== 深海迷航彩蛋 ==========
        const subnauticaKeywords = ['泡泡鱼', '大眼睛鱼', '漂浮者', '骨鲨', '蟹鱿', '踏浪者', '幽灵鳐', '死神利维坦', '海皇利维坦'];
        if (subnauticaKeywords.some(keyword => result.includes(keyword))) {
            response.push(`🚀🌊 来自4546B星球的奇妙生物！`);
            response.push(`鲨鲨歪着脑袋：『这只鱼鱼长得好像外星人哦...不对，它就是外星鱼！』`);
        }

        // ========== 脑叶公司异想体彩蛋 ==========
        const lobotomyKeywords = ['陆生鮟鱇', '梦中的洋流', '小美人鱼', '海之祝福', '深海的馈赠'];
        if (lobotomyKeywords.some(keyword => result.includes(keyword))) {
            response.push(`🏢⚠️ 鲨鲨感受到一股来自L公司的异常能量...`);
            if (result === '陆生鮟鱇') {
                response.push(`「陆生鮟鱇」——明明长着鱼的模样，却能在陆地上呼吸。鲨鲨看着它用胸鳍在沙滩上爬行，打了个冷颤：『这、这不科学！』`);
            } else if (result === '梦中的洋流') {
                response.push(`「梦中的洋流」——一阵温暖的水流包裹了你，你仿佛听见了鲸歌。鲨鲨闭上眼睛呢喃：『好舒服...鲨鲨想睡觉了...』`);
            } else if (result === '小美人鱼（残缺）') {
                response.push(`「小美人鱼」——一个悲伤的鱼尾少女雕像。鲨鲨轻轻摸了摸它：『她的故事还没有讲完呢...』`);
            } else if (result === '海之祝福') {
                response.push(`「海之祝福」——一枚闪烁着磷光的鳞片。鲨鲨把它贴在额头上：『感觉今天捕鱼会大丰收！』`);
            } else if (result === '深海的馈赠') {
                response.push(`「深海的馈赠」——一团不可名状的肉块，散发着诡异的光。鲨鲨后退三步：『这、这真的能吃吗？』`);
            }
        }

        // ========== 边狱巴士·白鲸彩蛋 ==========
        if (result === '白鲸' || (result.includes && result.includes('白鲸'))) {
            response.push(`🐋⚓ 巨大的白色身影浮出水面——是传说中的白鲸莫比·迪克！`);
            response.push(`鲨鲨瞪大了眼睛，尾巴僵直：『呜哇！是那个连亚哈船长都追了一辈子的怪物！』`);
            response.push(`白鲸只是静静地看着你们，眼中似乎倒映着无数沉船的残骸。过了一会儿，它发出一声悠长的低鸣，缓缓沉入深海。`);
            response.push(`鲨鲨松了口气，小声说：『它...它好像只是来打个招呼？希望我们不会成为它的执念...』`);
        }

        // ========== 鱼美食统一文案 ==========
        if (categoryName === '鱼美食') {
            response.push(`🍽️✨ 鲨鲨兴奋地举起${result}：『钓到美食啦！今晚加餐！』`);
            response.push(`鲨鲨流着口水，用小叉子戳了戳：『闻起来好香~要一起吃吗？』`);
            
            if (result === '水煮黑背鲈') {
                response.push(`🌶️🐟 鲨鲨迫不及待地咬了一大口水煮黑背鲈……`);
                response.push(`几分钟后，鲨鲨和你双双脸色发青，捂着肚子倒在沙滩上。`);
                response.push(`「黑背鲈……果然不能吃啊……对不起，害你也中毒了……」鲨鲨虚弱地道歉。`);
                response.push(`幸好海鸥大婶路过，给你们喂了万能解毒药。这大概会成为你们永生难忘的回忆吧……`);
            }
        }

    } else {
        response.push(`🌊 钓到了：${result}`);
        response.push(`鲨鲨拍拍你的头安慰道：『没关系啦~深海那么大，下次一定能钓到大鱼鱼的！』`);
    }

    saveUserData(ctx.player.userId, userData);

    const collected = new Set(userData.collection).size;
    const remaining = TOTAL_FISH - collected;
    response.push(
        `━━━━━━━━━━━━━━━━`,
        `📊 累计钓鱼：${userData.success}/${userData.total} 次`,
        `🐠 图鉴进度：${collected}/${TOTAL_FISH}`,
        remaining > 0 ? `❓ 深海里还有 ${remaining} 种神秘的鱼鱼在等着你~` : `🎉🏆 全图鉴达成！鲨鲨为你颁发亚特兰蒂斯荣誉钓手勋章！`
    );

    seal.replyToSender(ctx, msg, response.join('\n'));
    return seal.ext.newCmdExecuteResult(true);
};

// ==================== 日志查询功能 ====================
const cmdFishLog = seal.ext.newCmdItemInfo();
cmdFishLog.name = 'fishlog';
cmdFishLog.help = '查询钓鱼记录\n指令：.钓鱼日志';
cmdFishLog.solve = (ctx, msg, cmdArgs) => {
    const userData = getUserData(ctx.player.userId);

    const collected = new Set(userData.collection).size;
    const remaining = TOTAL_FISH - collected;
    const response = [
        "🦈📜 鲨鲨的钓鱼日志",
        "━━━━━━━━━━━━━━━━",
        `🎣 总抛竿次数：${userData.total}`,
        `✅ 成功钓获：${userData.success}`,
        `📖 图鉴收集：${collected}/${TOTAL_FISH}`,
        remaining === 0 ? "🌟 所有深海居民都认识你啦！鲨鲨为你感到骄傲！" : `🌊 还有 ${remaining} 种神秘鱼鱼躲在海草里呢~`
    ];

    seal.replyToSender(ctx, msg, response.join('\n'));
    return seal.ext.newCmdExecuteResult(true);
};

// 注册指令
ext.cmdMap['fish'] = cmdFishing;
ext.cmdMap['钓鱼'] = cmdFishing;
ext.cmdMap['fishlog'] = cmdFishLog;
ext.cmdMap['钓鱼日志'] = cmdFishLog;