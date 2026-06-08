"use strict";
// ==UserScript==
// @name         深海斗蛐蛐
// @author       一只鲨鱼鱼
// @version      2.5.3
// @description  状态栏Buff同步、强化战术扩展、AOE大招、海嗣进化、自定义战士
// @timestamp    1777075200
// @license      MIT
// @homepageURL  https://github.com/GuraQwQ/sealdice-shark-plugins
// @updateUrl    https://raw.githubusercontent.com/GuraQwQ/sealdice-shark-plugins/main/深海斗蛐蛐.js
// @sealVersion  1.4.5
// ==/UserScript==

function extractPureId(userId) {
    if (!userId) return '';
    const m = userId.match(/\d+/);
    return m ? m[0] : userId;
}

if (!seal.ext.find('deepsea_cricket')) {
    const ext = seal.ext.new('deepsea_cricket', '一只鲨鱼鱼', '2.5.3');
    seal.ext.register(ext);

    // ==================== 常量定义 ====================
    const botConfig = {
        attackResponses: ["呼噜噜～尝尝我的水花攻击！","鲨鲨冲撞！","这一下可有点疼了。","深海的泡泡之力！"],
        defenseResponses: ["海藻屏障！挡住啦～","才不会让你打中呢。","铜墙铁壁！","想破防？早得很呢。"],
        sleepResponses: ["呼……在珊瑚床上睡会儿……","咕噜咕噜……Zzzz","顺着洋流休息一下。"],
        victoryResponses: ["耶！鲨鲨最强！","深海霸主就是我～","轻轻松松拿下胜利。"],
        dodgeResponses: ["诶嘿，闪开了！运气不错。","你太慢了～","残像而已。"],
        randomComments: ["你的战士还差得远呢。","看我的亚特兰蒂斯冲击！","这波攻击不错，但还不够。","我的战士可是从深渊召来的！","胜负已分，早点游回家吧。","战斗才刚刚开始，我可不会手软。","这种程度的攻击，像被小虾米碰了一下。","是时候展现真正的深蓝之力了！","你的战士已经气喘吁吁了，咕噜噜……"],
        restEvents: ["珊瑚虫在身边轻轻蠕动。","一只小螃蟹爬过背甲。","远处传来悠远的鲸歌。","发光水母缓缓飘过。","海底温泉带来阵阵暖意。"],
        buffResponses: ["力量涌上来了！","感觉变得更强了～","深海之力与我同在！","细胞在沸腾！","进化完成！"]
    };

    // 17个
    const oceanWarriors = [
        { name:"深渊猎手·大白鲨", attr:{atk:40,def:20,spd:10,dodge:0.1,crit:0.3}, desc:"巨齿如刃，攻击蛮横但转身稍慢", emoji:"🦈" },
        { name:"破浪游侠·剑鱼",   attr:{atk:30,def:10,spd:40,dodge:0.4,crit:0.2}, desc:"如利剑穿梭，速度极快但鳞甲薄弱", emoji:"🐟" },
        { name:"坚壁巨盾·砗磲",   attr:{atk:20,def:50,spd:10,dodge:0.2,crit:0.1}, desc:"双壳如城壁，防御无双但反击较弱", emoji:"🐚" },
        { name:"碧波舞姬·海蛇",   attr:{atk:30,def:20,spd:20,dodge:0.5,crit:0.2}, desc:"身姿似烈焰摇摆，攻击均衡且极善闪躲", emoji:"🐍" },
        { name:"深渊巨口·鮟鱇",   attr:{atk:30,def:30,spd:20,dodge:0.3,crit:0.15}, desc:"头顶诱饵迷惑敌人，皮糙肉厚", emoji:"🐡" },
        { name:"珊瑚守护·海马",   attr:{atk:20,def:30,spd:30,dodge:0.4,crit:0.1},  desc:"善于借助珊瑚伪装，动作灵巧", emoji:"🐴" },
        { name:"漩涡之主·章鱼",   attr:{atk:40,def:10,spd:30,dodge:0.2,crit:0.25}, desc:"多条腕足同时出击，威力惊人", emoji:"🐙" },
        { name:"电闪雷鸣·电鳗",   attr:{atk:30,def:15,spd:40,dodge:0.3,crit:0.2},  desc:"释放电流麻痹对手，迅捷无比", emoji:"⚡" },
        { name:"极地霸主·虎鲸",   attr:{atk:45,def:25,spd:25,dodge:0.05,crit:0.2}, desc:"黑白分明，合群狩猎，威力与生命俱佳", emoji:"🐳" },
        { name:"深渊咏者·座头鲸", attr:{atk:15,def:40,spd:10,dodge:0.15,crit:0.05}, desc:"体型庞大，歌声低沉，防御力惊人", emoji:"🐋" },
        { name:"浮冰猎手·海豹",   attr:{atk:25,def:15,spd:35,dodge:0.35,crit:0.1},  desc:"圆滚滚的身体异常灵活，善于闪躲", emoji:"🦭" },
        { name:"幻光浮游·水母",   attr:{atk:20,def:10,spd:25,dodge:0.3,crit:0.15},  desc:"透明躯体带有剧毒，触手麻痹敌人", emoji:"🎐" },
        { name:"铁甲将军·螃蟹",   attr:{atk:25,def:35,spd:15,dodge:0.25,crit:0.15}, desc:"双螯如铁钳，甲壳坚硬，攻守兼备", emoji:"🦀" },
        { name:"旋涡歌姬·海螺",   attr:{atk:15,def:25,spd:20,dodge:0.2,crit:0.1},  desc:"螺壳共鸣发出迷幻音波，擅长音波攻击", emoji:"🐚" },
        { name:"赤甲狂战·龙虾",   attr:{atk:35,def:30,spd:25,dodge:0.15,crit:0.25}, desc:"赤红铠甲覆盖全身，双螯挥舞势大力沉", emoji:"🦞" },
        { name:"流光幻影·金龙鱼", attr:{atk:20,def:15,spd:45,dodge:0.45,crit:0.2},  desc:"金鳞闪烁如流光，身形鬼魅难以捕捉", emoji:"🐠" },
        { name:"深海异种·海嗣",   attr:{atk:28,def:22,spd:28,dodge:0.28,crit:0.18}, desc:"深海异变体，不断进化适应环境，大招触发率极高", emoji:"🧬" }
    ];

    const commonActions = [
        { name:"试探突击", power:0.9, descPool:["轻轻刺探对手的防御弱点","佯攻之后快速一啄","用鳍尖划开一道小口"], onHit:{type:"debuff",target:"dodge_def_down",desc:"试探成功！目标下次对你闪避/防御减半。"} },
        { name:"破甲撕咬", power:1.8, descPool:["瞄准薄弱处发动凶狠撕咬","巨齿狠狠嵌入鳞片","猛然一口咬住鳍条"], onHit:{type:"debuff",target:"def_down",val:0.7,desc:"破甲！目标防御力降低30%，持续1回合。"} },
        { name:"尾鳍重拍", power:1.4, descPool:["甩动尾巴猛烈拍打","尾巴掀起一股巨浪","尾鳍如同重锤砸下"], onHit:{type:"debuff",target:"spd_down",val:0.7,desc:"重击！目标速度降低30%，持续1回合。"} },
        { name:"角壳冲顶", power:1.1, descPool:["用坚硬的头部冲撞","犄角狠狠顶了过去","头壳撞向对手腹部"], onHit:{type:"debuff",target:"atk_down",val:0.8,desc:"冲击！目标攻击力降低20%，持续1回合。"} },
        { name:"涡流缠杀", power:1.6, descPool:["搅动涡流使对手失去平衡后追击","制造漩涡将敌人卷入","利用湍急水流绞杀"], onHit:{type:"debuff",target:"dodge_down",val:0.2,desc:"缠杀！目标闪避率降低20%，持续1回合。"} },
        { name:"闪袭游击", power:1.3, descPool:["高速游弋后突然折返攻击","绕着圈突然从侧面杀出","声东击西，一闪而至"], onHit:{type:"self",target:"dodge_up",val:0.2,desc:"游刃有余！自身闪避率提升20%，持续1回合。"} },
        { name:"深潜奇袭", power:1.7, descPool:["下潜至暗处再猛然上冲","从下方阴影中飞速冲出","消失片刻后从背后现身"], onHit:{type:"self",target:"crit_up",val:0.2,desc:"奇袭得手！自身暴击率提升20%，持续1回合。"} },
        { name:"积势怒涛", power:2.0, descPool:["积蓄洋流之力发出全力一击","汇聚整片海流的力量","怒涛般的一击奔涌而去"], onHit:{type:"debuff",target:"atk_chance_down",desc:"怒涛震慑！目标下回合攻击概率降低。"} },
        { name:"毒刺注射", power:1.5, descPool:["将毒素注入对手体内","尾刺扎入并释放毒液","皮肤刺破，毒素渗入"], onHit:{type:"poison",damage:10,duration:2,desc:"中毒！目标每回合损失10点生命，持续2回合。"} },
        { name:"水流喷射", power:1.2, descPool:["高速水流冲击，击退敌人","从口中喷出强力水柱","水炮正中目标"], onHit:{type:"debuff",target:"skip_attack",desc:"击退！目标下回合无法攻击，只能防御或休息。"} },
        { name:"重壳碾压", power:1.7, descPool:["利用坚硬的甲壳碾碎对手","整个身体压了上去","壳甲如山般压下"], onHit:{type:"damage",extra:10,desc:"碾压！额外造成10点固定伤害。"} },
        { name:"幻影突刺", power:1.4, descPool:["制造水流幻影，快速突刺","晃出几个虚影后真身刺出","眼花缭乱的幻象中一击"], onHit:{type:"self",target:"dodge_up",val:0.15,desc:"幻影掩护！自身闪避率提升15%，持续1回合。"} }
    ];

    // 防御动作（7个）
    const defendActions = [
        { name:"铁壁守护", desc:"撑起坚不可摧的防御", effect:{type:"def_up",val:0.3,desc:"防御力+30%"} },
        { name:"流线回避", desc:"身体化作流线型，大幅提高闪避", effect:{type:"dodge_up",val:0.25,desc:"闪避率+25%"} },
        { name:"自愈甲壳", desc:"调动能量修复伤口，同时硬化皮肤", effect:{type:"heal_armor",heal:15,def_up:0.15,desc:"恢复15HP，防御+15%"} },
        { name:"威慑咆哮", desc:"发出恐怖的声波，降低对手攻击欲望", effect:{type:"atk_chance_down",desc:"随机一名敌人下回合攻击概率降低"} },
        { name:"蓄力待发", desc:"收缩肌肉积蓄力量，下回合攻击更猛", effect:{type:"atk_up",val:0.25,desc:"攻击力+25%（下回合）"} },
        { name:"龟息术", desc:"进入假死状态，大幅恢复生命", effect:{type:"deep_rest",heal:20,desc:"恢复20点生命"} },
        { name:"反击姿态", desc:"以守为攻，下回合受击时反击，并获得15%防御加成", effect:{type:"counter",def_up:0.15,desc:"进入反击姿态，防御+15%，受击反击"} }
    ];

    // 强化动作（12个）
    const buffActions = [
        { name:"深海觉醒", desc:"唤醒远古血脉，永久提升攻击与速度", effect:{type:"perm_growth",atk:5,spd:3,desc:"永久攻击+5，速度+3"} },
        { name:"皮肤硬化", desc:"表皮角质层急剧增厚，永久提升防御", effect:{type:"perm_growth",def:8,desc:"永久防御+8"} },
        { name:"嗜血狂化", desc:"燃烧生命换取力量，损失10HP，攻击+50%持续2回合", effect:{type:"berserk",hpCost:10,atkMult:1.5,duration:2,desc:"攻击+50%（2回合），自损10HP"} },
        { name:"洋流祝福", desc:"接受洋流洗礼，恢复20HP并获得20%闪避（2回合）", effect:{type:"bless",heal:20,dodgeUp:0.2,duration:2,desc:"恢复20HP，闪避+20%（2回合）"} },
        { name:"深渊凝视", desc:"凝视深渊获得暴击之力，暴击率+30%（2回合）", effect:{type:"crit_focus",critUp:0.3,duration:2,desc:"暴击率+30%（2回合）"} },
        { name:"再生腺体", desc:"激活再生能力，下2回合每回合恢复15HP", effect:{type:"regen_over",heal:15,duration:2,desc:"每回合恢复15HP（2回合）"} },
        { name:"战意燃烧", desc:"斗志昂扬，下回合必定先手且伤害+30%", effect:{type:"initiative",damageUp:0.3,duration:1,desc:"下回合先手，伤害+30%"} },
        { name:"锐眼觉醒", desc:"双眼泛起红光，永久提升暴击率", effect:{type:"perm_crit",val:0.05,desc:"永久暴击率+5%"} },
        { name:"狂怒之血", desc:"血液沸腾，永久提升暴击伤害", effect:{type:"perm_crit_mult",val:0.15,desc:"永久暴击伤害+15%"} },
        { name:"幻影之鳞", desc:"鳞片变得透明虚幻，永久提升闪避", effect:{type:"perm_dodge",val:0.03,desc:"永久闪避率+3%"} },
        { name:"觉醒预兆", desc:"感知到深渊的召唤，下3回合大招触发率提升", effect:{type:"ult_chance_up",val:0.08,duration:3,desc:"大招概率+8%（3回合）"} },
        { name:"基因突变", desc:"细胞发生不可控的良性突变，获得一个新天赋", effect:{type:"evolve_talent",desc:"获得一个新天赋"} }
    ];

    const ultimateBaseChance = 0.08;
    const ultimateActionMap = {
        "深渊猎手·大白鲨":{ name:"鲜血狂宴", power:2.5, descPool:["被血腥刺激，疯狂撕咬","陷入嗜血狂热，连续猛攻","血色弥漫，巨齿如绞肉机"], special:{type:"lifesteal",val:0.4,desc:"吸取造成伤害40%的生命"} },
        "破浪游侠·剑鱼":{ name:"破空一闪", power:2.8, descPool:["以超音速直线贯穿对手","化作一道银色闪电","空气被劈开，剑尖已至"], special:{type:"bypass_dodge",desc:"绝对命中"} },
        "坚壁巨盾·砗磲":{ name:"巨壳崩山", power:2.0, descPool:["用沉重的贝壳猛烈撞击并产生震荡波","巨壳如山峰倒塌","贝壳轰然闭合，冲击波四散"], special:{type:"slow",val:0.5,desc:"目标速度减半（2回合）"} },
        "碧波舞姬·海蛇":{ name:"冥府绞杀", power:2.4, descPool:["用柔软身体死死缠绕，令对手窒息","如同巨蟒般收紧了身体","缠绕越来越紧，无法呼吸"], special:{type:"atk_down",val:0.6,desc:"目标攻击力降低40%（2回合）"} },
        "深渊巨口·鮟鱇":{ name:"深渊眩光", power:2.2, descPool:["头顶的发光器爆发出刺目闪光","强光瞬间照亮整片海域","光芒之强烈仿佛直视太阳"], special:{type:"dodge_down",val:0.4,desc:"目标闪避率降低40%（2回合）"} },
        "珊瑚守护·海马":{ name:"珊瑚替身", power:1.5, descPool:["珊瑚瞬间生长为替身承受伤害","本体隐入珊瑚礁中","幻象破碎，真身无恙"], special:{type:"self_heal",heal:30,desc:"恢复30点生命"}, onHit:{type:"self",target:"dodge_up",val:0.5,desc:"替身术！下回合闪避率+50%"} },
        "漩涡之主·章鱼":{ name:"深渊墨潮", power:1.8, descPool:["喷出浓墨并掀起漩涡，自己则隐匿其中","漆黑墨汁染黑了海水","墨潮中已不见章鱼身影"], special:{type:"self_dodge_up",val:0.5,duration:2,desc:"自身闪避+50%（2回合）"} },
        "电闪雷鸣·电鳗":{ name:"雷神之怒", power:2.3, descPool:["释放超高压电流，贯穿一切防御","雷电如巨龙般轰击而出","噼里啪啦的电弧布满战场"], special:{type:"ignore_def",desc:"无视防御"} },
        "极地霸主·虎鲸":{ name:"冰海漩涡", power:2.6, descPool:["掀起冰冷漩涡将猎物卷入","极地寒气冻结鳍肢","黑白身影旋转出死亡之舞"], special:{type:"slow",val:0.5,desc:"目标速度减半（2回合）"} },
        "深渊咏者·座头鲸":{ name:"灭世鲸歌", power:1.8, descPool:["发出毁灭性的低频声波","鲸歌震碎所有敌人的内脏","音波如实质般轰击全场"], special:{type:"aoe",def_down:0.7,spd_down:0.8,duration:2,desc:"全体敌人防御降低30%，速度降低20%（2回合）"}, onHit:{type:"aoe_damage",extra:12,desc:"音波轰击全体！额外造成12点伤害"} },
        "浮冰猎手·海豹":{ name:"极光滑稽戏", power:2.2, descPool:["在冰面快速滑行绕晕对手","像球一样弹射攻击","用胡须拍打，侮辱性极强"], special:{type:"dodge_down",val:0.35,desc:"目标闪避降低35%（2回合）"} },
        "幻光浮游·水母":{ name:"致死霓虹", power:2.0, descPool:["释放绚烂却剧毒的光丝","触手如同闪电般缠住猎物","荧光毒素瞬间注入"], special:{type:"poison",damage:20,duration:3,desc:"剧毒：每回合20点伤害，持续3回合"} },
        "铁甲将军·螃蟹":{ name:"铁壁崩碎", power:2.2, descPool:["巨螯夹碎礁石后猛击敌人","甲壳闭合后全力弹射","铁壁如山，崩碎万物"], special:{type:"self_def_up",val:0.5,duration:2,desc:"自身防御+50%（2回合）"}, onHit:{type:"damage",extra:15,desc:"崩碎！额外造成15点固定伤害"} },
        "旋涡歌姬·海螺":{ name:"魔音贯耳", power:2.0, descPool:["螺壳发出刺耳的毁灭音波","音波穿透耳膜直抵大脑","海潮之声化为死亡旋律"], special:{type:"atk_down",val:0.5,desc:"目标攻击降低50%（1回合）"}, onHit:{type:"debuff",target:"dodge_down",val:0.3,desc:"混乱！目标闪避降低30%（1回合）"} },
        "赤甲狂战·龙虾":{ name:"赤红狂潮", power:2.4, descPool:["赤甲燃烧如熔岩","双螯挥舞掀起血浪","狂战士的怒吼震撼海底"], special:{type:"perm_growth",atk:5,desc:"永久攻击+5"} },
        "流光幻影·金龙鱼":{ name:"金龙破晓", power:2.5, descPool:["金鳞化作破晓之光贯穿敌人","身形如龙穿梭于光影之间","黎明前的最后一击"], special:{type:"bypass_dodge",desc:"绝对命中", perm_growth:{atk:3,spd:3}}, onHit:{type:"self",target:"perm_growth",atk:3,spd:3,desc:"金龙觉醒！永久攻击+3，速度+3"} },
        "深海异种·海嗣":{ name:"基因飞升", power:1.5, descPool:["细胞急速分裂再生","基因序列重组优化","异变触手缠绕汲取"], special:{type:"self_heal",heal:25,desc:"恢复25点生命"}, onHit:{type:"evolve_talent",desc:"基因飞升！进化出一个新天赋"} }
    };

    const battleScenes = [
        { name:"浅海珊瑚礁", desc:"阳光透过海面洒落，美丽的珊瑚礁中暗藏杀机。", effects:[{type:"attr_mult",attr:"spd",val:0.7}] },
        { name:"无尽深渊", desc:"四周漆黑一片，只有发光生物偶尔游过，防御变得脆弱。", effects:[{type:"attr_mult",attr:"def",val:0.8}] },
        { name:"暖流通道", desc:"温暖的海流带来充沛的生命力。", effects:[{type:"heal_plus",val:30}] },
        { name:"亚特兰蒂斯遗迹", desc:"古老的石柱间，能量波动异常活跃。", effects:[{type:"crit_add",val:0.15}] },
        { name:"冰封海峡", desc:"刺骨的海水让动作迟缓，攻击也软弱了几分。", effects:[{type:"attr_mult",attr:"spd",val:0.85},{type:"attr_mult",attr:"atk",val:0.9}] },
        { name:"海底火山", desc:"炽热的岩浆喷涌，全体战士变得暴躁，但每回合都会受到灼烧。", effects:[{type:"attr_mult",attr:"atk",val:1.15},{type:"burn",val:10}] },
        { name:"古代沉船", desc:"腐朽的船体间，闪避变得容易。", effects:[{type:"dodge_add",val:0.15}] },
        { name:"珍珠祭坛", desc:"祭坛的祝福增强了战士的生命上限。", effects:[{type:"maxhp_up",val:20}] },
        { name:"极光海域", desc:"绚丽的极光下，暴击伤害提升。", effects:[{type:"crit_mult",val:2.0}] },
        { name:"沉没都市", desc:"废墟中的能量让防御和攻击此消彼长。", effects:[{type:"attr_mult",attr:"def",val:1.2},{type:"attr_mult",attr:"atk",val:0.85}] },
        { name:"深海热液喷口", desc:"喷涌的矿物质刺激再生。", effects:[{type:"regen",val:15}] },
        { name:"巨型海藻林", desc:"茂密的海藻让偷袭更容易，速度提升。", effects:[{type:"attr_mult",attr:"spd",val:1.2},{type:"dodge_add",val:0.05}] },
        { name:"沉船金库", desc:"遍地金币反射刺目光芒，暴击率异常活跃。", effects:[{type:"crit_add",val:0.2},{type:"attr_mult",attr:"def",val:0.9}] },
        { name:"海底墓园", desc:"亡者的低语让战士心悸，但死亡带来新生。", effects:[{type:"regen",val:10},{type:"attr_mult",attr:"atk",val:1.1}] },
        { name:"蓝洞深处", desc:"深不见底的蓝洞吞噬光线，闪避与速度此消彼长。", effects:[{type:"dodge_add",val:0.2},{type:"attr_mult",attr:"spd",val:0.8}] },
        { name:"海底雷暴", desc:"电离的海水让所有人攻击附带麻痹，但自身也会受电击。", effects:[{type:"attr_mult",attr:"atk",val:1.1},{type:"shock",val:5}] }
    ];

    const talents = [
        { id:"trident", name:"三叉戟碎片", desc:"攻击力提升20%", effects:[{type:"attr_mult",attr:"atk",val:1.2}] },
        { id:"tough_skin", name:"坚硬皮肤", desc:"防御力提升20%", effects:[{type:"attr_mult",attr:"def",val:1.2}] },
        { id:"life_potion", name:"生命药水", desc:"休息时额外恢复30点生命", effects:[{type:"heal_plus",val:30}] },
        { id:"giant", name:"巨型体型", desc:"初始生命上限+50", effects:[{type:"maxhp_up",val:50}] },
        { id:"hunter", name:"猎手血脉", desc:"攻击倾向提高15%", effects:[{type:"atk_chance",val:0.15}] },
        { id:"guardian", name:"守护壁垒", desc:"防御倾向提高15%", effects:[{type:"def_chance",val:0.15}] },
        { id:"crit_master", name:"致命一击", desc:"暴击率提升20%", effects:[{type:"crit_add",val:0.2}] },
        { id:"dodge_dance", name:"闪避舞步", desc:"闪避率提升20%", effects:[{type:"dodge_add",val:0.2}] },
        { id:"berserker", name:"狂战士血", desc:"攻击+35%，防御-20%，暴击+10%", effects:[{type:"attr_mult",attr:"atk",val:1.35},{type:"attr_mult",attr:"def",val:0.8},{type:"crit_add",val:0.1}] },
        { id:"regenerator", name:"再生因子", desc:"每回合恢复8点生命，生命低于50%时额外恢复5点", effects:[{type:"regen",val:8},{type:"regen_lowhp",val:5,threshold:0.5}] },
        { id:"tidal_force", name:"潮汐之力", desc:"速度提升30%", effects:[{type:"attr_mult",attr:"spd",val:1.3}] },
        { id:"behemoth_rage", name:"巨兽之怒", desc:"暴击伤害倍率变为2.0", effects:[{type:"crit_mult",val:2.0}] },
        { id:"coral_armor", name:"珊瑚装甲", desc:"受到暴击时伤害减半", effects:[{type:"crit_reduction",val:0.5}] },
        { id:"electric_shock", name:"电击反伤", desc:"受到攻击时，反弹攻击者攻击力20%的伤害", effects:[{type:"reflect",val:0.2}] },
        { id:"deep_blood", name:"深蓝之血", desc:"生命上限+30，且每回合恢复3点生命", effects:[{type:"maxhp_up",val:30},{type:"regen",val:3}] },
        { id:"vortex_eye", name:"漩涡之眼", desc:"大招触发几率翻倍", effects:[{type:"ult_chance_mult",val:2}] },
        { id:"deep_low", name:"深海低语", desc:"攻击命中时有30%几率使目标下回合防御降低20%", effects:[{type:"onhit_debuff",chance:0.3,debuff:{type:"def_down",val:0.8}}] },
        { id:"storm_eye", name:"风暴前夕", desc:"生命低于一半时，下次攻击必暴击", effects:[{type:"halfhp_guaranteed_crit"}] },
        { id:"symbiotic_algae", name:"共生藻", desc:"休息回复量+20，且额外恢复5%最大生命", effects:[{type:"heal_plus",val:20},{type:"rest_percent",val:0.05}] },
        { id:"leviathan_scale", name:"利维坦之鳞", desc:"受到的所有伤害降低10%", effects:[{type:"damage_reduction",val:0.1}] },
        { id:"abyssal_venom", name:"深渊毒刺", desc:"攻击命中时有20%几率使目标中毒，每回合损失12点生命，持续2回合", effects:[{type:"poison_onhit",chance:0.2,damage:12,duration:2}] },
        { id:"ghost_swim", name:"幽灵游弋", desc:"成功闪避后，下回合攻击无视目标闪避", effects:[{type:"dodge_empower"}] },
        { id:"vengeful_surge", name:"复仇怒涛", desc:"受到伤害后，下回合造成的伤害提升25%", effects:[{type:"hit_empower",val:0.25}] },
        { id:"abyssal_bulwark", name:"海渊壁垒", desc:"单次受到伤害超过40时，减少15点伤害", effects:[{type:"damage_threshold",threshold:40,reduce:15}] },
        { id:"final_lament", name:"终焉悲鸣", desc:"死亡时对击杀者造成已损失生命值20%的伤害", effects:[{type:"on_death_damage",val:0.2}] },
        { id:"sanguine_coral", name:"嗜血珊瑚", desc:"暴击时恢复造成伤害20%的生命", effects:[{type:"crit_lifesteal",val:0.2}] },
        { id:"abyssal_predator", name:"深渊猎食者", desc:"攻击生命低于40%的目标时，伤害提升30%", effects:[{type:"lowhp_damage",val:0.3,threshold:0.4}] },
        { id:"tidal_resonance", name:"潮汐共鸣", desc:"休息时的恢复量提升50%", effects:[{type:"rest_amp",val:1.5}] },
        { id:"frost_touch", name:"冰冻之触", desc:"攻击命中时有20%几率使目标速度降低30%", effects:[{type:"onhit_debuff",chance:0.2,debuff:{type:"spd_down",val:0.7}}] },
        { id:"echo_location", name:"声波定位", desc:"暴击率+10%，且攻击无视目标10%闪避", effects:[{type:"crit_add",val:0.1},{type:"ignore_dodge",val:0.1}] },
        { id:"deep_fog", name:"深海迷雾", desc:"每3回合自动获得1回合的闪避+30%效果", effects:[{type:"fog_proc",val:0.3}] },
        { id:"plankton_feast", name:"浮游盛宴", desc:"击杀目标后恢复30点生命", effects:[{type:"kill_heal",val:30}] },
        { id:"pressure_armor", name:"高压装甲", desc:"生命高于80%时，额外减伤15%", effects:[{type:"highhp_reduction",val:0.15}] },
        { id:"sonar_pulse", name:"声呐脉冲", desc:"防御姿态结束时，对随机一名敌人造成15点伤害", effects:[{type:"defend_damage",val:15}] },
        { id:"tidal_echo", name:"潮汐回响", desc:"休息时额外回复总生命的8%", effects:[{type:"rest_percent",val:0.08}] },
        { id:"abyssal_rage", name:"深渊狂怒", desc:"生命每降低20%，攻击力提升8%", effects:[{type:"lowhp_atk_scale"}] },
        { id:"jelly_paralysis", name:"水母麻痹", desc:"攻击命中时有15%几率使目标无法行动1回合", effects:[{type:"stun_onhit",chance:0.15}] },
        { id:"iron_will", name:"钢铁意志", desc:"受到控制效果（跳过回合/降攻等）时，50%几率免疫", effects:[{type:"control_immunity",chance:0.5}] },
        { id:"blood_rage", name:"血怒", desc:"生命值首次低于30%时，永久攻击+10，速度+5", effects:[{type:"threshold_growth",threshold:0.3,atk:10,spd:5}] },
        { id:"toxic_blood", name:"毒血", desc:"受到近战攻击时，30%几率使攻击者中毒（8点/2回合）", effects:[{type:"toxic_blood",chance:0.3,damage:8,duration:2}] },
        { id:"fortress", name:"移动堡垒", desc:"防御姿态时额外恢复10点生命", effects:[{type:"defend_heal",val:10}] },
        { id:"swift_strike", name:"迅捷打击", desc:"速度高于目标时，伤害额外提升15%", effects:[{type:"spd_damage_amp",val:0.15}] },
        { id:"second_wind", name:"第二 wind", desc:"生命值首次低于20%时，立即恢复25点生命（每场战斗1次）", effects:[{type:"second_wind",heal:25,threshold:0.2}] },
        { id:"predator_sense", name:"猎食感知", desc:"对生命值低于30%的目标，暴击率额外+20%", effects:[{type:"lowhp_crit",val:0.2,threshold:0.3}] },
        { id:"adaptive_shell", name:"适者生存", desc:"每受到3次攻击，永久防御+2", effects:[{type:"adaptive_def",count:3,val:2}] },
        { id:"overwhelming", name:"压制气场", desc:"攻击时有20%几率使目标下回合无法强化", effects:[{type:"block_buff",chance:0.2}] },
        { id:"eternal_tide", name:"永恒潮汐", desc:"每4回合恢复15点生命，并清除一个负面效果", effects:[{type:"cleanse_regen",heal:15,interval:4}] }
    ];

    const baseActionWeights = { attack:45, defend:20, buff:20, rest:15 };

    // ==================== 工具函数 ====================
    const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
    const safeRandPick = (arr) => {
        if(!Array.isArray(arr) || arr.length===0) return '';
        return arr[rand(0, arr.length-1)];
    };
    const shuffle = (arr) => {
        const a = arr.slice();
        for(let i=a.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [a[i],a[j]] = [a[j],a[i]];
        }
        return a;
    };
    const assignTalents = (count) => {
        const shuffled = shuffle(talents);
        return shuffled.slice(0, Math.min(count, talents.length)).map(t=>({
            ...t,
            effects: t.effects.map(e=>({...e}))
        }));
    };
    const hasEffect = (player,type) => player?.talents?.some(t=>t.effects.some(e=>e.type===type));

    const getFinalAttr = (player,attr,scene) => {
        let val = player.cricket.baseAttr[attr];
        if(player.talents) player.talents.forEach(t=>t.effects.forEach(e=>{
            if(e.type==='attr_mult'&&e.attr===attr) val*=e.val;
        }));
        if(scene?.effects) scene.effects.forEach(e=>{
            if(e.type==='attr_mult'&&e.attr===attr) val*=e.val;
        });
        const temp = player.cricket.tempEffects || {};
        if(temp[`${attr}_mult`]) val *= temp[`${attr}_mult`];
        if(attr==='dodge'){
            if(temp['dodge_down']) val -= temp['dodge_down'];
            if(temp['dodge_up']) val += temp['dodge_up'];
        }
        if(temp['dodge_def_down'] && attr==='def') val = Math.floor(val * 0.5);
        val = Math.round(val);
        if(attr==='spd') val = Math.max(1,val);
        if(attr==='def'||attr==='atk') val = Math.max(0,val);
        if(attr==='dodge') val = Math.max(0, Math.min(0.9, val));
        return val;
    };

    const getCritChance = (player,scene) => {
        let crit = player.cricket.baseAttr.crit;
        player.talents?.forEach(t=>t.effects.forEach(e=>{if(e.type==='crit_add') crit+=e.val;}));
        scene?.effects?.forEach(e=>{if(e.type==='crit_add') crit+=e.val;});
        return Math.min(0.95, Math.max(0,crit));
    };

    const getDodgeChance = (defender,isSleeping,scene,attacker) => {
        let dodge = getFinalAttr(defender,'dodge',scene);
        if(isSleeping) dodge *= 0.3;
        if(attacker && hasEffect(attacker,'ignore_dodge')){
            let ignore = 0;
            attacker.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='ignore_dodge') ignore+=e.val;}));
            dodge = Math.max(0, dodge - ignore);
        }
        return Math.min(0.9, Math.max(0,dodge));
    };

    const getUltimateChance = (player) => {
        let chance = ultimateBaseChance;
        // 海嗣大招率+5%
        if(player.cricket.type === "深海异种·海嗣") chance += 0.05;
        if(player.talents) player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='ult_chance_mult') chance*=e.val;}));
        // 临时大招概率提升
        if(player.cricket.tempEffects?.ult_chance_up) chance += player.cricket.tempEffects.ult_chance_up;
        return Math.min(0.8, Math.max(0,chance));
    };

    const getHealBonus = (player, scene) => {
        let bonus = 0;
        player.talents?.forEach(t=>t.effects.forEach(e=>{
            if(e.type==='heal_plus') bonus += e.val;
        }));
        scene?.effects?.forEach(e=>{if(e.type==='heal_plus') bonus += e.val;});
        return bonus;
    };

    const checkControlImmunity = (player) => {
        if(!hasEffect(player,'control_immunity')) return false;
        let chance = 0;
        player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='control_immunity') chance=e.chance;}));
        return Math.random() < chance;
    };

    const calculateDamage = (attacker,defender,action,scene) => {
        const atk = getFinalAttr(attacker,'atk',scene);
        const def = getFinalAttr(defender,'def',scene);
        const spd = getFinalAttr(attacker,'spd',scene);
        let baseDamage = Math.round((atk + spd*0.5) * action.power);
        if(action.special?.type !== 'ignore_def') baseDamage = Math.max(1, baseDamage - def);
        let damage = baseDamage;

        if(hasEffect(defender,'damage_reduction')){
            let red = 0.1;
            defender.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='damage_reduction') red=e.val;}));
            damage = Math.floor(damage * (1-red));
        }
        if(hasEffect(defender,'damage_threshold')){
            defender.talents.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='damage_threshold'&&damage>e.threshold) damage-=e.reduce;
            }));
            damage = Math.max(1,damage);
        }
        if(hasEffect(defender,'highhp_reduction') && defender.cricket.hp > defender.cricket.maxHp*0.8){
            let red = 0.15;
            defender.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='highhp_reduction') red=e.val;}));
            damage = Math.floor(damage * (1-red));
        }

        let guaranteedCrit = hasEffect(attacker,'halfhp_guaranteed_crit') && attacker.cricket.hp <= attacker.cricket.maxHp*0.5;
        let critChance = getCritChance(attacker,scene);
        if(attacker.cricket.tempEffects?.crit_up) critChance += attacker.cricket.tempEffects.crit_up;
        if(hasEffect(attacker,'lowhp_crit') && defender.cricket.hp <= defender.cricket.maxHp*0.3){
            let add = 0.2; attacker.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='lowhp_crit') add=e.val;}));
            critChance += add;
        }
        let isCrit = guaranteedCrit || Math.random() < critChance + (action.special?.type==='crit_boost'?action.special.val:0);

        if(isCrit){
            let critMult = 1.5 + (attacker.cricket.baseAttr.critMult || 0);
            let talentCritMult = 0;
            attacker.talents?.forEach(t=>t.effects.forEach(e=>{if(e.type==='crit_mult') talentCritMult=Math.max(talentCritMult,e.val);}));
            if(talentCritMult > 0) critMult = talentCritMult + (attacker.cricket.baseAttr.critMult || 0);
            if(scene?.effects) scene.effects.forEach(e=>{
                if(e.type==='crit_mult') critMult = e.val + (attacker.cricket.baseAttr.critMult || 0);
            });
            damage = Math.round(damage * critMult);
            if(hasEffect(defender,'crit_reduction')){
                let red = 0.5;
                defender.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='crit_reduction') red=e.val;}));
                damage = Math.floor(damage * red);
            }
        }

        let isDodged = false;
        if(!action.special || action.special.type!=='bypass_dodge'){
            if(!attacker.cricket.tempEffects?.bypass_dodge){
                const dodgeChance = getDodgeChance(defender, defender.cricket.isSleeping, scene, attacker);
                if(Math.random() < dodgeChance) isDodged = true;
            }
        }
        if(isDodged) damage = 0;

        if(damage>0 && hasEffect(attacker,'spd_damage_amp')){
            const mySpd = getFinalAttr(attacker,'spd',scene);
            const enemySpd = getFinalAttr(defender,'spd',scene);
            if(mySpd > enemySpd){
                let amp = 0.15; attacker.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='spd_damage_amp') amp=e.val;}));
                damage = Math.round(damage * (1+amp));
            }
        }

        if(attacker.cricket.tempEffects?.atk_empower) damage = Math.round(damage * (1+attacker.cricket.tempEffects.atk_empower));
        if(attacker.cricket.tempEffects?.damage_up) damage = Math.round(damage * (1+attacker.cricket.tempEffects.damage_up));

        if(hasEffect(attacker,'lowhp_damage') && defender.cricket.hp <= defender.cricket.maxHp*0.4){
            let amp = 0.3;
            attacker.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='lowhp_damage') amp=e.val;}));
            damage = Math.round(damage * (1+amp));
        }
        if(hasEffect(attacker,'lowhp_atk_scale')){
            const lostRatio = 1 - attacker.cricket.hp/attacker.cricket.maxHp;
            const bonus = Math.floor(lostRatio * 0.4 * damage);
            damage += bonus;
        }
        return {damage, isCrit, isDodged, action};
    };

    const applyCombatEffects = (attacker,target,action,damage,isCrit) => {
        const effs = [];
        if(action.special){
            const sp = action.special;
            if(sp.type==='lifesteal'&&damage>0){ const heal=Math.floor(damage*(sp.val||0.3)); attacker.cricket.hp=Math.min(attacker.cricket.maxHp,attacker.cricket.hp+heal); effs.push(`💚吸血${heal}点`); }
            if(sp.type==='slow'){ target.cricket.tempEffects['spd_mult']=sp.val; effs.push('🐢减速'); }
            if(sp.type==='atk_down'){ target.cricket.tempEffects['atk_mult']=sp.val; effs.push('🔻降攻'); }
            if(sp.type==='dodge_down'){ target.cricket.tempEffects['dodge_down']=sp.val; effs.push('👁️降闪避'); }
            if(sp.type==='self_dodge_up'){ attacker.cricket.tempEffects['dodge_up']=sp.val; if(sp.duration) attacker.cricket.tempEffects['dodge_up_dur']=sp.duration; effs.push('💨自身闪避↑'); }
            if(sp.type==='bypass_dodge') effs.push('🎯绝对命中');
            if(sp.type==='crit_boost') effs.push('✨暴击率↑');
            if(sp.type==='ignore_def') effs.push('⚡无视防御');
            if(sp.type==='def_down'){ target.cricket.tempEffects['def_mult']=sp.val; effs.push('🔻降防'); }
            if(sp.type==='poison'){ if(!target.cricket.dots) target.cricket.dots=[]; target.cricket.dots.push({damage:sp.damage,duration:sp.duration}); effs.push('🦠剧毒'); }
            if(sp.type==='self_heal'){ attacker.cricket.hp=Math.min(attacker.cricket.maxHp,attacker.cricket.hp+sp.heal); effs.push(`💚恢复${sp.heal}点生命`); }
            if(sp.type==='self_def_up'){
                attacker.cricket.tempEffects['def_mult'] = (attacker.cricket.tempEffects['def_mult']||1) * (1+sp.val);
                if(sp.duration) attacker.cricket.tempEffects['def_mult_dur'] = sp.duration;
                effs.push(`🛡️自身防御+${Math.round(sp.val*100)}%`);
            }
            if(sp.type==='perm_growth' || sp.perm_growth){
                const pg = sp.perm_growth || sp;
                attacker.cricket.baseAttr.atk += (pg.atk||0);
                attacker.cricket.baseAttr.def += (pg.def||0);
                attacker.cricket.baseAttr.spd += (pg.spd||0);
                effs.push(`📈永久攻击+${pg.atk||0}，防御+${pg.def||0}，速度+${pg.spd||0}`);
            }
        }
        if(action.onHit && damage>0){
            const hit = action.onHit;
            if(hit.type==='debuff'){
                if(hit.target==='dodge_def_down'){ target.cricket.tempEffects['dodge_def_down']=true; effs.push(hit.desc); }
                else if(hit.target==='def_down'){ target.cricket.tempEffects['def_mult']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='spd_down'){ target.cricket.tempEffects['spd_mult']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='atk_down'){ target.cricket.tempEffects['atk_mult']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='dodge_down'){ target.cricket.tempEffects['dodge_down']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='atk_chance_down'){ target.cricket.tempEffects['atk_chance_down']=true; effs.push(hit.desc); }
                else if(hit.target==='skip_attack'){ target.cricket.tempEffects['skip_attack']=true; effs.push(hit.desc); }
            }else if(hit.type==='self'){
                if(hit.target==='dodge_up'){ attacker.cricket.tempEffects['dodge_up']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='crit_up'){ attacker.cricket.tempEffects['crit_up']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='heal'){ attacker.cricket.hp=Math.min(attacker.cricket.maxHp,attacker.cricket.hp+hit.val); effs.push(hit.desc); }
                else if(hit.target==='rest_amp'){ attacker.cricket.tempEffects['rest_amp']=hit.val; effs.push(hit.desc); }
                else if(hit.target==='perm_spd'){ attacker.cricket.baseAttr.spd += hit.val; effs.push(hit.desc); }
                else if(hit.target==='perm_growth'){
                    attacker.cricket.baseAttr.atk += (hit.atk||0);
                    attacker.cricket.baseAttr.def += (hit.def||0);
                    attacker.cricket.baseAttr.spd += (hit.spd||0);
                    effs.push(hit.desc);
                }
            }else if(hit.type==='poison'){ if(!target.cricket.dots) target.cricket.dots=[]; target.cricket.dots.push({damage:hit.damage,duration:hit.duration}); effs.push(hit.desc); }
            else if(hit.type==='damage'){ target.cricket.hp=Math.max(0,target.cricket.hp-hit.extra); effs.push(hit.desc); }
            else if(hit.type==='evolve_talent'){
                const newTalents = assignTalents(1);
                if(newTalents.length > 0){
                    const nt = newTalents[0];
                    attacker.talents.push(nt);
                    nt.effects.forEach(e=>{
                        if(e.type==='maxhp_up'){
                            attacker.cricket.maxHp += e.val;
                            attacker.cricket.hp += e.val;
                        }
                    });
                    effs.push(`🧬${hit.desc}：【${nt.name}】${nt.desc}`);
                }
            }
        }

        if(damage>0 && hasEffect(attacker,'poison_onhit')){
            attacker.talents.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='poison_onhit' && Math.random()<e.chance){
                    if(!target.cricket.dots) target.cricket.dots=[];
                    target.cricket.dots.push({damage:e.damage,duration:e.duration});
                    effs.push(`🦠深渊毒刺：中毒${e.damage}点x${e.duration}回合`);
                }
            }));
        }
        if(damage>0 && hasEffect(attacker,'onhit_debuff')){
            attacker.talents.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='onhit_debuff' && Math.random()<e.chance){
                    if(e.debuff.type==='spd_down'){ target.cricket.tempEffects['spd_mult']=e.debuff.val; effs.push('❄️冰冻减速'); }
                    else if(e.debuff.type==='def_down'){ target.cricket.tempEffects['def_mult']=e.debuff.val; effs.push('🔻深海低语降防'); }
                }
            }));
        }
        if(damage>0 && hasEffect(attacker,'stun_onhit')){
            attacker.talents.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='stun_onhit' && Math.random()<e.chance){
                    target.cricket.tempEffects['skip_attack'] = true;
                    effs.push('⚡麻痹！无法行动');
                }
            }));
        }
        if(damage>0 && hasEffect(attacker,'block_buff')){
            attacker.talents.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='block_buff' && Math.random()<e.chance){
                    target.cricket.tempEffects['block_buff'] = true;
                    effs.push('🚫压制！目标下回合无法强化');
                }
            }));
        }

        if(isCrit && damage>0 && hasEffect(attacker,'crit_lifesteal')){
            let ratio=0.2; attacker.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='crit_lifesteal') ratio=e.val;}));
            const heal=Math.floor(damage*ratio); attacker.cricket.hp=Math.min(attacker.cricket.maxHp,attacker.cricket.hp+heal); effs.push(`💚暴击吸血${heal}点`);
        }
        return effs;
    };

    const createWarrior = () => {
        const type = oceanWarriors[rand(0,oceanWarriors.length-1)];
        return { 
            type:type.name, name:type.name, emoji:type.emoji, 
            baseAttr:{...type.attr, critMult: 0}, 
            hp:100, maxHp:100, owner:"", 
            isAlive:true, isSleeping:false, tempEffects:{}, dots:[],
            buffCount:0, hitCount:0, secondWindUsed:false, bloodRageTriggered:false 
        };
    };

    const createSpecificWarrior = (typeName) => {
        let type;
        if(/^\d+$/.test(typeName)){
            const idx = parseInt(typeName) - 1;
            if(idx >= 0 && idx < oceanWarriors.length) type = oceanWarriors[idx];
        } else {
            type = oceanWarriors.find(w => w.name.includes(typeName) || w.emoji === typeName);
        }
        if(!type) return createWarrior();
        return { 
            type:type.name, name:type.name, emoji:type.emoji, 
            baseAttr:{...type.attr, critMult: 0}, 
            hp:100, maxHp:100, owner:"", 
            isAlive:true, isSleeping:false, tempEffects:{}, dots:[],
            buffCount:0, hitCount:0, secondWindUsed:false, bloodRageTriggered:false 
        };
    };

    const initPlayer = (nickname,isBot,data,warriorTypeName) => {
        const warrior = warriorTypeName ? createSpecificWarrior(warriorTypeName) : createWarrior();
        const player = {nickname, isBot, cricket:warrior, talents:[], fogCounter:0, eternalCounter:0};
        if(data.talentEnabled){
            player.talents = assignTalents(data.talentCount||2);
            player.talents.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='maxhp_up'){warrior.maxHp+=e.val; warrior.hp=warrior.maxHp;}
            }));
        }
        if(data.currentScene?.effects){
            data.currentScene.effects.forEach(e=>{
                if(e.type==='maxhp_up'){warrior.maxHp+=e.val; warrior.hp=Math.min(warrior.maxHp,warrior.hp+e.val);}
            });
        }
        return player;
    };

    const beginRound = (players,scene) => {
        players.forEach(p=>{
            if(!p.cricket) return;

            if(p.cricket.dots && p.cricket.dots.length>0){
                p.cricket.dots.forEach(dot=>{ if(p.cricket.hp>0) p.cricket.hp=Math.max(0,p.cricket.hp-dot.damage); });
                p.cricket.dots = p.cricket.dots.filter(dot=>dot.duration>1).map(dot=>({...dot, duration:dot.duration-1}));
                if(p.cricket.hp<=0) p.cricket.isAlive=false;
            }

            const persistKeys = ['atk_empower','bypass_dodge','counter','skip_attack','atk_chance_down','dodge_def_down','block_buff'];
            const keep = {};
            persistKeys.forEach(k => {
                if(p.cricket.tempEffects?.[k] !== undefined) keep[k] = p.cricket.tempEffects[k];
            });
            ['dodge_up','def_mult','crit_up','damage_up','berserk','ult_chance_up'].forEach(key => {
                const durKey = key + '_dur';
                if(p.cricket.tempEffects?.[durKey]){
                    p.cricket.tempEffects[durKey]--;
                    if(p.cricket.tempEffects[durKey]>0) keep[key] = p.cricket.tempEffects[key];
                }
            });
            if(p.cricket.tempEffects?.regen_over_dur){
                p.cricket.tempEffects.regen_over_dur--;
                if(p.cricket.tempEffects.regen_over_dur>0){
                    keep.regen_over = p.cricket.tempEffects.regen_over;
                    p.cricket.hp = Math.min(p.cricket.maxHp, p.cricket.hp + (p.cricket.tempEffects.regen_over||0));
                }
            }

            p.cricket.tempEffects = keep;

            if(hasEffect(p,'fog_proc')){
                p.fogCounter = (p.fogCounter || 0) + 1;
                if(p.fogCounter % 3 === 0){
                    p.cricket.tempEffects['dodge_up'] = (p.cricket.tempEffects['dodge_up']||0) + 0.3;
                }
            }

            if(hasEffect(p,'cleanse_regen')){
                p.eternalCounter = (p.eternalCounter || 0) + 1;
                p.talents.forEach(t=>t.effects.forEach(e=>{
                    if(e.type==='cleanse_regen' && p.eternalCounter % e.interval === 0){
                        p.cricket.hp = Math.min(p.cricket.maxHp, p.cricket.hp + e.heal);
                        const debuffs = ['atk_mult','def_mult','spd_mult','dodge_down','atk_chance_down','skip_attack'];
                        for(const d of debuffs){
                            if(p.cricket.tempEffects[d] !== undefined){
                                delete p.cricket.tempEffects[d];
                                break;
                            }
                        }
                    }
                }));
            }

            if(hasEffect(p,'second_wind') && !p.cricket.secondWindUsed && p.cricket.hp > 0 && p.cricket.hp <= p.cricket.maxHp * 0.2){
                p.talents.forEach(t=>t.effects.forEach(e=>{
                    if(e.type==='second_wind'){
                        p.cricket.hp = Math.min(p.cricket.maxHp, p.cricket.hp + e.heal);
                        p.cricket.secondWindUsed = true;
                    }
                }));
            }

            if(hasEffect(p,'threshold_growth') && !p.cricket.bloodRageTriggered && p.cricket.hp > 0 && p.cricket.hp <= p.cricket.maxHp * 0.3){
                p.talents.forEach(t=>t.effects.forEach(e=>{
                    if(e.type==='threshold_growth'){
                        p.cricket.baseAttr.atk += (e.atk||0);
                        p.cricket.baseAttr.spd += (e.spd||0);
                        p.cricket.bloodRageTriggered = true;
                    }
                }));
            }
        });

        if(scene?.effects){
            const burn = scene.effects.find(e=>e.type==='burn');
            if(burn) players.forEach(p=>{
                if(p.cricket?.isAlive){
                    p.cricket.hp -= burn.val;
                    if(p.cricket.hp<=0) p.cricket.isAlive=false;
                }
            });
            const shock = scene.effects.find(e=>e.type==='shock');
            if(shock) players.forEach(p=>{
                if(p.cricket?.isAlive){
                    p.cricket.hp -= shock.val;
                    if(p.cricket.hp<=0) p.cricket.isAlive=false;
                }
            });
        }

        players.forEach(p=>{
            if(!p.cricket?.isAlive) return;
            let regen = 0;
            p.talents?.forEach(t=>t.effects.forEach(e=>{
                if(e.type==='regen') regen+=e.val;
                if(e.type==='regen_lowhp'&&p.cricket.hp<=p.cricket.maxHp*e.threshold) regen+=e.val;
            }));
            scene?.effects?.forEach(e=>{if(e.type==='regen') regen+=e.val;});
            if(regen>0) p.cricket.hp = Math.min(p.cricket.maxHp, p.cricket.hp+regen);
        });
    };

    const getActionType = (player) => {
        let weights = {...baseActionWeights};
        player.talents?.forEach(t=>t.effects.forEach(e=>{
            if(e.type==='atk_chance') weights.attack+=Math.round(e.val*10);
            if(e.type==='def_chance') weights.defend+=Math.round(e.val*10);
        }));
        if(player.cricket.tempEffects?.skip_attack){
            weights.attack=0;
            delete player.cricket.tempEffects.skip_attack;
        }
        if(player.cricket.tempEffects?.atk_chance_down){
            weights.attack=Math.max(0,weights.attack-2);
            delete player.cricket.tempEffects.atk_chance_down;
        }
        if(player.cricket.tempEffects?.block_buff){
            weights.buff=0;
            delete player.cricket.tempEffects.block_buff;
        }
        const total = Object.values(weights).reduce((a,b)=>a+b,0);
        if(total<=0) return 'rest';
        const roll = rand(1,total);
        let cum=0;
        for(const [type,w] of Object.entries(weights)){ cum+=w; if(roll<=cum) return type; }
        return 'rest';
    };

    const getStatusText = (player) => {
        const parts = [];
        if(player.cricket.dots && player.cricket.dots.length>0) parts.push(`中毒(${player.cricket.dots.map(d=>d.damage).join('/')}x${player.cricket.dots[0].duration}回合)`);
        const eff = player.cricket.tempEffects;
        if(eff.def_mult) parts.push(`防御${eff.def_mult<1?'降低':'提升'}`);
        if(eff.atk_mult) parts.push(`攻击${eff.atk_mult<1?'降低':'提升'}`);
        if(eff.spd_mult) parts.push(`速度${eff.spd_mult<1?'降低':'提升'}`);
        if(eff.dodge_up) parts.push(`闪避+${Math.round(eff.dodge_up*100)}%`);
        if(eff.dodge_down) parts.push(`闪避-${Math.round(eff.dodge_down*100)}%`);
        if(eff.dodge_def_down) parts.push(`对敌闪避/防御减半`);
        if(eff.atk_empower) parts.push(`伤害+25%`);
        if(eff.damage_up) parts.push(`伤害+${Math.round(eff.damage_up*100)}%`);
        if(eff.bypass_dodge) parts.push(`无视闪避`);
        if(eff.counter) parts.push(`反击待命`);
        if(eff.skip_attack) parts.push(`无法攻击`);
        if(eff.crit_up) parts.push(`暴击率+${Math.round(eff.crit_up*100)}%`);
        if(eff.rest_amp) parts.push(`休息增效`);
        if(eff.block_buff) parts.push(`被压制`);
        if(eff.regen_over) parts.push(`持续恢复`);
        if(eff.ult_chance_up) parts.push(`大招概率+${Math.round(eff.ult_chance_up*100)}%`);
        return parts.length>0 ? ` [${parts.join('，')}]` : '';
    };

    const generateStatusFooter = (players) => {
        let footer = `🌊══════════════🌊\n状态：\n`;
        const alive = players.filter(p=>p.cricket?.isAlive);
        players.forEach(p=>{
            const sign = p.cricket?.isAlive ? (p.cricket.isSleeping?'💤':'🌊') : '💀';
            footer += `${p.nickname}${p.isBot?' 🤖':''} ${p.cricket.emoji} ${p.cricket.name}：${p.cricket.hp}/${p.cricket.maxHp} ${sign}${getStatusText(p)}\n`;
        });
        footer += alive.length<=1?`\n⚡ 最后一击！发送 .斗蛐蛐 见证结局。`:`\n发送 .斗蛐蛐 继续下一波潮汐。`;
        return footer;
    };

    const generateBattleRound = (players,data) => {
        let text = `🌊～～～～ 第 ${data.round} 波潮汐 ～～～～🌊\n`;
        if(data.currentScene) text += `📍 战场：${data.currentScene.name} - ${data.currentScene.desc}\n\n`;
        beginRound(players, data.currentScene);
        let alive = players.filter(p=>p.cricket?.isAlive);
        let shuffled = [...alive].sort(()=>Math.random()-0.5);
        shuffled.forEach(p=>p.cricket.isSleeping=false);

        // 战意燃烧冲突检测
        const initiativeUsers = shuffled.filter(p => p.cricket.tempEffects?.initiative);
        if(initiativeUsers.length > 1){
            initiativeUsers.forEach(p => {
                delete p.cricket.tempEffects.initiative;
                delete p.cricket.tempEffects.damage_up;
                text += `⚠️ ${p.nickname}的战意燃烧与对方冲突，先手效果抵消！\n`;
            });
        } else if(initiativeUsers.length === 1){
            const u = initiativeUsers[0];
            shuffled = shuffled.filter(p => p !== u);
            shuffled.unshift(u);
            delete u.cricket.tempEffects.initiative;
        }

        for(const player of shuffled){
            const warrior = player.cricket;
            const actionType = getActionType(player);

            // ===== 防御 =====
            if(actionType==='defend'){
                const defAction = defendActions[rand(0,defendActions.length-1)];
                const eff = defAction.effect;

                if(eff.type==='counter'){
                    warrior.tempEffects.counter = true;
                    warrior.tempEffects['def_mult'] = (warrior.tempEffects['def_mult']||1) * (1 + eff.def_up);
                    text += `🔄 『${defAction.name}』${warrior.emoji} ${player.nickname}(${warrior.name})${player.isBot?' 🤖':''} ${defAction.desc}。防御+15%，受击则反击。\n\n`;
                    continue;
                }

                if(eff.type==='def_up') warrior.tempEffects['def_mult'] = (warrior.tempEffects['def_mult']||1) * (1+eff.val);
                if(eff.type==='dodge_up') warrior.tempEffects['dodge_up'] = (warrior.tempEffects['dodge_up']||0) + eff.val;
                if(eff.type==='heal_armor'){
                    warrior.hp = Math.min(warrior.maxHp, warrior.hp+eff.heal);
                    warrior.tempEffects['def_mult'] = (warrior.tempEffects['def_mult']||1) * (1+eff.def_up);
                }
                if(eff.type==='atk_chance_down'){
                    const enemies = alive.filter(p=>p!==player);
                    if(enemies.length>0){
                        const rTarget = enemies[rand(0,enemies.length-1)];
                        if(!checkControlImmunity(rTarget)) rTarget.cricket.tempEffects['atk_chance_down'] = true;
                    }
                }
                if(eff.type==='atk_up') warrior.tempEffects['atk_mult'] = (warrior.tempEffects['atk_mult']||1) * (1+eff.val);
                if(eff.type==='deep_rest') warrior.hp = Math.min(warrior.maxHp, warrior.hp+eff.heal);

                if(hasEffect(player,'defend_damage')){
                    let dmg=15; player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='defend_damage') dmg=e.val;}));
                    const enemies = alive.filter(p=>p!==player && p.cricket?.isAlive);
                    if(enemies.length>0){
                        const rTarget = enemies[rand(0,enemies.length-1)];
                        rTarget.cricket.hp = Math.max(0, rTarget.cricket.hp - dmg);
                        text += `🔊 声呐脉冲！${player.nickname}的防御姿态发出冲击波，对${rTarget.nickname}造成${dmg}点伤害！\n`;
                        if(rTarget.cricket.hp<=0) rTarget.cricket.isAlive=false;
                    }
                }
                if(hasEffect(player,'defend_heal')){
                    let heal=10; player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='defend_heal') heal=e.val;}));
                    warrior.hp = Math.min(warrior.maxHp, warrior.hp+heal);
                    text += `🏰 移动堡垒！${player.nickname}在防御中额外恢复${heal}点生命。\n`;
                }

                text += `🛡️ 『${defAction.name}』${warrior.emoji} ${player.nickname}(${warrior.name})${player.isBot?' 🤖':''} ${defAction.desc}。${player.isBot?safeRandPick(botConfig.defenseResponses):''}\n\n`;
                continue;
            }

            // ===== 休息 =====
            if(actionType==='rest'){
                let baseHeal=rand(0,10);
                let bonus=getHealBonus(player,data.currentScene);
                let total=baseHeal+bonus;
                if(hasEffect(player,'rest_percent')){
                    let pct=0; player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='rest_percent') pct+=e.val;}));
                    total += Math.floor(warrior.maxHp * pct);
                }
                if(hasEffect(player,'rest_amp')){
                    let amp=1.5; player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='rest_amp') amp=e.val;}));
                    total = Math.floor(total * amp);
                }
                if(data.currentScene?.effects){
                    const restEff = data.currentScene.effects.find(e=>e.type==='rest_amp');
                    if(restEff) total = Math.floor(total * restEff.val);
                }
                if(warrior.tempEffects?.rest_amp){
                    total = Math.floor(total * (1 + warrior.tempEffects.rest_amp));
                    delete warrior.tempEffects.rest_amp;
                }
                warrior.hp = Math.min(warrior.maxHp, warrior.hp+total);
                warrior.isSleeping = true;
                const healText = total>0?`恢复了 ${total} 点生命`:`没有恢复...咕噜噜`;
                const restEvent = safeRandPick(botConfig.restEvents);
                text += `💤 『洋流小憩』${warrior.emoji} ${player.nickname}(${warrior.name})${player.isBot?' 🤖':''} 随着洋流小憩，${healText}。\n当前生命：${warrior.hp}/${warrior.maxHp} ${restEvent}${player.isBot?safeRandPick(botConfig.sleepResponses):''}\n\n`;
                continue;
            }

            // ===== 强化 =====
            if(actionType==='buff'){
                const buffAction = buffActions[rand(0,buffActions.length-1)];
                const eff = buffAction.effect;
                let buffText = '';

                if(eff.type==='perm_growth'){
                    warrior.baseAttr.atk = (warrior.baseAttr.atk||0) + (eff.atk||0);
                    warrior.baseAttr.def = (warrior.baseAttr.def||0) + (eff.def||0);
                    warrior.baseAttr.spd = (warrior.baseAttr.spd||0) + (eff.spd||0);
                    buffText = `永久攻击+${eff.atk||0}，防御+${eff.def||0}，速度+${eff.spd||0}`;
                }
                if(eff.type==='berserk'){
                    warrior.hp = Math.max(1, warrior.hp - eff.hpCost);
                    warrior.tempEffects['atk_mult'] = (warrior.tempEffects['atk_mult']||1) * eff.atkMult;
                    warrior.tempEffects['berserk_dur'] = eff.duration;
                    buffText = `损失${eff.hpCost}HP，攻击+${Math.round((eff.atkMult-1)*100)}%（${eff.duration}回合）`;
                }
                if(eff.type==='bless'){
                    warrior.hp = Math.min(warrior.maxHp, warrior.hp + eff.heal);
                    warrior.tempEffects['dodge_up'] = (warrior.tempEffects['dodge_up']||0) + eff.dodgeUp;
                    warrior.tempEffects['dodge_up_dur'] = eff.duration;
                    buffText = `恢复${eff.heal}HP，闪避+${Math.round(eff.dodgeUp*100)}%（${eff.duration}回合）`;
                }
                if(eff.type==='crit_focus'){
                    warrior.tempEffects['crit_up'] = (warrior.tempEffects['crit_up']||0) + eff.critUp;
                    warrior.tempEffects['crit_up_dur'] = eff.duration;
                    buffText = `暴击率+${Math.round(eff.critUp*100)}%（${eff.duration}回合）`;
                }
                if(eff.type==='regen_over'){
                    warrior.tempEffects['regen_over'] = eff.heal;
                    warrior.tempEffects['regen_over_dur'] = eff.duration;
                    buffText = `每回合恢复${eff.heal}HP（${eff.duration}回合）`;
                }
                if(eff.type==='initiative'){
                    warrior.tempEffects['initiative'] = true;
                    warrior.tempEffects['damage_up'] = eff.damageUp;
                    warrior.tempEffects['damage_up_dur'] = eff.duration;
                    buffText = `下回合先手，伤害+${Math.round(eff.damageUp*100)}%`;
                }
                if(eff.type==='perm_crit'){
                    warrior.baseAttr.crit += eff.val;
                    buffText = `永久暴击率+${Math.round(eff.val*100)}%`;
                }
                if(eff.type==='perm_crit_mult'){
                    warrior.baseAttr.critMult = (warrior.baseAttr.critMult || 0) + eff.val;
                    buffText = `永久暴击伤害+${Math.round(eff.val*100)}%`;
                }
                if(eff.type==='perm_dodge'){
                    warrior.baseAttr.dodge += eff.val;
                    buffText = `永久闪避率+${Math.round(eff.val*100)}%`;
                }
                if(eff.type==='ult_chance_up'){
                    warrior.tempEffects['ult_chance_up'] = (warrior.tempEffects['ult_chance_up']||0) + eff.val;
                    warrior.tempEffects['ult_chance_up_dur'] = eff.duration;
                    buffText = `大招概率+${Math.round(eff.val*100)}%（${eff.duration}回合）`;
                }
                if(eff.type==='evolve_talent'){
                    const newTalents = assignTalents(1);
                    if(newTalents.length > 0){
                        const nt = newTalents[0];
                        player.talents.push(nt);
                        nt.effects.forEach(e=>{
                            if(e.type==='maxhp_up'){
                                warrior.maxHp += e.val;
                                warrior.hp += e.val;
                            }
                        });
                        buffText = `进化出新天赋：【${nt.name}】！${nt.desc}`;
                    } else {
                        buffText = `基因突变失败...`;
                    }
                }

                text += `✨ 『${buffAction.name}』${warrior.emoji} ${player.nickname}(${warrior.name})${player.isBot?' 🤖':''} ${buffAction.desc}。\n💪 ${buffText}${player.isBot?safeRandPick(botConfig.buffResponses):''}\n\n`;
                continue;
            }

            // ===== 攻击 =====
            const targets = alive.filter(p=>p!==player && p.cricket?.isAlive);
            if(targets.length===0) continue;
            const target = targets[rand(0,targets.length-1)];
            let isUltimate=false, action;
            if(ultimateActionMap[warrior.type] && Math.random()<getUltimateChance(player)){
                action = ultimateActionMap[warrior.type]; isUltimate=true;
            }else{
                action = commonActions[rand(0,commonActions.length-1)];
            }

            const desc = action.descPool ? safeRandPick(action.descPool) : '发动了攻击';
            const result = calculateDamage(player,target,action,data.currentScene);

            if(result.isDodged && hasEffect(target,'dodge_empower')) target.cricket.tempEffects['bypass_dodge']=true;

            let counterText = '';
            if(!result.isDodged && target.cricket.tempEffects?.counter && target.cricket.isAlive && result.damage>0){
                const counterAtk = getFinalAttr(target,'atk',data.currentScene);
                const counterDmg = Math.floor(counterAtk*0.5);
                player.cricket.hp = Math.max(0,player.cricket.hp-counterDmg);
                delete target.cricket.tempEffects.counter;
                counterText = ` ⚡${target.nickname}(${target.cricket.name})触发反击！造成${counterDmg}点伤害。`;
                if(player.cricket.hp<=0) player.cricket.isAlive=false;
            }

            if(!result.isDodged && result.damage>0){
                target.cricket.hp = Math.max(0, target.cricket.hp - result.damage);
                if(target.cricket.hp<=0) target.cricket.isAlive=false;
                const effects = applyCombatEffects(player,target,action,result.damage,result.isCrit);

                // 座头鲸AOE处理
                if(isUltimate && action.name === "灭世鲸歌"){
                    const otherTargets = alive.filter(p => p !== player && p !== target && p.cricket?.isAlive);
                    if(otherTargets.length > 0){
                        text += `🌊 鲸歌扩散，全场震颤！\n`;
                        for(const ot of otherTargets){
                            const waveDmg = Math.max(1, Math.floor(getFinalAttr(player,'atk',data.currentScene) * 0.6));
                            ot.cricket.hp = Math.max(0, ot.cricket.hp - waveDmg);
                            ot.cricket.tempEffects['def_mult'] = 0.7;
                            ot.cricket.tempEffects['def_mult_dur'] = 2;
                            text += `  💥 ${ot.nickname}(${ot.cricket.name}) 受到${waveDmg}点音波伤害，防御降低30%！剩余：${ot.cricket.hp}/${ot.cricket.maxHp}\n`;
                            if(ot.cricket.hp <= 0) {
                                ot.cricket.isAlive = false;
                                text += `  💀 ${ot.nickname}(${ot.cricket.name}) 被鲸歌震碎！\n`;
                            }
                        }
                        text += '\n';
                    }
                }

                if(hasEffect(target,'reflect')){
                    let ref=0; target.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='reflect') ref=e.val;}));
                    const atk=getFinalAttr(player,'atk',data.currentScene);
                    const reflectDmg=Math.floor(atk*ref);
                    if(reflectDmg>0){
                        player.cricket.hp=Math.max(0,player.cricket.hp-reflectDmg);
                        effects.push(`⚡反伤${reflectDmg}点`);
                        if(player.cricket.hp<=0) player.cricket.isAlive=false;
                    }
                }

                if(result.damage>0 && hasEffect(target,'toxic_blood')){
                    target.talents.forEach(t=>t.effects.forEach(e=>{
                        if(e.type==='toxic_blood' && Math.random()<e.chance){
                            if(!player.cricket.dots) player.cricket.dots=[];
                            player.cricket.dots.push({damage:e.damage,duration:e.duration});
                            effects.push(`☠️毒血反噬！中毒${e.damage}点x${e.duration}回合`);
                        }
                    }));
                }

                if(!target.cricket.isAlive && hasEffect(target,'on_death_damage')){
                    let ratio=0.2; target.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='on_death_damage') ratio=e.val;}));
                    const deathDmg=Math.floor(target.cricket.maxHp*ratio);
                    player.cricket.hp=Math.max(0,player.cricket.hp-deathDmg);
                    effects.push(`💀终焉悲鸣${deathDmg}点`);
                    if(player.cricket.hp<=0) player.cricket.isAlive=false;
                }

                if(!target.cricket.isAlive && hasEffect(player,'kill_heal')){
                    let heal=30; player.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='kill_heal') heal=e.val;}));
                    player.cricket.hp=Math.min(player.cricket.maxHp,player.cricket.hp+heal);
                    effects.push(`🍽️击杀回复${heal}点`);
                }

                if(result.damage>0 && hasEffect(target,'hit_empower')){
                    let val=0.25; target.talents.forEach(t=>t.effects.forEach(e=>{if(e.type==='hit_empower') val=e.val;}));
                    target.cricket.tempEffects['atk_empower'] = val;
                }

                if(result.damage>0 && hasEffect(target,'adaptive_def')){
                    target.cricket.hitCount = (target.cricket.hitCount||0) + 1;
                    target.talents.forEach(t=>t.effects.forEach(e=>{
                        if(e.type==='adaptive_def' && target.cricket.hitCount % e.count === 0){
                            target.cricket.baseAttr.def += e.val;
                            effects.push(`🛡️适者生存！防御永久+${e.val}`);
                        }
                    }));
                }

                const effStr = effects.length>0?` [${effects.join('，')}]`:'';
                const approachPool = ["搅动海流扑向","银箭般窜向","借礁石阴影逼近","借涡流撞向","佯退急转偷袭","连续跃起后击中"];
                const approach = safeRandPick(approachPool);
                const label = isUltimate?`💥【大招】${action.name}`:`⚔️【${action.name}】`;
                const crit = result.isCrit?'【致命一击！】':'';
                const comment = player.isBot?safeRandPick(botConfig.attackResponses):'';
                text += `${isUltimate?'💥 ':'⚔️ '}『攻击』${warrior.emoji} ${player.nickname}(${warrior.name})${player.isBot?' 🤖':''} ${approach}${target.cricket.emoji} ${target.nickname}(${target.cricket.name})！${crit}\n${label} ${desc}，造成 ${result.damage} 点伤害！${effStr}\n${target.nickname}(${target.cricket.name}) 剩余生命：${target.cricket.hp}/${target.cricket.maxHp} 🌊${counterText}${comment}\n\n`;
            }else{
                const dodgePool = ["晃身游开","用壳挡住","柔软闪避","用鳍格挡","借力卸开"];
                const dodgeDesc = safeRandPick(dodgePool);
                text += `⚔️ 『交锋』${warrior.emoji} ${player.nickname}(${warrior.name})${player.isBot?' 🤖':''} 搅动海流扑向${target.cricket.emoji} ${target.nickname}(${target.cricket.name})，\n但 ${target.nickname}(${target.cricket.name}) ${dodgeDesc}！攻击落空。${player.isBot?safeRandPick(botConfig.dodgeResponses):''}\n\n`;
            }
        }

        players.forEach(p => {
            if(!p.cricket) return;
            const persistKeys = ['atk_empower','bypass_dodge','counter','skip_attack','atk_chance_down','dodge_def_down','block_buff'];
            const keep = {};
            persistKeys.forEach(k => {
                if(p.cricket.tempEffects?.[k] !== undefined) keep[k] = p.cricket.tempEffects[k];
            });
            ['dodge_up','def_mult','crit_up','damage_up','berserk','ult_chance_up'].forEach(key => {
                const durKey = key + '_dur';
                if(p.cricket.tempEffects?.[durKey]){
                    p.cricket.tempEffects[durKey]--;
                    if(p.cricket.tempEffects[durKey]>0) keep[key] = p.cricket.tempEffects[key];
                }
            });
            p.cricket.tempEffects = keep;
        });

        return text;
    };

    // ==================== 指令处理 ====================
    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = '斗蛐蛐';
    cmd.help = '深海斗蛐蛐 v2.5.3 - 四行动体系、AOE大招、海嗣进化、自定义战士。指令：.斗蛐蛐';
    cmd.disabledInPrivate = true;

    cmd.solve = async (ctx, msg, cmdArgs) => {
        const groupId = msg.groupId;
        const key = 'deepsea_cricket_' + groupId;
        let storedData = ext.storageGet(key);
        let data = {};
        try { data = storedData ? JSON.parse(storedData) : { state:'idle', botEnabled:false, talentEnabled:true, talentCount:2 }; } catch(e){ data={state:'idle', botEnabled:false, talentEnabled:true, talentCount:2}; }
        const rawMsg = msg.message;
        const arg1 = cmdArgs.getArgN(1);
        const arg2 = cmdArgs.getArgN(2);

        if(arg1==='help'||rawMsg.includes('帮助')){
            const warriorList = oceanWarriors.map((w,i)=>`${i+1}. ${w.emoji} ${w.name}`).join('\n  ');
            seal.replyToSender(ctx,msg, `🌊 深海斗蛐蛐 v2.5.3 🌊
四行动体系：攻击(45%) / 防御(20%) / 强化(20%) / 休息(15%)

.斗蛐蛐 2/3/4 —— 创建游戏
.斗蛐蛐 代号<名> [战士编号/名] —— 加入（默认随机，可指定战士）
.斗蛐蛐 —— 开始/继续
.斗蛐蛐 状态 —— 查看战况
.斗蛐蛐 bot —— 开关Bot
.斗蛐蛐 天赋 开关/数字(0~6) —— 天赋设置

可选战士（共${oceanWarriors.length}位）：
  ${warriorList}`);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(rawMsg.includes('状态')||rawMsg.includes('信息')){
            let reply = `🌊 深海斗蛐蛐 v2.5.3 🌊\n══════════════════\n`;
            if(!data.state||data.state==='idle'){
                reply += `状态：浅海平静。\nBot：${data.botEnabled?'✅ 待命':'❌ 休眠'}\n天赋：${data.talentEnabled?'✅ 开启(数量:'+data.talentCount+')':'❌ 关闭'}\n\n创建：.斗蛐蛐 人数`;
            }else if(data.state==='setup'){
                reply += `状态：🐚 召集战士中\n战场：${data.currentScene?.name||'未知'}\nBot：${data.botEnabled?'✅':'❌'} | 天赋：${data.talentEnabled?'✅ 数量:'+data.talentCount:'❌'}\n人数：${data.playerCount} | 已集结：${data.players?.length||0}\n`;
                if(data.players) data.players.forEach((p,i)=>{
                    reply += `  ${i+1}. ${p.nickname}${p.isBot?' 🤖':''} ${p.cricket.emoji} ${p.cricket.name} (${p.cricket.hp}/${p.cricket.maxHp})${getStatusText(p)}`;
                    if(p.talents?.length) reply += ` 天赋:${p.talents.map(t=>t.name).join('、')}`;
                    reply += `\n`;
                });
                reply += `\n加入：.斗蛐蛐 代号<名字> [战士编号/名](可选)`;
                if(data.players?.length===data.playerCount) reply += `\n全员到齐，发送 .斗蛐蛐 开战！`;
            }else if(data.state==='battle'){
                reply += `状态：⚔️ 激战第 ${data.round} 波潮汐\n战场：${data.currentScene?.name}\nBot：${data.botEnabled?'🏁 助威中':'🔇 观看中'}\n`;
                const alive = data.players?.filter(p=>p.cricket?.isAlive).length||0;
                reply += `存活：${alive}位\n`;
                if(data.players) data.players.forEach((p,i)=>{
                    const sign = p.cricket?.isAlive ? (p.cricket.isSleeping?'💤':'🌊') : '💀';
                    reply += `  ${i+1}. ${p.nickname}${p.isBot?' 🤖':''} ${p.cricket.emoji} ${p.cricket.name}：${p.cricket.hp}/${p.cricket.maxHp} ${sign}${getStatusText(p)}`;
                    if(p.talents?.length) reply += ` 天赋:${p.talents.map(t=>t.name).join('、')}`;
                    reply += `\n`;
                });
                reply += `\n发送 .斗蛐蛐 继续。`;
            }
            seal.replyToSender(ctx,msg, reply);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(rawMsg.includes('天赋')||rawMsg.includes('talent')){
            const numMatch = rawMsg.match(/(\d+)/);
            if(numMatch){
                let num = parseInt(numMatch[1]);
                if(num>=0 && num<=6){
                    data.talentCount = num;
                    if(!data.talentEnabled && num>0) data.talentEnabled = true;
                    ext.storageSet(key,JSON.stringify(data));
                    seal.replyToSender(ctx,msg, `天赋数量已设置为 ${num}。${num===0?'天赋系统已关闭。':''}`);
                    return seal.ext.newCmdExecuteResult(true);
                }else{ seal.replyToSender(ctx,msg, `天赋数量范围0-6哦～`); return seal.ext.newCmdExecuteResult(true); }
            }
            data.talentEnabled = !data.talentEnabled;
            ext.storageSet(key,JSON.stringify(data));
            seal.replyToSender(ctx,msg, `天赋系统已${data.talentEnabled?'开启':'关闭'}。${data.talentEnabled?'当前分配数量：'+(data.talentCount||2):''}`);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(rawMsg.includes('bot')){
            data.botEnabled = !data.botEnabled;
            ext.storageSet(key,JSON.stringify(data));
            seal.replyToSender(ctx,msg, `鲨鲨Bot已${data.botEnabled?'跃出水面，新建游戏时将自动加入':'游回深海，休息一下'}`);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(rawMsg.includes('代号')){
            if(data.state!=='setup'){ seal.replyToSender(ctx,msg, `现在没有正在召集的游戏呢，请先创建：.斗蛐蛐 人数`); return seal.ext.newCmdExecuteResult(true); }
            
            // 解析：.斗蛐蛐 代号 名字 [战士]
            const afterPrefix = rawMsg.replace(/^[.。]斗蛐蛐\s+代号\s*/, '').trim();
            const parts = afterPrefix.split(/\s+/);
            let nickname = parts[0] || '';
            let warriorChoice = parts[1] || '';
            
            if(!nickname){ seal.replyToSender(ctx,msg, `请输入你的战士代号，例如：.斗蛐蛐 代号泡泡龙`); return seal.ext.newCmdExecuteResult(true); }
            if(!data.players) data.players=[];
            if(data.players.some(p=>p.nickname===nickname)){ seal.replyToSender(ctx,msg, `这个代号已经被用了，换个名字吧～`); return seal.ext.newCmdExecuteResult(true); }
            if(data.players.length>=data.playerCount){ seal.replyToSender(ctx,msg, `战士名额已满，等待开战指令吧。`); return seal.ext.newCmdExecuteResult(true); }
            
            let specifiedWarrior = null;
            if(warriorChoice && warriorChoice !== '随机'){
                if(/^\d+$/.test(warriorChoice)){
                    const idx = parseInt(warriorChoice) - 1;
                    if(idx >= 0 && idx < oceanWarriors.length) specifiedWarrior = oceanWarriors[idx].name;
                } else {
                    const found = oceanWarriors.find(w => w.name.includes(warriorChoice) || w.emoji === warriorChoice);
                    if(found) specifiedWarrior = found.name;
                }
                if(!specifiedWarrior){
                    const list = oceanWarriors.map((w,i)=>`${i+1}. ${w.emoji} ${w.name}`).join('\n');
                    seal.replyToSender(ctx,msg, `未找到战士"${warriorChoice}"，可用战士：\n${list}\n\n发送 .斗蛐蛐 代号${nickname} 随机 使用随机战士。`);
                    return seal.ext.newCmdExecuteResult(true);
                }
            }
            
            const player = initPlayer(nickname,false,data,specifiedWarrior);
            data.players.push(player);
            ext.storageSet(key,JSON.stringify(data));
            let reply = `🐠 ${nickname} 加入了深蓝竞技场！\n战士：${player.cricket.emoji} ${player.cricket.name}\n特性：${oceanWarriors.find(w=>w.name===player.cricket.type).desc}\n生命：${player.cricket.hp}/${player.cricket.maxHp}\n`;
            if(player.talents.length) reply += `天赋：${player.talents.map(t=>t.name+'('+t.desc+')').join('、')}\n`;
            reply += `当前集结：${data.players.length}/${data.playerCount}`;
            if(data.players.length===data.playerCount) reply += `\n全员到齐！发送 .斗蛐蛐 开战！`;
            else reply += `\n还需 ${data.playerCount-data.players.length} 位。`;
            seal.replyToSender(ctx,msg, reply);
            return seal.ext.newCmdExecuteResult(true);
        }

        const playerCount = parseInt(arg1);
        if(!isNaN(playerCount) && playerCount>=2 && playerCount<=4){
            if(data.state && data.state!=='idle'){ seal.replyToSender(ctx,msg, `上一场战斗还没结束呢，结束后再创建新的吧。`); return seal.ext.newCmdExecuteResult(true); }
            const scene = battleScenes[rand(0,battleScenes.length-1)];
            const newData = { state:'setup', playerCount, players:[], round:0, botEnabled: data.botEnabled || false, talentEnabled: data.talentEnabled!==undefined?data.talentEnabled:true, talentCount: data.talentCount||2, currentScene:scene };
            if(newData.botEnabled) newData.players.push(initPlayer('鲨鲨Bot',true,newData));
            ext.storageSet(key,JSON.stringify(newData));
            data = newData;
            let reply = `🌊 召集令！${playerCount} 名战士的深海对决！\n══════════════════\n战场：${scene.name} - ${scene.desc}\n场景效果：${scene.effects.map(e=>e.type).join('，')}\n天赋系统：${data.talentEnabled?'✅ 开启(数量:'+data.talentCount+')':'❌ 关闭'}\nBot：${data.botEnabled?'✅ 鲨鲨Bot已加入':'❌ 未加入'}\n当前战士：${data.players.length}/${playerCount}\n\n💬 加入：.斗蛐蛐 代号<你的名字> [战士编号/名]`;
            seal.replyToSender(ctx,msg, reply);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(data.state==='setup' && data.players?.length>=data.playerCount){
            data.state='battle'; data.round=1;
            ext.storageSet(key,JSON.stringify(data));
            let reply = `⚔️🌊 潮汐涌动，战斗开始！ 🌊⚔️\n战场：${data.currentScene.name}\n══════════════════\n登场战士：\n`;
            data.players.forEach((p,i)=>{
                reply += `  ${i+1}. ${p.nickname}${p.isBot?' 🤖':''} ${p.cricket.emoji} ${p.cricket.name} (${p.cricket.hp}/${p.cricket.maxHp})${getStatusText(p)}`;
                if(p.talents?.length) reply += ` 天赋:${p.talents.map(t=>t.name).join('、')}`;
                reply += `\n`;
            });
            reply += `\n鲨鲨说书人：发送 .斗蛐蛐 进入第一波潮汐！`;
            seal.replyToSender(ctx,msg, reply);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(data.state==='battle'){
            if(!data.players) data.players=[];
            const aliveNow = data.players.filter(p=>p.cricket?.isAlive);
            if(aliveNow.length<=1){
                let end = `🌊🏆 潮汐止息，战斗终了！ 🏆🌊\n══════════════════\n`;
                if(aliveNow.length===1){
                    const w = aliveNow[0];
                    end += `👑 胜利者：${w.nickname}${w.isBot?' 🤖':''}\n冠军：${w.cricket.emoji} ${w.cricket.name}\n剩余生命：${w.cricket.hp}/${w.cricket.maxHp}\n🎉 ${w.nickname}：${w.isBot?safeRandPick(botConfig.victoryResponses):['深海之王就是我！','嘿，我的战士最棒！','轻松拿下亚特兰蒂斯~','感谢我的海洋伙伴们！'][rand(0,3)]}\n`;
                    data.players.forEach(p=>{ if(p!==w) end += `💧 ${p.nickname}：${p.isBot?['唔…下次一定赢。','我的战士还需要锻炼喵。','可恶，深渊之力还不够吗……'][rand(0,2)]:['呜哇，输掉了……','下次再战吧！','回去养伤，来日再决！'][rand(0,2)]}\n`; });
                }else{
                    end += `🌀 平局！所有战士同时沉入深渊……\n`;
                    data.players.forEach(p=> end += `${p.nickname}：${p.isBot?'下次再一决高下！':'居然是平手…'}\n`);
                }
                end += `\n总经历潮汐：${data.round} 波\n发送 .斗蛐蛐 人数 开启新对决吧～`;
                data.state='idle'; ext.storageSet(key,JSON.stringify(data));
                seal.replyToSender(ctx,msg,end);
                return seal.ext.newCmdExecuteResult(true);
            }
            const roundText = generateBattleRound(data.players,data);
            data.round++;
            ext.storageSet(key,JSON.stringify(data));
            const footer = generateStatusFooter(data.players);
            seal.replyToSender(ctx,msg, roundText+footer);
            return seal.ext.newCmdExecuteResult(true);
        }

        if(data.state==='setup'){
            let reply = `🌊 召集状态\n══════════════════\n设定：${data.playerCount}人战 | 战场：${data.currentScene?.name}\n天赋：${data.talentEnabled?'开启 数量:'+data.talentCount:'关闭'} | Bot：${data.botEnabled?'已加入':'未加入'}\n已集结：${data.players?.length||0}位\n`;
            if(data.players) data.players.forEach((p,i)=> reply += `  ${i+1}. ${p.nickname}${p.isBot?' 🤖':''} ${p.cricket.emoji} ${p.cricket.name}${getStatusText(p)}\n`);
            reply += `\n输入 .斗蛐蛐 代号<名字> [战士编号/名] 加入。`;
            seal.replyToSender(ctx,msg, reply);
            return seal.ext.newCmdExecuteResult(true);
        }

        seal.replyToSender(ctx,msg, `🌊 深海斗蛐蛐 v2.5.3 🌊\n鲨鲨说书人：发送 .斗蛐蛐 2/3/4 开始召集战士吧！`);
        return seal.ext.newCmdExecuteResult(true);
    };

    ext.cmdMap['斗蛐蛐'] = cmd;
}