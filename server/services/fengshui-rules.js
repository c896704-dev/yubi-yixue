/**
 * 风水判断规则常量表
 * 所有规则均为结构化数据，供分析引擎读取
 */

// ============================================================
// 一、各方位缺角的优缺点
// ============================================================
export const CORNER_MEANINGS = {
  '西北': {
    trigram: '乾',
    family: '男主人/老父',
    body: '头/肺',
    element: '金',
    strengths: ['男主人事业稳固，贵人运强', '头部与呼吸系统健康', '家中有权威人物坐镇'],
    weaknesses: ['男主人运势受压制，事业受阻', '易头痛/呼吸系统问题', '家中缺乏权威，决断力不足'],
  },
  '西南': {
    trigram: '坤',
    family: '女主人/老母',
    body: '脾胃',
    element: '土',
    strengths: ['女主人主内得力，家庭和睦', '脾胃消化系统健康', '家庭关系和谐稳定'],
    weaknesses: ['女主人地位下降，家庭不睦', '肠胃消化系统易出问题', '夫妻感情易受影响'],
  },
  '正东': {
    trigram: '震',
    family: '长男',
    body: '肝胆/足',
    element: '木',
    strengths: ['长子有担当，事业上升', '肝胆系统健康', '家庭成员行动力强'],
    weaknesses: ['长子发展受限，缺乏决断力', '易肝胆不适', '家庭缺乏活力和进取心'],
  },
  '东南': {
    trigram: '巽',
    family: '长女',
    body: '肝胆/呼吸',
    element: '木',
    strengths: ['长女聪慧，学业事业顺利', '人际关系好，贵人缘佳', '文昌运势旺盛'],
    weaknesses: ['长女运势受阻，学业不佳', '呼吸系统偏弱', '家庭成员执行力不足'],
  },
  '正北': {
    trigram: '坎',
    family: '中男',
    body: '肾/耳',
    element: '水',
    strengths: ['财运稳定，次子健康', '耳肾系统好', '家庭根基稳固'],
    weaknesses: ['财运起伏大，守财不易', '次子健康受影响', '易肾虚耳鸣'],
  },
  '正南': {
    trigram: '离',
    family: '中女',
    body: '目/心',
    element: '火',
    strengths: ['中女事业有成，名声好', '眼目明亮，心脏健康', '家庭声誉良好'],
    weaknesses: ['中女怀才不遇', '易眼部不适，心脏问题', '名声受损，在外遇是非'],
  },
  '东北': {
    trigram: '艮',
    family: '少男',
    body: '手/脾胃',
    element: '土',
    strengths: ['少男健康，事业有靠山', '家中有贵人相助', '家庭稳定，根基扎实'],
    weaknesses: ['少男体弱多病', '事业无贵人扶持', '家庭缺乏靠山和后盾'],
  },
  '正西': {
    trigram: '兑',
    family: '少女',
    body: '口/肺',
    element: '金',
    strengths: ['少女活泼开朗', '人际口才好，社交顺利', '肺呼吸系统健康'],
    weaknesses: ['少女压抑内向', '口舌是非多', '肺功能偏弱，呼吸问题'],
  },
};

// ============================================================
// 二、各功能区风水判断规则
// ============================================================

