// ==UserScript==
// @name         COC7th自动属性检定
// @author       一只鲨鱼鱼
// @version      1.10.1
// @description  COC7th规则扩展：监听.sc/.st/.hp指令，自动进行智力/体质检定。群聊设置，默认开启，配置项全面可编辑。
// @timestamp    1714147200
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/coc自动属性检定.js
// @sealVersion  1.4.5
// ==/UserScript==

'use strict';

var PLUGIN_NAME = 'COC7th自动属性检定';
var PLUGIN_VER = '1.10.1';
var PLUGIN_AUTHOR = '一只鲨鱼鱼';

// 属性名候选
var ATTR_NAMES = {
    san: ['理智', 'SAN', 'San', 'san', '理智值', 'Sanity', 'san值'],
    int: ['智力', 'INT', 'Int', 'int', '智力值', 'Intelligence', '灵感', '灵感值'],
    con: ['体质', 'CON', 'Con', 'con', '体质值', 'Constitution'],
    hp: ['体力', 'HP', 'Hp', 'hp', '生命值', '生命', 'hp值', 'HitPoints', '体力值'],
    hpmax: ['体力上限', 'HPmax', 'Hpmax', 'hpmax', '生命值上限', '最大体力', '最大HP', 'maxHP', 'HPMAX']
};

// 默认设置
var DEFAULT_SETTINGS = {
    autoInt: true,
    autoCon: true,
    intThreshold: 5
};

// ---------- 工具函数 ----------
function getAttrValue(ctx, attrType) {
    var candidates = ATTR_NAMES[attrType];
    if (!candidates) return null;
    for (var i = 0; i < candidates.length; i++) {
        var name = candidates[i];
        var val = seal.vars.intGet(ctx, '$m' + name);
        var numVal = Array.isArray(val) ? val[0] : val;
        if (numVal !== undefined && numVal !== null && numVal !== 0) return parseInt(numVal);
        val = seal.vars.intGet(ctx, name);
        numVal = Array.isArray(val) ? val[0] : val;
        if (numVal !== undefined && numVal !== null && numVal !== 0) return parseInt(numVal);
    }
    return null;
}

function getSettingsKey(ctx) {
    var gid = ctx.group ? ctx.group.groupId : 'private';
    return 'coc_auto_check_group_' + gid;
}

function makeDefaultSettings() {
    return { autoInt: true, autoCon: true, autoInsanity: true, intThreshold: 5 };
}

function loadSettings(ext, ctx) {
    var key = getSettingsKey(ctx);
    var data = ext.storageGet(key);
    if (!data) return makeDefaultSettings();
    try {
        var parsed = JSON.parse(data);
        var defaults = makeDefaultSettings();
        for (var k in parsed) { if (parsed.hasOwnProperty(k)) defaults[k] = parsed[k]; }
        return defaults;
    } catch (e) {
        return makeDefaultSettings();
    }
}

function saveSettings(ext, ctx, settings) {
    ext.storageSet(getSettingsKey(ctx), JSON.stringify(settings));
}