// 2.1 大门
export const DOOR_RULES = {
  strengths: [
    { condition: '位置吉方', item: '大门开在吉位（生气/延年/天医位）', impact: '高', detail: '纳吉气入门，家运昌隆' },
    { condition: '门前开阔', item: '门前开阔明亮，有明堂', impact: '高', detail: '明堂开阔则气聚，利于财运事业' },
    { condition: '有玄关', item: '有玄关缓冲，不直接见厅', impact: '高', detail: '藏风聚气，隐私性好，气场稳定' },
    { condition: '大小适中', item: '大门大小与住宅匹配', impact: '中', detail: '门不过大泄气、不过小闭气' },
  ],
  weaknesses: [
    { condition: '门对电梯', item: '大门正对电梯/楼梯', impact: '高', detail: '开口煞/退财梯，气场被电梯抽走，财运起伏' },
    { condition: '门对卫生间', item: '大门正对卫生间门', impact: '高', detail: '秽气迎门，开门见污，影响健康和家运' },
    { condition: '门对厨房', item: '大门正对厨房门', impact: '高', detail: '开门见灶，钱财多耗，火气冲门' },
    { condition: '门对阳台', item: '大门正对阳台/窗户', impact: '高', detail: '穿堂煞，前通后通人财两空，气流直进直出不聚气' },
    { condition: '门对卧室', item: '大门正对卧室门', impact: '中', detail: '隐私受扰，一进门就见私密空间' },
    { condition: '门对走道', item: '大门正对长走廊', impact: '中', detail: '穿心剑，走廊越长越不利，气场直冲不散' },
    { condition: '门对镜', item: '大门正对镜子', impact: '中', detail: '财气反射出门，进门气场被镜面反弹' },
    { condition: '横梁压门', item: '大门上方有横梁', impact: '中', detail: '横梁压门，家人受压难出头' },
    { condition: '无玄关', item: '入户无玄关，开门见厅', impact: '中', detail: '气无缓冲直入直出，不利于藏风聚气' },
  ],
};

// 2.2 厨房
export const KITCHEN_RULES = {
  strengths: [
    { condition: '在东/东南', item: '厨房在东方或东南方', impact: '高', detail: '木生火，大吉之位，饮食安康' },
    { condition: '在北', item: '厨房在北方', impact: '中', detail: '水火既济，饮食健康' },
    { condition: '灶台有靠', item: '灶台背后是实墙', impact: '中', detail: '有靠山，家运稳定' },
    { condition: '有窗', item: '厨房有窗通风', impact: '高', detail: '油烟及时排出，保持厨房干爽洁净' },
    { condition: '灶水分离', item: '灶台与水槽合理分开', impact: '中', detail: '水火不相冲，饮食平安' },
  ],
  weaknesses: [
    { condition: '在西北', item: '厨房在西北方（火烧天门）', impact: '高', detail: '乾为天属金，厨房火旺克金，伤男主人事业和健康，易头痛/呼吸问题' },
    { condition: '在南', item: '厨房在南方', impact: '中', detail: '火上加火，易引发心脑血管问题' },
    { condition: '在中宫', item: '厨房在房屋中央', impact: '高', detail: '火气四散中宫，全家不安，心脏血液问题' },
    { condition: '无窗', item: '厨房无窗（暗厨）', impact: '高', detail: '油烟难散，火气积聚，影响健康和财运' },
    { condition: '灶台背窗', item: '灶台背靠窗户', impact: '中', detail: '无靠山，财运不稳' },
    { condition: '灶对门', item: '灶台正对厨房门', impact: '中', detail: '火气冲门，钱财有损' },
    { condition: '灶紧邻水槽', item: '灶台紧邻水槽/水龙头', impact: '中', detail: '水火相冲，饮食不安，家庭矛盾' },
    { condition: '厨卫相邻', item: '厨房与卫生间相邻/相对', impact: '高', detail: '水火相冲且秽气犯灶，不利健康' },
    { condition: '横梁压灶', item: '横梁压灶', impact: '中', detail: '女主人受压，饮食不调' },
    { condition: '地高于厅', item: '厨房地面高于客厅', impact: '中', detail: '主次颠倒，污水倒流之象' },
    { condition: '灶对冰箱', item: '灶台正对冰箱', impact: '低', detail: '冷热相冲，饮食不调' },
  ],
};

// 2.3 卫生间
export const BATHROOM_RULES = {
  strengths: [
    { condition: '在凶位', item: '卫生间在凶位（绝命/五鬼位）', impact: '中', detail: '以凶压凶，污秽有制，不压吉方' },
    { condition: '有窗', item: '卫生间有窗通风', impact: '高', detail: '湿气秽气及时排出，保持洁净' },
    { condition: '门隐蔽', item: '卫生间门隐蔽，不正对主要区域', impact: '中', detail: '秽气不扩散，家运不受影响' },
    { condition: '干湿分离', item: '卫生间干湿分离', impact: '中', detail: '湿气不外溢，空间使用更健康' },
  ],
  weaknesses: [
    { condition: '在中宫', item: '卫生间在房屋中央（厕占中宫）', impact: '高', detail: '最严重的格局问题之一。秽气四散全宅，影响全家健康和运势，心脏/脾胃问题' },
    { condition: '在西南', item: '卫生间在西南方（坤位受污）', impact: '高', detail: '坤位代表女主人，受污则伤女主人健康和家庭地位' },
    { condition: '在东北', item: '卫生间在东北方（艮位受污）', impact: '中', detail: '艮位代表少男，受污不利少男成长和学业' },
    { condition: '门对大门', item: '卫生间门正对大门', impact: '高', detail: '秽气迎门，进门就见卫生间，运势受压制' },
    { condition: '门对卧室', item: '卫生间门正对卧室门', impact: '高', detail: '秽气湿气直冲卧室，影响睡眠和健康' },
    { condition: '门对厨房', item: '卫生间门正对厨房门', impact: '高', detail: '水火相冲，秽气犯灶，饮食不安' },
    { condition: '门对餐厅', item: '卫生间门正对餐厅', impact: '中', detail: '秽气冲餐桌，影响食欲和家人健康' },
    { condition: '无窗', item: '卫生间无窗（暗卫）', impact: '高', detail: '秽气湿气积聚无法排出，细菌滋生，影响健康' },
    { condition: '在走廊尽头', item: '卫生间在走廊尽头', impact: '中', detail: '秽气沿走廊扩散到各房间' },
    { condition: '地面偏高', item: '卫生间地面高于其他房间', impact: '中', detail: '秽气湿气流向他处，不利整体风水' },
    { condition: '在文昌位', item: '卫生间在文昌位', impact: '中', detail: '污秽文昌，不利读书学习和考试运' },
  ],
};

// 2.4 卧室
export const BEDROOM_RULES = {
  strengths: [
    { condition: '方正', item: '卧室方正，面积适中（10-25㎡）', impact: '高', detail: '气场稳定，利于睡眠和健康' },
    { condition: '在吉位', item: '卧室在吉位（生气/延年/天医位）', impact: '高', detail: '安床吉位，睡眠安稳，运势提升' },
    { condition: '床头靠墙', item: '床头靠实墙', impact: '高', detail: '有靠山，睡眠安稳有安全感' },
    { condition: '主卧>次卧', item: '主卧室大于小孩房', impact: '中', detail: '主次分明，家庭关系和谐' },
    { condition: '在客厅后方', item: '卧室在客厅后方', impact: '中', detail: '前厅后卧，动静有序，隐私好' },
  ],
  weaknesses: [
    { condition: '横梁压床', item: '横梁压床', impact: '高', detail: '横梁所压位置对应身体部位受影响：压头头痛、压胸胸闷、压脚脚疾' },
    { condition: '床头靠窗', item: '床头靠窗', impact: '中', detail: '无靠山，易犯小人，睡眠不安' },
    { condition: '床头靠卫墙', item: '床头靠卫生间墙面', impact: '中', detail: '湿秽之气入头，影响睡眠和头部健康' },
    { condition: '过大', item: '卧室过大（>30㎡）', impact: '中', detail: '吸人气，阳气不足，容易疲劳' },
    { condition: '过小', item: '卧室过小（<8㎡）', impact: '中', detail: '压抑感重，气场闭塞' },
    { condition: '门对大门', item: '卧室门正对大门', impact: '高', detail: '隐私全无，一进门就见卧室，气场直冲' },
    { condition: '门对卫生间', item: '卧室门正对卫生间门', impact: '高', detail: '秽气湿气冲卧室，不利健康和感情' },
    { condition: '门对厨房', item: '卧室门正对厨房门', impact: '中', detail: '火气油烟入卧室，不利睡眠' },
    { condition: '门对镜', item: '卧室门正对镜子', impact: '中', detail: '半夜易受惊吓，精神不安' },
    { condition: '床对镜', item: '床对镜子', impact: '中', detail: '半夜醒来易受惊吓，影响睡眠质量' },
    { condition: '卧室>客厅', item: '卧室大于客厅', impact: '中', detail: '主次颠倒，社交受阻' },
    { condition: '无窗', item: '卧室无窗', impact: '高', detail: '阴气过重，空气不流通，影响健康' },
    { condition: '吊灯压床', item: '吊灯/吊扇在床正上方', impact: '中', detail: '压顶之煞，睡眠不安' },
  ],
};