// 检测当前是否为DND规则（通过检测DND特有的角色卡属性）
function isDNDRule(ctx) {
    if (!ctx) return false;
    try {
        var dndAttrs = ['ac', 'AC', 'Ac', '护甲等级', 'pb', 'PB', '熟练加值', '力量调整值', '敏捷调整值', '体质调整值', '智力调整值', '感知调整值', '魅力调整值'];
        for (var i = 0; i < dndAttrs.length; i++) {
            var val = seal.vars.intGet(ctx, '$m' + dndAttrs[i]);
            var numVal = Array.isArray(val) ? val[0] : val;
            if (numVal !== undefined && numVal !== null && numVal !== 0) return true;
            val = seal.vars.intGet(ctx, dndAttrs[i]);
            numVal = Array.isArray(val) ? val[0] : val;
            if (numVal !== undefined && numVal !== null && numVal !== 0) return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

// 根据规则索引获取大成功/大失败判定
function getRuleCheck(ruleIndex) {
    if (ruleIndex === 1 || ruleIndex === 3) {
        return function(d100, target) {
            var isCrit = (d100 === 1) || (target >= 50 && d100 <= 5);
            var isFumble = (d100 === 100) || (target < 50 && d100 >= 96);
            return { crit: isCrit, fumble: isFumble };
        };
    }
    if (ruleIndex === 4) {
        return function(d100, target) {
            var isCrit = (d100 === 1) || (target >= 50 && d100 <= 5);
            var isFumble = d100 >= 96;
            return { crit: isCrit, fumble: isFumble };
        };
    }
    return function(d100, target) {
        var isCrit = (d100 === 1) || (target >= 50 && d100 <= 5);
        var isFumble = (d100 === 100) || (target < 50 && d100 >= 96);
        return { crit: isCrit, fumble: isFumble };
    };
}

function checkRoll(ruleIndex, d100, target) {
    if (target <= 0) return { success: false, levelName: '失败', rank: -1 };
    var rc = getRuleCheck(ruleIndex);
    var cr = rc(d100, target);
    var fifth = Math.floor(target / 5);
    var half = Math.floor(target / 2);
    if (cr.crit) return { success: true, levelName: '大成功', rank: 4 };
    if (cr.fumble) return { success: false, levelName: '大失败', rank: -2 };
    if (d100 <= fifth) return { success: true, levelName: '极难成功', rank: 3 };
    if (d100 <= half) return { success: true, levelName: '困难成功', rank: 2 };
    if (d100 <= target) return { success: true, levelName: '成功', rank: 1 };
    return { success: false, levelName: '失败', rank: 0 };
}

// 检定文本 — 使用 COC:检定_单项结果文本 模板以读取用户自定义文案
function buildRAText(ctx, attrDisplayName, attrValue) {
    var d100 = Math.floor(Math.random() * 100) + 1;
    var ruleIndex = ctx.group ? ctx.group.cocRuleIndex : 0;
    var result = checkRoll(ruleIndex, d100, attrValue);

    seal.vars.strSet(ctx, '$t检定表达式文本', attrDisplayName);
    seal.vars.strSet(ctx, '$t检定计算过程', '');
    seal.vars.intSet(ctx, '$tD100', d100);
    seal.vars.strSet(ctx, '$t属性表达式文本', attrDisplayName);
    seal.vars.intSet(ctx, '$t骰子出目', d100);
    seal.vars.intSet(ctx, '$t检定结果', d100);
    seal.vars.intSet(ctx, '$t判定值', attrValue);
    seal.vars.strSet(ctx, '$t判定结果', result.levelName);
    seal.vars.strSet(ctx, '$t判定结果_详细', result.levelName);
    seal.vars.strSet(ctx, '$t判定结果_简短', result.levelName);
    seal.vars.intSet(ctx, '$tSuccessRank', result.rank);

    var tmplText = seal.formatTmpl(ctx, 'COC:检定_单项结果文本');
    if (tmplText && tmplText.indexOf('<%未知项') === -1) {
        return { fullText: tmplText, levelName: result.levelName, success: result.success, d100: d100, rank: result.rank };
    }

    var playerName = '<' + ctx.player.name + '>';
    var mainText = '鲨鲨帮' + playerName + '从亚特兰蒂斯找贝壳，目标为"' + attrDisplayName + '"。过了一会，鲨鲨抓着一个外观奇特的贝壳回来了，交给鲨鲨吧！她这样说着，于是';
    var detail = '鲨鲨用魔法验证贝壳……：' + attrDisplayName + '检定=' + d100 + '/' + attrValue + ' ' + result.levelName;
    return { fullText: mainText + detail, levelName: result.levelName, success: result.success, d100: d100, rank: result.rank };
}

// 随机选取
function pickTemplateText(ext, key) {
    var arr = seal.ext.getTemplateConfig(ext, key);
    if (!Array.isArray(arr) || arr.length === 0) return '';

    var texts = [];
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (Array.isArray(item)) {
            // Goja 返回的每个元素是二元组 [text, weight]
            texts.push(String(item[0]));
        } else if (typeof item === 'string') {
            texts.push(item);
        }
    }
    if (texts.length === 0) return '';
    return texts[Math.floor(Math.random() * texts.length)];
}

// 从回复提取理智损失
function parseSCLoss(text) {
    var match = text.match(/理智[变化]*?\s*[:：]\s*\d+\s*➯\s*\d+\s*\(扣除[^=]*=\s*(\d+)\s*点?\)/i);
    if (match) return parseInt(match[1]);
    match = text.match(/\(扣除[^=]*=\s*(\d+)\s*点?\)/i);
    if (match && text.indexOf('理智') !== -1) return parseInt(match[1]);
    return null;
}

// 从回复提取HP损失
function parseHPLoss(text) {
    var deductMatch = text.match(/\(扣除[^=]*=\s*(\d+)\s*\)/i);
    if (!deductMatch) return null;
    var loss = parseInt(deductMatch[1]);
    var oldMatch = text.match(/「?(体力|HP|生命值|hp值?)」?\s*[:：]\s*(\d+)\s*➯/i);
    var oldHp = oldMatch ? parseInt(oldMatch[2]) : null;
    var newHp = oldHp !== null ? oldHp - loss : null;
    return { loss: loss, oldHp: oldHp, newHp: newHp };
}

// 智力结果
function getInspirationKey(levelName) {
    var map = {
        '大成功': 'inspiration_fumble_text',
        '极难成功': 'inspiration_extreme_success_text',
        '困难成功': 'inspiration_hard_success_text',
        '成功': 'inspiration_success_text',
        '失败': 'inspiration_fail_text',
        '大失败': 'inspiration_crit_text'
    };
    return map[levelName] || 'inspiration_fail_text';
}

// 重伤/濒死结果
function getConConfigKey(prefix, success) {
    return prefix + (success ? '_success_text' : '_fail_text');
}

// ---------- 疯狂症状表（COC7th规则书） ----------
var FEAR_MAP = {
    1: '洗澡恐惧症（Ablutophobia）：对于洗涤或洗澡的恐惧。',
    2: '恐高症（Acrophobia）：对于身处高处的恐惧。',
    3: '飞行恐惧症（Aerophobia）：对飞行的恐惧。',
    4: '广场恐惧症（Agoraphobia）：对于开放的（拥挤）公共场所的恐惧。',
    5: '恐鸡症（Alektorophobia）：对鸡的恐惧。',
    6: '大蒜恐惧症（Alliumphobia）：对大蒜的恐惧。',
    7: '乘车恐惧症（Amaxophobia）：对于乘坐地面载具的恐惧。',
    8: '恐风症（Ancraophobia）：对风的恐惧。',
    9: '男性恐惧症（Androphobia）：对于成年男性的恐惧。',
    10: '恐英症（Anglophobia）：对英格兰或英格兰文化的恐惧。',
    11: '恐花症（Anthophobia）：对花的恐惧。',
    12: '截肢者恐惧症（Apotemnophobia）：对截肢者的恐惧。',
    13: '蜘蛛恐惧症（Arachnophobia）：对蜘蛛的恐惧。',
    14: '闪电恐惧症（Astraphobia）：对闪电的恐惧。',
    15: '废墟恐惧症（Atephobia）：对遗迹或残址的恐惧。',
    16: '长笛恐惧症（Aulophobia）：对长笛的恐惧。',
    17: '细菌恐惧症（Bacteriophobia）：对细菌的恐惧。',
    18: '导弹/子弹恐惧症（Ballistophobia）：对导弹或子弹的恐惧。',
    19: '跌落恐惧症（Basophobia）：对于跌倒或摔落的恐惧。',
    20: '书籍恐惧症（Bibliophobia）：对书籍的恐惧。',
    21: '植物恐惧症（Botanophobia）：对植物的恐惧。',
    22: '美女恐惧症（Caligynephobia）：对美貌女性的恐惧。',
    23: '寒冷恐惧症（Cheimaphobia）：对寒冷的恐惧。',
    24: '恐钟表症（Chronomentrophobia）：对于钟表的恐惧。',
    25: '幽闭恐惧症（Claustrophobia）：对于处在封闭的空间中的恐惧。',
    26: '小丑恐惧症（Coulrophobia）：对小丑的恐惧。',
    27: '恐犬症（Cynophobia）：对狗的恐惧。',
    28: '恶魔恐惧症（Demonophobia）：对邪灵或恶魔的恐惧。',
    29: '人群恐惧症（Demophobia）：对人群的恐惧。',
    30: '牙科恐惧症（Dentophobia）：对牙医的恐惧。',
    31: '丢弃恐惧症（Disposophobia）：对于丢弃物件的恐惧（贮藏癖）。',
    32: '皮毛恐惧症（Doraphobia）：对动物皮毛的恐惧。',
    33: '过马路恐惧症（Dromophobia）：对于过马路的恐惧。',
    34: '教堂恐惧症（Ecclesiophobia）：对教堂的恐惧。',
    35: '镜子恐惧症（Eisoptrophobia）：对镜子的恐惧。',
    36: '针尖恐惧症（Enetophobia）：对针或大头针的恐惧。',
    37: '昆虫恐惧症（Entomophobia）：对昆虫的恐惧。',
    38: '恐猫症（Felinophobia）：对猫的恐惧。',
    39: '过桥恐惧症（Gephyrophobia）：对于过桥的恐惧。',
    40: '恐老症（Gerontophobia）：对于老年人或变老的恐惧。',
    41: '恐女症（Gynophobia）：对女性的恐惧。',
    42: '恐血症（Haemaphobia）：对血的恐惧。',
    43: '宗教罪行恐惧症（Hamartophobia）：对宗教罪行的恐惧。',
    44: '触摸恐惧症（Haphophobia）：对于被触摸的恐惧。',
    45: '爬虫恐惧症（Herpetophobia）：对爬行动物的恐惧。',
    46: '迷雾恐惧症（Homichlophobia）：对雾的恐惧。',
    47: '火器恐惧症（Hoplophobia）：对火器的恐惧。',
    48: '恐水症（Hydrophobia）：对水的恐惧。',
    49: '催眠恐惧症（Hypnophobia）：对于睡眠或被催眠的恐惧。',
    50: '白袍恐惧症（Iatrophobia）：对医生的恐惧。',
    51: '鱼类恐惧症（Ichthyophobia）：对鱼的恐惧。',
    52: '蟑螂恐惧症（Katsaridaphobia）：对蟑螂的恐惧。',
    53: '雷鸣恐惧症（Keraunophobia）：对雷声的恐惧。',
    54: '蔬菜恐惧症（Lachanophobia）：对蔬菜的恐惧。',
    55: '噪音恐惧症（Ligyrophobia）：对刺耳噪音的恐惧。',
    56: '恐湖症（Limnophobia）：对湖泊的恐惧。',
    57: '机械恐惧症（Mechanophobia）：对机器或机械的恐惧。',
    58: '巨物恐惧症（Megalophobia）：对于庞大物件的恐惧。',
    59: '捆绑恐惧症（Merinthophobia）：对于被捆绑或紧缚的恐惧。',
    60: '流星恐惧症（Meteorophobia）：对流星或陨石的恐惧。',
    61: '孤独恐惧症（Monophobia）：对于一人独处的恐惧。',
    62: '不洁恐惧症（Mysophobia）：对污垢或污染的恐惧。',
    63: '黏液恐惧症（Myxophobia）：对黏液（史莱姆）的恐惧。',
    64: '尸体恐惧症（Necrophobia）：对尸体的恐惧。',
    65: '数字8恐惧症（Octophobia）：对数字8的恐惧。',
    66: '恐牙症（Odontophobia）：对牙齿的恐惧。',
    67: '恐梦症（Oneirophobia）：对梦境的恐惧。',
    68: '称呼恐惧症（Onomatophobia）：对于特定词语的恐惧。',
    69: '恐蛇症（Ophidiophobia）：对蛇的恐惧。',
    70: '恐鸟症（Ornithophobia）：对鸟的恐惧。',
    71: '寄生虫恐惧症（Parasitophobia）：对寄生虫的恐惧。',
    72: '人偶恐惧症（Pediophobia）：对人偶的恐惧。',
    73: '吞咽恐惧症（Phagophobia）：对于吞咽或被吞咽的恐惧。',
    74: '药物恐惧症（Pharmacophobia）：对药物的恐惧。',
    75: '幽灵恐惧症（Phasmophobia）：对鬼魂的恐惧。',
    76: '日光恐惧症（Phenogophobia）：对日光的恐惧。',
    77: '胡须恐惧症（Pogonophobia）：对胡须的恐惧。',
    78: '河流恐惧症（Potamophobia）：对河流的恐惧。',
    79: '酒精恐惧症（Potophobia）：对酒或酒精的恐惧。',
    80: '恐火症（Pyrophobia）：对火的恐惧。',
    81: '魔法恐惧症（Rhabdophobia）：对魔法的恐惧。',
    82: '黑暗恐惧症（Scotophobia）：对黑暗或夜晚的恐惧。',
    83: '恐月症（Selenophobia）：对月亮的恐惧。',
    84: '火车恐惧症（Siderodromophobia）：对于乘坐火车出行的恐惧。',
    85: '恐星症（Siderophobia）：对星星的恐惧。',
    86: '狭室恐惧症（Stenophobia）：对狭小物件或地点的恐惧。',
    87: '对称恐惧症（Symmetrophobia）：对对称的恐惧。',
    88: '活埋恐惧症（Taphephobia）：对于被活埋或墓地的恐惧。',
    89: '公牛恐惧症（Taurophobia）：对公牛的恐惧。',
    90: '电话恐惧症（Telephonophobia）：对电话的恐惧。',
    91: '怪物恐惧症（Teratophobia）：对怪物的恐惧。',
    92: '深海恐惧症（Thalassophobia）：对海洋的恐惧。',
    93: '手术恐惧症（Tomophobia）：对外科手术的恐惧。',
    94: '十三恐惧症（Triskadekaphobia）：对数字13的恐惧症。',
    95: '衣物恐惧症（Vestiphobia）：对衣物的恐惧。',
    96: '女巫恐惧症（Wiccaphobia）：对女巫与巫术的恐惧。',
    97: '黄色恐惧症（Xanthophobia）：对黄色或"黄"字的恐惧。',
    98: '外语恐惧症（Xenoglossophobia）：对外语的恐惧。',
    99: '异域恐惧症（Xenophobia）：对陌生人或外国人的恐惧。',
    100: '动物恐惧症（Zoophobia）：对动物的恐惧。'
};

var MANIA_MAP = {
    1: '沐浴癖（Ablutomania）：执着于清洗自己。',
    2: '犹豫癖（Aboulomania）：病态地犹豫不定。',
    3: '喜暗狂（Achluomania）：对黑暗的过度热爱。',
    4: '喜高狂（Acromaniaheights）：狂热迷恋高处。',
    5: '亲切癖（Agathomania）：病态地对他人友好。',
    6: '喜旷症（Agromania）：强烈地倾向于待在开阔空间中。',
    7: '喜尖狂（Aichmomania）：痴迷于尖锐或锋利的物体。',
    8: '恋猫狂（Ailuromania）：近乎病态地对猫友善。',
    9: '疼痛癖（Algomania）：痴迷于疼痛。',
    10: '喜蒜狂（Alliomania）：痴迷于大蒜。',
    11: '乘车癖（Amaxomania）：痴迷于乘坐车辆。',
    12: '欣快癖（Amenomania）：不正常地感到喜悦。',
    13: '喜花狂（Anthomania）：痴迷于花朵。',
    14: '计算癖（Arithmomania）：狂热地痴迷于数字。',
    15: '消费癖（Asoticamania）：鲁莽冲动地消费。',
    16: '窃书癖（Biliokleptomania）：无法克制偷窃书籍的冲动。',
    17: '恋书狂（Bibliomania）：痴迷于书籍和/或阅读。',
    18: '磨牙癖（Bruxomania）：无法克制磨牙的冲动。',
    19: '灵臆症（Cacodemomania）：病态地坚信自己已被一个邪恶的灵体占据。',
    20: '美貌狂（Callomania）：痴迷于自身的美貌。',
    21: '地图狂（Cartacoethes）：在何时何处都无法控制查阅地图的冲动。',
    22: '跳跃狂（Catapedamania）：痴迷于从高处跳下。',
    23: '喜冷症（Cheimatomania）：对寒冷或寒冷的物体的反常喜爱。',
    24: '舞蹈狂（Choreomania）：无法控制地起舞或发颤。',
    25: '恋床癖（Clinomania）：过度地热爱待在床上。',
    26: '恋墓狂（Coimetormania）：痴迷于墓地。',
    27: '色彩狂（Coloromania）：痴迷于某种颜色。',
    28: '小丑狂（Coulromania）：痴迷于小丑。',
    29: '恐惧狂（Countermania）：执着于经历恐怖的场面。',
    30: '杀戮癖（Dacnomania）：痴迷于杀戮。',
    31: '魔臆症（Demonomania）：病态地坚信自己已被恶魔附身。',
    32: '抓挠癖（Dermatillomania）：执着于抓挠自己的皮肤。',
    33: '正义狂（Dikemania）：痴迷于目睹正义被伸张。',
    34: '嗜酒狂（Dipsomania）：反常地渴求酒精。',
    35: '赠物癖（Doromania）：痴迷于赠送礼物。',
    36: '漂泊症（Drapetomania）：执着于逃离。',
    37: '漫游癖（Ecdemiomania）：执着于四处漫游。',
    38: '自恋狂（Egomania）：近乎病态地以自我为中心或自我崇拜。',
    39: '职业狂（Empleomania）：对于工作的无尽病态渴求。',
    40: '臆罪症（Enosimania）：病态地坚信自己带有罪孽。',
    41: '学识狂（Epistemomania）：痴迷于获取学识。',
    42: '静止癖（Eremiomania）：执着于保持安静。',
    43: '乙醚上瘾（Etheromania）：渴求乙醚。',
    44: '求婚狂（Gamomania）：痴迷于进行奇特的求婚。',
    45: '狂笑癖（Geliomania）：无法自制地，强迫性的大笑。',
    46: '巫术狂（Goetomania）：痴迷于女巫与巫术。',
    47: '写作癖（Graphomania）：痴迷于将每一件事写下来。',
    48: '裸体狂（Gymnomania）：执着于裸露身体。',
    49: '妄想狂（Habromania）：近乎病态地充满愉快的妄想（而不顾现实状况如何）。',
    50: '蠕虫狂（Helminthomania）：过度地喜爱蠕虫。',
    51: '枪械狂（Hoplomania）：痴迷于火器。',
    52: '饮水狂（Hydromania）：反常地渴求水分。',
    53: '喜鱼癖（Ichthyomania）：痴迷于鱼类。',
    54: '图标狂（Iconomania）：痴迷于图标与肖像。',
    55: '偶像狂（Idolomania）：痴迷于甚至愿献身于某个偶像。',
    56: '信息狂（Infomania）：痴迷于积累各种信息与资讯。',
    57: '射击狂（Klazomania）：反常地执着于射击。',
    58: '偷窃癖（Kleptomania）：反常地执着于偷窃。',
    59: '噪音癖（Ligyromania）：无法自制地执着于制造响亮或刺耳的噪音。',
    60: '喜线癖（Linonomania）：痴迷于线绳。',
    61: '彩票狂（Lotterymania）：极端地执着于购买彩票。',
    62: '抑郁症（Lypemania）：近乎病态的重度抑郁倾向。',
    63: '巨石狂（Megalithomania）：当站在石环中或立起的巨石旁时，就会近乎病态地写出各种奇怪的创意。',
    64: '旋律狂（Melomania）：痴迷于音乐或一段特定的旋律。',
    65: '作诗癖（Metromania）：无法抑制地想要不停作诗。',
    66: '憎恨癖（Misomania）：憎恨一切事物，痴迷于憎恨某个事物或团体。',
    67: '偏执狂（Monomania）：近乎病态地痴迷与专注某个特定的想法或创意。',
    68: '夸大癖（Mythomania）：以一种近乎病态的程度说谎或夸大事物。',
    69: '臆想症（Nosomania）：妄想自己正在被某种臆想出的疾病折磨。',
    70: '记录癖（Notomania）：执着于记录一切事物（例如摄影）。',
    71: '恋名狂（Onomamania）：痴迷于名字（人物的、地点的、事物的）。',
    72: '称名癖（Onomatomania）：无法抑制地不断重复某个词语的冲动。',
    73: '剔指癖（Onychotillomania）：执着于剔指甲。',
    74: '恋食癖（Opsomania）：对某种食物的病态热爱。',
    75: '抱怨癖（Paramania）：一种在抱怨时产生的近乎病态的愉悦感。',
    76: '面具狂（Personamania）：执着于佩戴面具。',
    77: '幽灵狂（Phasmomania）：痴迷于幽灵。',
    78: '谋杀癖（Phonomania）：病态的谋杀倾向。',
    79: '渴光癖（Photomania）：对光的病态渴求。',
    80: '求财癖（Plutomania）：对财富的强迫性的渴望。',
    81: '欺骗狂（Pseudomania）：无法抑制的执着于撒谎。',
    82: '纵火狂（Pyromania）：执着于纵火。',
    83: '提问狂（Questiong-Asking Mania）：执着于提问。',
    84: '挖鼻癖（Rhinotillexomania）：执着于挖鼻子。',
    85: '涂鸦癖（Scribbleomania）：沉迷于涂鸦。',
    86: '列车狂（Siderodromomania）：认为火车或类似的依靠轨道交通的旅行方式充满魅力。',
    87: '臆智症（Sophomania）：臆想自己拥有难以置信的智慧。',
    88: '科技狂（Technomania）：痴迷于新的科技。',
    89: '臆咒狂（Thanatomania）：坚信自己已被某种死亡魔法所诅咒。',
    90: '臆神狂（Theomania）：坚信自己是一位神灵。',
    91: '抓挠癖（Titillomaniac）：抓挠自己的强迫倾向。',
    92: '手术狂（Tomomania）：对进行手术的不正常爱好。',
    93: '拔毛癖（Trichotillomania）：执着于拔下自己的头发。',
    94: '臆盲症（Typhlomania）：病理性的失明。',
    95: '嗜外狂（Xenomania）：痴迷于异国的事物。',
    96: '喜兽癖（Zoomania）：对待动物的态度近乎疯狂地友好。',
    97: '喜兽癖（Zoomania）：对待动物的态度近乎疯狂地友好。',
    98: '喜兽癖（Zoomania）：对待动物的态度近乎疯狂地友好。',
    99: '喜兽癖（Zoomania）：对待动物的态度近乎疯狂地友好。',
    100: '喜兽癖（Zoomania）：对待动物的态度近乎疯狂地友好。'
};

function diceRoll(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// 抽取临时疯狂症状（模拟 .ti）
function drawTemporaryInsanity(ctx, msg) {
    var num = diceRoll(10);
    var extraNum1 = diceRoll(10);
    var desc = '';
    var extraNum2 = null;

    switch (num) {
        case 1:
            desc += '失忆：调查员会发现自己只记得最后身处的安全地点，却没有任何来到这里的记忆。例如，调查员前一刻还在家中吃着早饭，下一刻就已经直面着不知名的怪物。这将会持续 1D10=' + extraNum1 + ' 轮。';
            break;
        case 2:
            desc += '假性残疾：调查员陷入了心理性的失明，失聪以及躯体缺失感中，持续 1D10=' + extraNum1 + ' 轮。';
            break;
        case 3:
            desc += '暴力倾向：调查员陷入了六亲不认的暴力行为中，对周围的敌人与友方进行着无差别的攻击，持续 1D10=' + extraNum1 + ' 轮。';
            break;
        case 4:
            desc += '偏执：调查员陷入了严重的偏执妄想之中。有人在暗中窥视着他们，同伴中有人背叛了他们，没有人可以信任，万事皆虚。持续 1D10=' + extraNum1 + ' 轮。';
            break;
        case 5:
            desc += '人际依赖：守秘人适当参考调查员的背景中重要之人的条目，调查员因为一些原因而将他人误认为了他重要的人并且努力的会与那个人保持那种关系，持续 1D10=' + extraNum1 + ' 轮。';
            break;
        case 6:
            desc += '昏厥：调查员当场昏倒，并需要 1D10=' + extraNum1 + ' 轮才能苏醒。';
            break;
        case 7:
            desc += '逃避行为：调查员会用任何的手段试图逃离现在所处的位置，即使这意味着开走唯一一辆交通工具并将其它人抛诸脑后，调查员会试图逃离 1D10=' + extraNum1 + ' 轮。';
            break;
        case 8:
            desc += '歇斯底里：调查员表现出大笑，哭泣，嘶吼，害怕等的极端情绪表现，持续 1D10=' + extraNum1 + ' 轮。';
            break;
        case 9:
            extraNum2 = diceRoll(100);
            desc += '恐惧：调查员通过一次 D100 或者由守秘人选择，来从恐惧症状表中选择一个恐惧源，就算这一恐惧的事物是并不存在的，调查员的症状会持续 1D10=' + extraNum1 + ' 轮。';
            desc += '\n1D100=' + extraNum2 + '\n' + (FEAR_MAP[extraNum2] || '未知恐惧');
            break;
        case 10:
            extraNum2 = diceRoll(100);
            desc += '躁狂：调查员通过一次 D100 或者由守秘人选择，来从躁狂症状表中选择一个躁狂的诱因，这个症状将会持续 1D10=' + extraNum1 + ' 轮。';
            desc += '\n1D100=' + extraNum2 + '\n' + (MANIA_MAP[extraNum2] || '未知躁狂');
            break;
    }

    // 设置模板变量，确保用户自定义文案能正确渲染
    var playerName = ctx.player && ctx.player.name ? ctx.player.name : '调查员';
    seal.vars.strSet(ctx, '$t玩家', playerName);
    seal.vars.strSet(ctx, '$t表达式文本', '1D10=' + num);
    seal.vars.intSet(ctx, '$t选项值', num);
    seal.vars.intSet(ctx, '$t附加值1', extraNum1);
    if (extraNum2 !== null) seal.vars.intSet(ctx, '$t附加值2', extraNum2);
    seal.vars.strSet(ctx, '$t疯狂描述', desc);

    // 优先使用用户自定义文案模板
    var tmpl = seal.formatTmpl(ctx, 'COC:疯狂发作_即时症状');
    if (tmpl && tmpl.indexOf('<%未知项') === -1) {
        return tmpl;
    }
    return '【临时疯狂症状】\n1D10=' + num + '\n' + desc;
}

// 抽取总结性疯狂症状（模拟 .li）
function drawLongTermInsanity(ctx, msg) {
    var num = diceRoll(10);
    var extraNum1 = diceRoll(10);
    var desc = '';
    var extraNum2 = null;

    switch (num) {
        case 1:
            desc += '失忆：回过神来，调查员们发现自己身处一个陌生的地方，并忘记了自己是谁。记忆会随时间恢复。';
            break;
        case 2:
            desc += '被窃：调查员在 1D10=' + extraNum1 + ' 小时后恢复清醒，发觉自己被盗，身体毫发无损。如果调查员携带着宝贵之物（见调查员背景），做幸运检定来决定其是否被盗。所有有价值的东西无需检定自动消失。';
            break;
        case 3:
            desc += '遍体鳞伤：调查员在 1D10=' + extraNum1 + ' 小时后恢复清醒，发现自己身上满是拳痕和瘀伤。生命值减少到疯狂前的一半，但这不会造成重伤。调查员没有被窃。这种伤害如何持续到现在由守秘人决定。';
            break;
        case 4:
            desc += '暴力倾向：调查员陷入强烈的暴力与破坏欲之中。调查员回过神来可能会理解自己做了什么也可能毫无印象。调查员对谁或何物施以暴力，他们是杀人还是仅仅造成了伤害，由守秘人决定。';
            break;
        case 5:
            desc += '极端信念：查看调查员背景中的思想信念，调查员会采取极端和疯狂的表现手段展示他们的思想信念之一。比如一个信教者会在地铁上高声布道。';
            break;
        case 6:
            desc += '重要之人：考虑调查员背景中的重要之人，及其重要的原因。在 1D10=' + extraNum1 + ' 小时或更久的时间中，调查员将不顾一切地接近那个人，并为他们之间的关系做出行动。';
            break;
        case 7:
            desc += '被收容：调查员在精神病院病房或警察局牢房中回过神来，他们可能会慢慢回想起导致自己被关在这里的事情。';
            break;
        case 8:
            desc += '逃避行为：调查员恢复清醒时发现自己在很远的地方，也许迷失在荒郊野岭，或是在驶向远方的列车或长途汽车上。';
            break;
        case 9:
            extraNum2 = diceRoll(100);
            desc += '恐惧：调查员患上一个新的恐惧症状。在恐惧症状表上骰 1 个 D100 来决定症状，或由守秘人选择一个。调查员在 1D10=' + extraNum1 + ' 小时后回过神来，并开始为避开恐惧源而采取任何措施。';
            desc += '\n1D100=' + extraNum2 + '\n' + (FEAR_MAP[extraNum2] || '未知恐惧');
            break;
        case 10:
            extraNum2 = diceRoll(100);
            desc += '狂躁：调查员患上一个新的狂躁症状。在狂躁症状表上骰 1 个 d100 来决定症状，或由守秘人选择一个。调查员会在 1D10=' + extraNum1 + ' 小时后恢复理智。在这次疯狂发作中，调查员将完全沉浸于其新的狂躁症状。这症状是否会表现给旁人则取决于守秘人和此调查员。';
            desc += '\n1D100=' + extraNum2 + '\n' + (MANIA_MAP[extraNum2] || '未知躁狂');
            break;
    }

    // 设置模板变量，确保用户自定义文案能正确渲染
    var playerName = ctx.player && ctx.player.name ? ctx.player.name : '调查员';
    seal.vars.strSet(ctx, '$t玩家', playerName);
    seal.vars.strSet(ctx, '$t表达式文本', '1D10=' + num);
    seal.vars.intSet(ctx, '$t选项值', num);
    seal.vars.intSet(ctx, '$t附加值1', extraNum1);
    if (extraNum2 !== null) seal.vars.intSet(ctx, '$t附加值2', extraNum2);
    seal.vars.strSet(ctx, '$t疯狂描述', desc);

    // 优先使用用户自定义文案模板（COC:疯狂发作_总结症状 对应 .li）
    var tmpl = seal.formatTmpl(ctx, 'COC:疯狂发作_总结症状');
    if (tmpl && tmpl.indexOf('<%未知项') === -1) {
        return tmpl;
    }
    return '【总结性疯狂症状】\n1D10=' + num + '\n' + desc;
}

// ==================== 扩展创建 ====================
var ext = seal.ext.new(PLUGIN_NAME, PLUGIN_AUTHOR, PLUGIN_VER);

var HELP_TEXT = '【' + PLUGIN_NAME + ' v' + PLUGIN_VER + '】\n\n' +
'📋 功能说明（严格遵循COC7th规则）：\n' +
'1. SC一次损失≥5点SAN → 自动智力检定\n' +
'   • 智力成功 → 理解真相 → 陷入临时疯狂\n' +
'   • 智力失败 → 拒绝理解 → 不陷入疯狂\n' +
'   • SAN归零 → 不定性疯狂\n\n' +
'2. 一次损失≥HPmax/2的HP → 重伤体质检定\n' +
'3. HP归零 → 濒死体质检定\n\n' +
'🎲 规则检测：若检测到DND角色卡属性（如AC、熟练加值等），自动跳过COC检定\n\n' +
'⚙️ 设置指令（群聊统一管理，默认开启）：\n' +
'.自动属性检定              查看当前群聊设置\n' +
'.自动属性检定 help         帮助\n' +
'.自动属性检定 智力/体质/疯狂  开关单项\n' +
'.自动属性检定 开启/关闭    全开/全关\n';

var cmd = seal.ext.newCmdItemInfo();
cmd.name = '自动属性检定';
cmd.help = HELP_TEXT;
cmd.solve = function(ctx, msg, cmdArgs) {
    var arg1 = cmdArgs.getArgN(1);
    var settings = loadSettings(ext, ctx);

    if (arg1 === '帮助' || arg1 === 'help' || arg1 === 'h') {
        seal.replyToSender(ctx, msg, HELP_TEXT);
        return seal.ext.newCmdExecuteResult(true);
    }
    if (!arg1 || arg1 === '状态' || arg1 === 'st' || arg1 === 'status') {
        var s = '【群聊自动属性检定状态】\n';
        s += '智力检定: ' + (settings.autoInt ? '✅开启' : '❌关闭') + ' | 体质检定: ' + (settings.autoCon ? '✅开启' : '❌关闭') + ' | 疯狂症状: ' + (settings.autoInsanity ? '✅开启' : '❌关闭');
        seal.replyToSender(ctx, msg, s);
        return seal.ext.newCmdExecuteResult(true);
    }
    if (arg1 === '智力' || arg1 === 'int') {
        settings.autoInt = !settings.autoInt;
        saveSettings(ext, ctx, settings);
        seal.replyToSender(ctx, msg, '自动智力检定已' + (settings.autoInt ? '✅开启（全群生效）' : '❌关闭'));
        return seal.ext.newCmdExecuteResult(true);
    }
    if (arg1 === '体质' || arg1 === 'con') {
        settings.autoCon = !settings.autoCon;
        saveSettings(ext, ctx, settings);
        seal.replyToSender(ctx, msg, '自动体质检定已' + (settings.autoCon ? '✅开启（全群生效）' : '❌关闭'));
        return seal.ext.newCmdExecuteResult(true);
    }
    if (arg1 === '疯狂' || arg1 === 'insanity' || arg1 === 'ti') {
        settings.autoInsanity = !settings.autoInsanity;
        saveSettings(ext, ctx, settings);
        seal.replyToSender(ctx, msg, '自动疯狂症状抽取已' + (settings.autoInsanity ? '✅开启（全群生效）' : '❌关闭'));
        return seal.ext.newCmdExecuteResult(true);
    }
    if (arg1 === '开启' || arg1 === 'on') {
        settings.autoInt = true; settings.autoCon = true; settings.autoInsanity = true;
        saveSettings(ext, ctx, settings);
        seal.replyToSender(ctx, msg, '全部自动检定已 ✅ 开启（全群生效）');
        return seal.ext.newCmdExecuteResult(true);
    }
    if (arg1 === '关闭' || arg1 === 'off') {
        settings.autoInt = false; settings.autoCon = false; settings.autoInsanity = false;
        saveSettings(ext, ctx, settings);
        seal.replyToSender(ctx, msg, '全部自动检定已 ❌ 关闭');
        return seal.ext.newCmdExecuteResult(true);
    }
    seal.replyToSender(ctx, msg, '未知参数，请使用 .自动属性检定 帮助');
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['自动属性检定'] = cmd;

seal.ext.register(ext);

// ==================== 配置项注册 ====================
// 智力检定文本
seal.ext.registerTemplateConfig(ext, 'inspiration_crit_text', [
    "大失败……诶……？物极必反，红光没有侵入你们的大脑哪怕一分一毫！！！\n————————————\n鲨鲨睁开了眼睛……诶？无事发生！！！我们还在这里，太好了！（疯狂灵感失败，不进入疯狂状态）\n但是大失败效果就请kp另寻考虑啦~"
], '智力大失败文本');
seal.ext.registerTemplateConfig(ext, 'inspiration_fumble_text', [
    "大成功！！！！诶……？物极必反，你们完全理解了贝壳爆开后传递的信息……那股猩红…嗜血和杀戮……逃吗，逃不掉了，这就是宿命与终结。正如很久之前亚特兰蒂斯的沉没一样……\n————————————\n鲨鲨全身都散发着嗜血的杀戮气息，你感觉彻底完蛋啦——（疯狂灵感成功，进入疯狂状态）\n但是大成功效果就请kp另寻考虑啦~"
], '智力大成功文本');
seal.ext.registerTemplateConfig(ext, 'inspiration_fail_text', [
    "失败…诶……？物极必反，红光仅仅是闪了一下，就放弃了攻击，你们光滑的大脑皮层拒绝了红光的入侵！！！\n————————————\n鲨鲨恍惚了一下，随后歪歪头疑问发生什么了（疯狂灵感失败，不进入疯狂状态）"
], '智力失败文本');
seal.ext.registerTemplateConfig(ext, 'inspiration_success_text', [
    "成功！诶……？物极必反，贝壳爆发出的红光让你们产生了难以理解的幻觉，恐惧和血腥的幻觉在你们的眼前反复重放着，你…会是下一个吗？\n————————————\n鲨鲨瞳孔里的纯洁与天真的善良都被阴冷的杀意所取缔，最好……跑吧——（疯狂灵感成功，进入疯狂状态）"
], '智力普通成功文本');
seal.ext.registerTemplateConfig(ext, 'inspiration_hard_success_text', [
    "困难成功！！诶……？物极必反，贝壳爆发出的红光充分侵蚀了你们的大脑，无数呓语在你们的脑海中散播开来……\n————————————\n鲨鲨眼睛和头发都变得猩红，呆滞地看着你们……这难道就是杀意吗？（疯狂灵感成功，进入疯狂状态）"
], '智力困难成功文本');
seal.ext.registerTemplateConfig(ext, 'inspiration_extreme_success_text', [
    "极难成功！！！诶……？物极必反，贝壳爆发出的红光充分侵蚀了你们身体的每一个部位，古怪的呓语传遍了你们的全身，寒冷带着恐惧爬上了你们的脊椎……\n————————————\n猩红蔓延到了鲨鲨的全身上下，她看着你们的眼神带着阴冷的杀意……（疯狂灵感成功，进入疯狂状态）"
], '智力极难成功文本');
seal.ext.registerTemplateConfig(ext, 'inspiration_indefinite_text', [
    "要……要发生可怕的事了！！！呜呜……"
], '不定性疯狂文本');

// 重伤/濒死文本
seal.ext.registerTemplateConfig(ext, 'major_wound_success_text', [
    "深海的祝福环绕着你，剧痛被温柔的海浪抚平……你咬紧牙关，保持着清醒，仿佛亚特兰蒂斯的光辉仍在指引着你。"
], '重伤成功文本');
seal.ext.registerTemplateConfig(ext, 'major_wound_fail_text', [
    "巨大的痛楚如同深海漩涡将你吞噬，黑暗从四面八方涌来，你晕厥了过去……但愿醒来时，还能看见海面的阳光。"
], '重伤失败文本');
seal.ext.registerTemplateConfig(ext, 'dying_success_text', [
    "潮汐并未将你带走……来自亚特兰蒂斯的低语轻轻托住你的灵魂，你昏迷不醒，但生命之火仍顽强地摇曳着，就像海底不灭的灯塔。"
], '濒死成功文本');
seal.ext.registerTemplateConfig(ext, 'dying_fail_text', [
    "无尽的深海终于拥你入怀……你的生命之火悄然熄灭，化作一串气泡升向海面，回归了那古老而宁静的亚特兰蒂斯。"
], '濒死失败文本');

// 缺少属性提示
seal.ext.registerStringConfig(ext, 'no_attr_int', '未能在角色卡中找到【智力】属性，无法自动进行智力检定。\n💡 使用 .st 智力 <值> 设置属性，或 .自动属性检定 智力 关闭 禁用~', '缺少智力属性提示');
seal.ext.registerStringConfig(ext, 'no_attr_con', '未能在角色卡中找到【体质】属性，跳过体质检定。\n💡 使用 .st 体质 <值> 设置属性，或 .自动属性检定 体质 关闭 禁用~', '缺少体质属性提示');

// ==================== 钩子 ====================
ext.onCommandReceived = function(ctx, msg, cmdArgs) {
    return seal.ext.newCmdExecuteResult(true);
};

var _inOnMessageSend = false;

ext.onMessageSend = function(ctx, msg, flag) {
    if (_inOnMessageSend) return;
    _inOnMessageSend = true;
    try {
        var text = msg.message;
        if (!text) return;

        if (isDNDRule(ctx)) {
            return;
        }

        if (text.indexOf('理智变化') !== -1) {
            var loss = parseSCLoss(text);
            if (loss && loss > 0) {
                var settings = loadSettings(ext, ctx);
                if (!settings.autoInt) return;

                if (loss >= settings.intThreshold) {
                    var intValue = getAttrValue(ctx, 'int');
                    if (intValue !== null && intValue > 0) {
                        var sanBefore = 0;
                        var mSan = text.match(/理智[变化]*?\s*[:：]\s*(\d+)\s*➯/i);
                        if (mSan) sanBefore = parseInt(mSan[1]);
                        var curSan = sanBefore - loss;

                        if (curSan <= 0) {
                            var indefText = pickTemplateText(ext, 'inspiration_indefinite_text');
                            seal.replyToSender(ctx, msg,
                                '【鲨鲨的自动属性检定 — 不定性疯狂】\n' +
                                '呜哇…SAN值归零了！调查员陷入了不定性疯狂…好可怕呀…\n' + indefText +
                                '\n💡 使用 .自动属性检定 智力 关闭 可禁用本功能~'
                            );
                            return;
                        }

                        var ra = buildRAText(ctx, '智力', intValue);
                        var extraKey = getInspirationKey(ra.levelName);
                        var extraText = pickTemplateText(ext, extraKey);
                        var out = '【鲨鲨自动属性检定 — 智力检定】\n' + ra.fullText;
                        if (extraText) out += '\n' + extraText;
                        out += '\n💡 使用 .自动属性检定 智力 关闭 可禁用本功能~';
                        seal.replyToSender(ctx, msg, out);

                        if (ra.success && settings.autoInsanity) {
                            var insanityText = '';
                            if (loss >= Math.floor(sanBefore / 5)) {
                                insanityText = drawLongTermInsanity(ctx, msg);
                                seal.replyToSender(ctx, msg, '\n【鲨鲨自动属性检定 — 总结性疯狂】\n一天之内SAN损失到达当前SAN的1/5，符合总结性疯狂条件！\n' + insanityText);
                            } else {
                                insanityText = drawTemporaryInsanity(ctx, msg);
                                seal.replyToSender(ctx, msg, '\n【鲨鲨自动属性检定 — 临时疯狂】\n单次SAN损失≥5点，调查员陷入了临时疯狂！\n' + insanityText);
                            }
                        }
                    } else {
                        var noAttr = seal.ext.getStringConfig(ext, 'no_attr_int');
                        seal.replyToSender(ctx, msg, '【鲨鲨自动属性检定】' + noAttr);
                    }
                }
            }
        }

        if (text.indexOf('「体力」') !== -1 || text.indexOf('「生命值」') !== -1 ||
            text.indexOf('「HP」') !== -1 || text.indexOf('「hp」') !== -1) {
            var parsed = parseHPLoss(text);
            if (!parsed || parsed.loss <= 0) return;

            var settings = loadSettings(ext, ctx);
            if (!settings.autoCon) return;

            var conValue = getAttrValue(ctx, 'con');
            if (conValue === null || conValue <= 0) {
                var noAttrCon = seal.ext.getStringConfig(ext, 'no_attr_con');
                seal.replyToSender(ctx, msg, '【鲨鲨自动属性检定】' + noAttrCon);
                return;
            }

            var loss = parsed.loss;
            var oldHp = parsed.oldHp;
            var newHp = parsed.newHp;

            var hpMax = getAttrValue(ctx, 'hpmax');
            if (!hpMax || hpMax <= 0) hpMax = oldHp || 0;

            var triggeredDying = false;

            if (newHp !== null && newHp <= 0) {
                var raDying = buildRAText(ctx, '体质', conValue);
                var dyingKey = getConConfigKey('dying', raDying.success);
                var dyingText = pickTemplateText(ext, dyingKey);
                var outDying = raDying.fullText;
                if (dyingText) outDying += '\n' + dyingText;
                outDying += '\n💡 使用 .自动属性检定 体质 关闭 可禁用本功能~';
                seal.replyToSender(ctx, msg, outDying);
                triggeredDying = true;
            }

            if (hpMax > 0 && loss >= Math.floor(hpMax / 2)) {
                if (!triggeredDying) {
                    var raMajor = buildRAText(ctx, '体质', conValue);
                    var majorKey = getConConfigKey('major_wound', raMajor.success);
                    var majorText = pickTemplateText(ext, majorKey);
                    var outMajor = raMajor.fullText;
                    if (majorText) outMajor += '\n' + majorText;
                    outMajor += '\n💡 使用 .自动属性检定 体质 关闭 可禁用本功能~';
                    seal.replyToSender(ctx, msg, outMajor);
                } else {
                    seal.replyToSender(ctx, msg,
                        '【鲨鲨自动属性检定】同时触发重伤判定！一次损失 ≥ HPmax 的一半。');
                }
            }
        }
    } catch (e) {
        console.log('[COC7th自动属性检定] onMessageSend error: ' + e.message);
    } finally {
        _inOnMessageSend = false;
    }
};