// 2.5 客厅
export const LIVING_ROOM_RULES = {
  strengths: [
    { condition: '方正宽敞', item: '客厅方正宽敞，面积大于其他房间', impact: '高', detail: '明堂开阔，气场流通，家运昌隆' },
    { condition: '在前方', item: '客厅在住宅前方（进门先见厅）', impact: '高', detail: '主次有序，明堂在前，聚气纳吉' },
    { condition: '采光好', item: '客厅采光充足（明厅）', impact: '高', detail: '阳气充沛，家运兴旺' },
    { condition: '沙发靠墙', item: '沙发靠实墙', impact: '高', detail: '有靠山，家庭成员事业稳定' },
    { condition: '南北通透', item: '客厅南北通透', impact: '高', detail: '空气对流好，气场流通，舒适度高' },
    { condition: '阳台在南', item: '客厅阳台在南方或东南方', impact: '中', detail: '向阳明堂，紫气东来，采光纳吉' },
  ],
  weaknesses: [
    { condition: '在北', item: '客厅在北方', impact: '中', detail: '玄武方宜静不宜动，且北方冬冷夏热，客厅不舒适' },
    { condition: '狭长', item: '客厅狭长', impact: '中', detail: '气场直冲，不易停留聚气' },
    { condition: '不规则', item: '客厅形状不规则（多角/多边形）', impact: '中', detail: '气场紊乱，家人心态不稳定' },
    { condition: '采光差', item: '客厅采光不足（暗厅）', impact: '高', detail: '阳气不足，客厅阴冷，不利家运' },
    { condition: '沙发背门', item: '沙发背靠门窗/通道', impact: '中', detail: '无靠山，坐着不安稳，易犯小人' },
    { condition: '横梁压沙发', item: '横梁压沙发', impact: '中', detail: '坐在梁下受压，不利事业决策' },
    { condition: '厅在西北大露台', item: '客厅在西北带大露台', impact: '中', detail: '冬冷夏热，纳寒气入宅' },
    { condition: '无玄关直通', item: '客厅正对大门无玄关阻挡', impact: '中', detail: '气直入直出，客厅不聚气' },
    { condition: '厅后卧室', item: '客厅后方是卧室', impact: '低', detail: '吉。前厅后卧本是正道，若卧室门正对客厅则需注意隐私' },
  ],
};

// 2.6 阳台
export const BALCONY_RULES = {
  strengths: [
    { condition: '在南', item: '阳台在南方', impact: '高', detail: '向阳明堂，紫气东来，采光纳吉' },
    { condition: '在东南', item: '阳台在东南方', impact: '高', detail: '紫气东来，文昌旺盛' },
    { condition: '视野开阔', item: '阳台视野开阔', impact: '中', detail: '明堂开阔，纳远气入宅' },
    { condition: '客厅带阳台', item: '客厅带阳台', impact: '中', detail: '空间延伸，明堂更开阔' },
  ],
  weaknesses: [
    { condition: '在北', item: '阳台在北方', impact: '中', detail: '北风凛冽，纳寒之气入宅' },
    { condition: '主卧带阳台', item: '主卧带阳台', impact: '中', detail: '晾衣影响睡眠隐私，且卧室气外泄' },
    { condition: '杂物堆积', item: '阳台堆放杂物', impact: '低', detail: '阻碍纳气，阳台应保持整洁通畅' },
    { condition: '直通大门', item: '阳台与大门直冲', impact: '高', detail: '穿堂煞，气直进直出，不聚财' },
  ],
};

// ============================================================
// 三、户型整体优缺点判断规则
// ============================================================
export const OVERALL_STRENGTHS = {
  high: [
    { condition: '南北通透', item: '南北通透，通风采光俱佳', detail: '南北对流形成穿堂风，空气流通好，阳气充足，是住宅的上佳格局' },
    { condition: '户型方正', item: '户型方正，八卦俱全', detail: '不缺角、无突兀凹凸，各方位气场齐全，能量分布均衡' },
    { condition: '动静分区', item: '动静分区合理', detail: '卧室集中在一侧，客厅餐厅在另一侧，活动区与休息区互不干扰' },
    { condition: '全明设计', item: '全明设计，无暗间', detail: '所有房间均有窗户采光，阳气充沛，无阴湿角落' },
    { condition: '有玄关', item: '大门有玄关缓冲', detail: '藏风聚气，隐私性好，入门气场平稳过渡' },
  ],
  medium: [
    { condition: '干湿分离', item: '卫生间干湿分离', detail: '湿气不外溢，使用更健康舒适' },
    { condition: '厨房带阳台', item: '厨房带工作阳台', detail: '通风好，油烟及时排出，动线合理' },
    { condition: '主卧套间', item: '主卧带独立卫生间/衣帽间', detail: '功能完备，主次分明' },
    { condition: '面宽大', item: '客厅面宽充足', detail: '采光面大，阳气充沛' },
    { condition: '进深合理', item: '户型进深比合理', detail: '采光与通风平衡，不深不浅' },
  ],
  low: [
    { condition: '双阳台', item: '双阳台设计（生活+休闲）', detail: '功能分区合理，晾衣与休闲互不干扰' },
    { condition: '明厨明卫', item: '厨房和卫生间均有窗户', detail: '油烟湿气及时排出' },
    { condition: '客餐一体', item: '客厅餐厅一体化但分区明确', detail: '空间感大，使用灵活' },
  ],
};

export const OVERALL_WEAKNESSES = {
  severe: [
    { condition: '厕占中宫', item: '卫生间在房屋中央', detail: '最严重的格局问题。秽气四散全宅，影响全家健康和运势' },
    { condition: '穿堂煞', item: '大门直通阳台/窗户（穿堂煞）', detail: '前通后通、人财两空，气直进直出不聚财' },
    { condition: '火烧天门', item: '厨房在西北方（火烧天门）', detail: '乾为天属金，厨房火旺克金，伤男主人事业健康' },
    { condition: '门冲电梯', item: '大门正对电梯井', detail: '开口煞，气场被电梯抽走，家运起伏不定' },
  ],
  moderate: [
    { condition: '西北缺角', item: '户型西北缺角', detail: '乾位缺失，男主人运程受压制，事业受阻' },
    { condition: '暗卫', item: '卫生间无窗（暗卫）', detail: '秽气湿气积聚，细菌滋生' },
    { condition: '暗厨', item: '厨房无窗（暗厨）', detail: '油烟难散，火气积聚' },
    { condition: '门冲卫生间', item: '大门/卧室门正对卫生间门', detail: '秽气冲门，影响健康和睡眠' },
    { condition: '横梁压床', item: '卧室横梁压床', detail: '横梁所压之处对应身体部位问题' },
    { condition: '严重缺角', item: '户型严重缺角（某宫缺>20%）', detail: '缺角方位对应的家族成员和身体部位受影响' },
    { condition: '大门对厨房', item: '开门见灶', detail: '钱财多耗，火气冲门' },
    { condition: '客厅在北', item: '客厅在北方', detail: '北方宜静不宜动，客厅主"动"在北则背反' },
  ],
  minor: [
    { condition: '轻度缺角', item: '户型有轻度缺角', detail: '缺角<10%为微缺，影响较小但需注意' },
    { condition: '门对门', item: '卧室门对卧室门', detail: '口舌之争，家庭不睦' },
    { condition: '无玄关', item: '入户无玄关', detail: '开门见厅，气无缓冲' },
    { condition: '走道过长', item: '室内走道过长', detail: '浪费面积且气场直冲' },
    { condition: '主卧带阳台', item: '主卧带阳台', detail: '晾衣影响私密性，卧室气外泄' },
    { condition: '有暗间', item: '有暗间（无窗房间）', detail: '该房间阴气重，不利健康' },
    { condition: '进深过大', item: '户型进深过大（>2:1）', detail: '中间采光差，气场不通畅' },
  ],
};

// ============================================================
// 四、形煞辨别规则
// ============================================================
export const SHA_RULES = [
  { type: '路冲煞', condition: '道路笔直正对大门/窗户', severity: '高', effect: '血光意外、破财官非、家人不宁' },
  { type: '反弓煞', condition: '道路/河流弯道弓背朝宅', severity: '高', effect: '破财散财、感情不和、投资失利' },
  { type: '天斩煞', condition: '两高楼之间狭窄缝隙正对住宅', severity: '高', effect: '重病、手术、血光之灾' },
  { type: '剪刀煞', condition: '多条道路交叉如剪刀口', severity: '高', effect: '破财损丁、意外灾祸' },
  { type: '尖角煞', condition: '邻楼尖角/墙角正对门窗', severity: '中', effect: '神经痛、眼疾、口舌是非' },
  { type: '壁刀煞', condition: '邻楼侧面直切自家', severity: '中', effect: '意外伤灾、财运受挫' },
  { type: '穿心煞', condition: '建筑下方有地道/沟渠穿过', severity: '中', effect: '运势反复、心脏问题' },
  { type: '白虎抬头', condition: '右侧建筑明显高于左侧', severity: '中', effect: '女强男弱、阴盛阳衰、口舌' },
  { type: '割脚煞', condition: '道路/水流紧贴楼基', severity: '中', effect: '财运不稳、根基动摇' },
  { type: '孤阳煞', condition: '独栋高楼四面空旷', severity: '中', effect: '孤寡无依、性格孤僻' },
  { type: '开口煞', condition: '电梯门正对住宅门', severity: '中', effect: '运势外泄、意外伤害' },
  { type: '探头煞', condition: '屋后更高建筑凸出一块', severity: '低', effect: '犯小人、易遭盗贼' },
  { type: '声煞', condition: '持续噪音污染（马路/工地等）', severity: '低', effect: '精神紧张、失眠焦虑' },
  { type: '光煞', condition: '玻璃幕墙反光/霓虹灯直射', severity: '低', effect: '精神不佳、脾气急躁、眼疾' },
];

// ============================================================
// 五、玄空飞星组合（33则精选）
// ============================================================
export const FLYING_STAR_COMBOS = {
  '1-6': { judgment: 'great_auspicious', name: '一六共宗', detail: '科名文采，发甲出秀，金水相生富贵格' },
  '6-1': { judgment: 'great_auspicious', name: '一六共宗', detail: '科名文采，发甲出秀，金水相生富贵格' },
  '1-4': { judgment: 'great_auspicious', name: '一四同宫', detail: '文昌科名，文章发秀，大利学业考试' },
  '4-1': { judgment: 'great_auspicious', name: '一四同宫', detail: '文昌科名，文章发秀，大利学业考试' },
  '1-8': { judgment: 'auspicious', name: '一八为朋', detail: '丁财两旺，土水相克但调和可解' },
  '8-1': { judgment: 'auspicious', name: '一八为朋', detail: '丁财两旺，土水相克但调和可解' },
  '2-6': { judgment: 'auspicious', name: '二六共宗', detail: '财利丰足，田宅致富' },
  '6-2': { judgment: 'auspicious', name: '二六共宗', detail: '财利丰足，田宅致富' },
  '2-8': { judgment: 'auspicious', name: '二八合十', detail: '田产致富，土土比和' },
  '8-2': { judgment: 'auspicious', name: '二八合十', detail: '田产致富，土土比和' },
  '3-8': { judgment: 'auspicious', name: '三八为朋', detail: '当运丁财两旺，木土相克需看运' },
  '8-3': { judgment: 'auspicious', name: '三八为朋', detail: '当运丁财两旺，木土相克需看运' },
  '3-9': { judgment: 'auspicious', name: '三九为友', detail: '木火通明，生聪明之子，文贵之象' },
  '9-3': { judgment: 'auspicious', name: '三九为友', detail: '木火通明，生聪明之子，文贵之象' },
  '4-9': { judgment: 'auspicious', name: '四九为友', detail: '木火相生，发富发贵，文章盖世' },
  '9-4': { judgment: 'auspicious', name: '四九为友', detail: '木火相生，发富发贵，文章盖世' },
  '6-8': { judgment: 'great_auspicious', name: '六八共宗', detail: '富贵双全，土金相生，家业兴旺' },
  '8-6': { judgment: 'great_auspicious', name: '六八共宗', detail: '富贵双全，土金相生，家业兴旺' },
  '7-8': { judgment: 'auspicious', name: '七八合十', detail: '当运财富丰盈，失运需注意' },
  '8-7': { judgment: 'auspicious', name: '七八合十', detail: '当运财富丰盈，失运需注意' },
  '8-9': { judgment: 'great_auspicious', name: '八九为友', detail: '喜庆之事连连，火土相生' },
  '9-8': { judgment: 'great_auspicious', name: '八九为友', detail: '喜庆之事连连，火土相生' },
  '2-5': { judgment: 'great_inauspicious', name: '二五交加', detail: '疾病死亡，损主重病，多灾多难（最凶组合）' },
  '5-2': { judgment: 'great_inauspicious', name: '二五交加', detail: '疾病死亡，损主重病，多灾多难（最凶组合）' },
  '3-7': { judgment: 'great_inauspicious', name: '三七蚩尤', detail: '蚩尤煞，劫盗官非，争斗受伤' },
  '7-3': { judgment: 'great_inauspicious', name: '三七蚩尤', detail: '蚩尤煞，劫盗官非，争斗受伤' },
  '6-7': { judgment: 'great_inauspicious', name: '六七交剑', detail: '交剑煞，斗争刑伤，口舌官非' },
  '7-6': { judgment: 'great_inauspicious', name: '六七交剑', detail: '交剑煞，斗争刑伤，口舌官非' },
  '7-9': { judgment: 'inauspicious', name: '七九回禄', detail: '回禄之灾，火灾风险，火金相战' },
  '9-7': { judgment: 'inauspicious', name: '七九回禄', detail: '回禄之灾，火灾风险，火金相战' },
  '2-3': { judgment: 'inauspicious', name: '二三斗牛', detail: '斗牛煞，官非争执，婆媳不和' },
  '3-2': { judgment: 'inauspicious', name: '二三斗牛', detail: '斗牛煞，官非争执，婆媳不和' },
  '9-6': { judgment: 'inauspicious', name: '九六火金', detail: '火烧天门，头痛伤老父，火克金' },
  '6-9': { judgment: 'inauspicious', name: '九六火金', detail: '火烧天门，头痛伤老父，火克金' },
  '5-7': { judgment: 'inauspicious', name: '五七为凶', detail: '疫病中毒，口舌是非缠绕' },
  '7-5': { judgment: 'inauspicious', name: '五七为凶', detail: '疫病中毒，口舌是非缠绕' },
};

// ============================================================
// 六、九星基本属性
// ============================================================
export const FLYING_STARS = {
  1: { name: '一白贪狼', element: '水', person: '中男', auspicious: '文昌官星、聪慧有智', inauspicious: '淫荡耳病' },
  2: { name: '二黑巨门', element: '土', person: '老母', auspicious: '医家殡仪大利', inauspicious: '病符寡妇' },
  3: { name: '三碧禄存', element: '木', person: '长男', auspicious: '权威声势', inauspicious: '官非盗贼' },
  4: { name: '四绿文曲', element: '木', person: '长女', auspicious: '文昌科甲', inauspicious: '桃花溺酒色' },
  5: { name: '五黄廉贞', element: '土', person: '皇极', auspicious: '（极凶无吉）', inauspicious: '大病死亡（最凶）' },
  6: { name: '六白武曲', element: '金', person: '老父', auspicious: '官贵权威', inauspicious: '孤独官非' },
  7: { name: '七赤破军', element: '金', person: '少女', auspicious: '口才演艺', inauspicious: '盗贼口舌火灾' },
  8: { name: '八白左辅', element: '土', person: '少男', auspicious: '财星富贵', inauspicious: '不利小童' },
  9: { name: '九紫右弼', element: '火', person: '中女', auspicious: '喜事姻缘', inauspicious: '眼疾火灾' },
};

// ============================================================
// 七、八宅大游年规则
// ============================================================
export const EIGHT_HOUSE_TYPES = {
  eastFour: ['震', '巽', '离', '坎'],
  westFour: ['乾', '坤', '艮', '兑'],
};

export const GREAT_YEAR_STAR_RANK = {
  '生气': { level: 'great_auspicious', type: '吉', element: '木', star: '贪狼', detail: '财运事业，大吉之星' },
  '延年': { level: 'auspicious', type: '吉', element: '金', star: '武曲', detail: '长寿婚姻，中吉之星' },
  '天医': { level: 'auspicious', type: '吉', element: '土', star: '巨门', detail: '健康财富，次吉之星' },
  '伏位': { level: 'neutral_good', type: '平', element: '木', star: '辅弼', detail: '稳定平和，小吉之星' },
  '六煞': { level: 'inauspicious', type: '凶', element: '水', star: '文曲', detail: '破财桃花，小凶之星' },
  '祸害': { level: 'inauspicious', type: '凶', element: '土', star: '禄存', detail: '纠纷疾病，中凶之星' },
  '五鬼': { level: 'great_inauspicious', type: '凶', element: '火', star: '廉贞', detail: '口舌破财，次凶之星' },
  '绝命': { level: 'great_inauspicious', type: '凶', element: '金', star: '破军', detail: '灾厄意外，大凶之星' },
};

// ============================================================
// 八、穿堂煞判断参数
// ============================================================
export const CHUANTANG_SHA_CONFIG = {
  minDistance: 5,         // 门窗最小距离（米）
  severeDistance: 10,     // 超过此距离为严重穿堂煞
  requireAligned: true,   // 必须在同一直线上
  requireNoObstruction: true, // 中间无实体阻隔
};

export default {
  CORNER_MEANINGS,
  DOOR_RULES,
  KITCHEN_RULES,
  BATHROOM_RULES,
  BEDROOM_RULES,
  LIVING_ROOM_RULES,
  BALCONY_RULES,
  OVERALL_STRENGTHS,
  OVERALL_WEAKNESSES,
  SHA_RULES,
  FLYING_STAR_COMBOS,
  FLYING_STARS,
  EIGHT_HOUSE_TYPES,
  GREAT_YEAR_STAR_RANK,
  CHUANTANG_SHA_CONFIG,
};
