/**
 * 风水问题化解方案库
 * 为常见风水缺陷提供具体可操作的化解方法
 */

const SOLUTIONS_DB = {
  // ═══ 缺角类 ═══
  '西北缺角': [
    { method: '泰山石敢当', difficulty: '简单', cost: '低', description: '在西北角地面摆放泰山石，有字的一面朝向缺角方向。直接放地上，放好就不要移动。' },
    { method: '悬挂奔马图', difficulty: '简单', cost: '低', description: '在西北方墙面挂一幅奔马图（乾卦对应骏马），尺寸适中，画面以骏马奔腾为佳。' },
    { method: '铜器摆件', difficulty: '简单', cost: '中', description: '摆放铜钟、铜马或圆形金属摆件，颜色选白色、金色或黄色，象征乾金之气。' },
    { method: '狗/猪形工艺品', difficulty: '简单', cost: '低', description: '摆放木制或陶瓷的狗形或猪形工艺品（乾卦对应狗和猪），置于西北角地面或低柜上。' },
  ],
  '西南缺角': [
    { method: '陶瓷摆件', difficulty: '简单', cost: '低', description: '在西南角摆放陶瓷花瓶、紫砂壶等土属性工艺品，陶土之气可补坤宫。' },
    { method: '羊/猴形吉祥物', difficulty: '简单', cost: '低', description: '摆放玉制或陶瓷的羊形或猴形饰物（坤卦对应羊和猴），以应坤宫之象。' },
    { method: '红色装饰', difficulty: '简单', cost: '低', description: '在西南方使用红色或紫色装饰品，如中国结、红灯笼，火生土助坤宫。' },
    { method: '山水画（以山为主）', difficulty: '简单', cost: '中', description: '在西南方挂一幅以山体为主的山水画，山为土，增强坤宫土气。' },
  ],
  '正东缺角': [
    { method: '四支富贵竹', difficulty: '简单', cost: '极低', description: '用透明水瓶水养四支富贵竹（四为震卦之数），放在正东方位，水木相生。' },
    { method: '绿色植物', difficulty: '简单', cost: '低', description: '在正东方位摆放大型绿植，如发财树、幸福树，以木补震宫之气。' },
    { method: '泰山石敢当', difficulty: '简单', cost: '低', description: '正东方位摆放泰山石，有字一面朝缺角方向。配合一对麒麟效果更佳。' },
  ],
  '东南缺角': [
    { method: '绿色植物', difficulty: '简单', cost: '低', description: '在东南方摆放阔叶绿植，如龟背竹、绿萝，巽为风木，以植物补气。' },
    { method: '鸡形摆件', difficulty: '简单', cost: '低', description: '摆放鸡形工艺品（巽卦对应鸡），材质可选陶瓷或木质。' },
    { method: '泰山石敢当', difficulty: '简单', cost: '低', description: '东南角摆放泰山石敢当，填实缺角，有字一面朝缺角方向。' },
  ],
  '正北缺角': [
    { method: '鼠形饰物', difficulty: '简单', cost: '低', description: '在正北方摆放鼠形工艺品（坎卦对应鼠），可选金属或水晶材质。' },
    { method: '泰山石敢当', difficulty: '简单', cost: '低', description: '正北方摆放泰山石敢当，补山补水，填实缺角。' },
    { method: '鱼缸或水景', difficulty: '中等', cost: '中', description: '在正北方放置小型鱼缸或流水摆件（需确保安全不漏电漏水），水助坎宫。' },
  ],
  '正南缺角': [
    { method: '马形水晶', difficulty: '简单', cost: '中', description: '摆放水晶马形饰物，马下方垫黄色或咖啡色布垫（火生土，土生金以稳固）。' },
    { method: '红色装饰', difficulty: '简单', cost: '低', description: '在正南方使用红色物品装饰，如红灯笼、红窗帘、红地毯，以火补离宫。' },
    { method: '灯饰补光', difficulty: '简单', cost: '低', description: '在正南方安装暖色灯（2700K-3000K），傍晚至睡前常开，以光补火气。' },
  ],
  '东北缺角': [
    { method: '陶瓷牧童骑牛', difficulty: '简单', cost: '低', description: '摆放陶瓷牧童骑牛摆件或牛形工艺品（艮卦对应牛），牛为土畜补艮宫。' },
    { method: '黄色/红色装饰', difficulty: '简单', cost: '低', description: '在东北方使用黄色或红色装饰，安装暖色灯常开。火生土，补旺艮宫。' },
    { method: '紫水晶洞', difficulty: '简单', cost: '中', description: '摆放紫水晶洞或紫水晶山摆件，紫水晶五行属土，可填实东北缺角。' },
  ],
  '正西缺角': [
    { method: '铜钟摆件', difficulty: '简单', cost: '低', description: '在正西方摆放一只铜钟或金属摆件，兑卦属金，以金属补兑宫之气。' },
    { method: '金属饰品', difficulty: '简单', cost: '低', description: '摆放白色或金色的金属工艺品（如金属花瓶、金属雕塑），五行属金补兑宫。' },
  ],

  // ═══ 形煞类 ═══
  '穿堂煞': [
    { method: '设置玄关或屏风（最推荐）', difficulty: '中等', cost: '中', description: '在大门与阳台/窗户之间放置不透光屏风或玄关柜。高度≥170cm，宽度大于大门宽度，实木或不透明材质，严禁镜面。' },
    { method: '高鞋柜阻隔', difficulty: '简单', cost: '低', description: '在大门内侧放置高度≥170cm的鞋柜或书柜，宽度要超过大门，柜门不要装镜子。' },
    { method: '厚重窗帘', difficulty: '简单', cost: '低', description: '在正对的阳台门或窗户加装不透光厚窗帘，平时保持拉上状态。' },
    { method: '大型绿植缓冲', difficulty: '简单', cost: '低', description: '在大门与阳台之间的直线路径上摆放高大绿植（推荐发财树、幸福树、龟背竹），需多盆排列成行形成缓冲带。' },
  ],
  '大门对卫生间门': [
    { method: '长门帘', difficulty: '简单', cost: '极低', description: '在卫生间门上挂不透光长门帘，一片式（不可对开），长度超过马桶高度，平时保持拉下。' },
    { method: '屏风隔断', difficulty: '中等', cost: '中', description: '在大门与卫生间之间放置L形屏风，使用不透明材质，形成视线阻隔。' },
    { method: '隐形门', difficulty: '装修级', cost: '高', description: '将卫生间门改为与墙面同色同质的隐形门，视觉上弱化卫生间存在感，适用于装修前。' },
    { method: '五帝钱加门帘', difficulty: '简单', cost: '极低', description: '卫生间门背后挂五帝钱一串，门外挂长门帘。平时保持卫生间门常关。' },
  ],
  '大门对厨房门': [
    { method: '设置屏风', difficulty: '中等', cost: '中', description: '在大门与厨房之间放置不透明屏风，阻断开门见灶的视线。' },
    { method: '荣华象', difficulty: '简单', cost: '低', description: '大门内侧放一对"荣华象"摆件，象头朝外，有镇宅招财之效。' },
    { method: '五帝钱', difficulty: '简单', cost: '极低', description: '在大门内侧脚垫下放一串五帝钱或六帝钱，用以镇宅化煞。' },
    { method: '厨房门挂门帘加五帝钱', difficulty: '简单', cost: '极低', description: '厨房门上挂不透光门帘，门框上挂五帝钱一串。平时保持厨房门常关。' },
  ],
  '厨房门对卫生间门': [
    { method: '两扇门都挂门帘', difficulty: '简单', cost: '极低', description: '厨房门和卫生间门都挂上不透光布帘。厨房用黄色或米色，卫生间用蓝色或灰色。' },
    { method: '各挂五帝钱', difficulty: '简单', cost: '极低', description: '两扇门背后各挂一串五帝钱，用以化解水火相冲。' },
    { method: '设置屏风', difficulty: '中等', cost: '中', description: '在两门之间放置不透明屏风，阻断水火对冲的直线路径。' },
    { method: '摆放绿植', difficulty: '简单', cost: '低', description: '在两门之间的过道摆放阔叶绿植，木元素调和水火之气。' },
    { method: '改隐形门', difficulty: '装修级', cost: '高', description: '将卫生间门改为隐形门（最彻底的已装修解法），从视觉上消除门的存在。' },
  ],
  '卧室门对卫生间门': [
    { method: '长门帘', difficulty: '简单', cost: '极低', description: '卫生间门上挂过膝不透光布帘，颜色选深色系，保持常闭状态。' },
    { method: '悬挂五帝钱', difficulty: '简单', cost: '极低', description: '卫生间门背后挂五帝钱一串，正反均可。' },
    { method: '绿植缓冲', difficulty: '简单', cost: '低', description: '在两门之间摆放阔叶绿植，既能阻隔视线又能净化空气。' },
    { method: '随手关卫生间门', difficulty: '简单', cost: '免费', description: '养成随手关闭卫生间门的习惯，这是最基础也最重要的一步。' },
  ],
  '大门对电梯': [
    { method: '设置玄关或屏风', difficulty: '中等', cost: '中', description: '在大门内侧设置屏风或玄关柜，阻隔电梯开口带来的气流直冲。' },
    { method: '开运麒麟', difficulty: '简单', cost: '中', description: '在大门内摆放一对"开运麒麟"，面朝大门外，有镇宅化煞之效。' },
    { method: '门槛下放五帝钱', difficulty: '简单', cost: '极低', description: '在门槛下或进门脚垫下放一串五帝钱，化开口煞气。' },
  ],
  '大门对楼梯': [
    { method: '屏风阻隔', difficulty: '中等', cost: '中', description: '门后设置屏风阻止内财外流。高度建议≥170cm，使用不透明材质。' },
    { method: '大叶植物', difficulty: '简单', cost: '低', description: '门内放置大叶植物引财入室，推荐发财树、金钱树等寓意吉祥的大型绿植。' },
    { method: '门槛石下放五帝钱', difficulty: '简单', cost: '极低', description: '在门槛石或进门脚垫下放五帝钱，封住退财之气。' },
    { method: '悬挂八卦凸镜（向外）', difficulty: '简单', cost: '低', description: '大门上方悬挂八卦凸镜，镜面朝外。注意：须确认不会正对邻居大门，否则易引起邻里纠纷。' },
  ],
  '穿心剑': [
    { method: '设置玄关或屏风', difficulty: '中等', cost: '中', description: '在大门内侧设玄关或屏风，越靠近大门阻挡效果越好。' },
    { method: '走廊尽头装灯', difficulty: '简单', cost: '低', description: '在走廊尽头安装长明灯，以灯光化煞，保持明亮温暖。' },
    { method: '地面铺设地毯', difficulty: '简单', cost: '低', description: '从大门到走廊铺设长形地毯（暖色为宜），引导气流由急转缓。' },
    { method: '摆放绿植', difficulty: '简单', cost: '低', description: '在走廊两侧隔段摆放绿植，分散视线减缓气流直冲之势。' },
  ],
  '路冲': [
    { method: '设置围墙或绿化带', difficulty: '中等', cost: '中', description: '在宅前设置围墙或种植茂密树丛作为缓冲屏障。' },
    { method: '凸面八卦镜', difficulty: '简单', cost: '低', description: '大门上方悬挂凸面八卦镜，镜面朝外，反射来冲之气。' },
    { method: '泰山石敢当', difficulty: '简单', cost: '低', description: '在受冲方位摆放泰山石敢当，有字一面朝向路冲方向。' },
    { method: '门前设玄关', difficulty: '中等', cost: '中', description: '入户门内设置玄关或屏风，二次缓冲化解路冲余气。' },
  ],
  '反弓煞': [
    { method: '化煞罗盘', difficulty: '简单', cost: '中', description: '在受冲方位悬挂化煞罗盘或摆放泰山石敢当。' },
    { method: '围墙或绿化', difficulty: '中等', cost: '中', description: '设置围墙或绿化带作为屏障，阻隔反弓之势。' },
    { method: '龙龟化煞', difficulty: '简单', cost: '中', description: '摆放龙龟摆件，头部朝向反弓方向，以神兽镇煞。' },
  ],
  '天斩煞': [
    { method: '厚实窗帘', difficulty: '简单', cost: '低', description: '正对缝隙的窗户加装厚重不透光窗帘，平时保持拉上。' },
    { method: '铜麒麟', difficulty: '简单', cost: '中', description: '在受冲方位（窗台或窗边）摆放一对铜麒麟，面朝天斩方向。' },
    { method: '山海镇', difficulty: '简单', cost: '低', description: '在窗边悬挂山海镇，以天地之力化煞。' },
    { method: '阔叶植物', difficulty: '简单', cost: '低', description: '在窗台摆放大型阔叶植物（发财树、龟背竹），遮挡视线缓冲煞气。' },
  ],
  '尖角煞': [
    { method: '水晶球化解', difficulty: '简单', cost: '中', description: '在尖角正对位置摆放水晶球，利用球体弧度化解尖角煞。' },
    { method: '五帝钱', difficulty: '简单', cost: '极低', description: '在受冲方位挂五帝钱或六帝钱一串。' },
    { method: '窗帘遮挡', difficulty: '简单', cost: '低', description: '正对尖角的窗户加装厚窗帘，平时拉上阻断视线。' },
    { method: '植物遮挡', difficulty: '简单', cost: '低', description: '在窗台摆放阔叶植物，用绿叶阻隔尖角带来的压迫感。' },
  ],

  // ═══ 室内格局问题 ═══
  '厕占中宫': [
    { method: '改变房间功能（最彻底）', difficulty: '装修级', cost: '高', description: '装修时将原卫生间改为杂物间或衣帽间（切勿改卧室），需保留基本管道防漏。' },
    { method: '调整马桶位置', difficulty: '装修级', cost: '中', description: '装修时将洗脸盆和马桶位置对调，让马桶偏离房屋正中心。' },
    { method: '隐形门加强排风', difficulty: '中等', cost: '中', description: '卫生间门改隐形门，安装大功率排气扇长期开启，保持空气流通。' },
    { method: '长明灯加门帘', difficulty: '简单', cost: '低', description: '卫生间内保持明亮暖光（常开），门外挂长门帘。摆放喜阴绿植（黄金葛），门后挂五帝钱。' },
    { method: '入门做好五件事', difficulty: '简单', cost: '极低', description: '①门常关 ②马桶盖常闭 ③排气扇长开 ④保持干燥 ⑤门口挂珠帘。' },
  ],
  '横梁压顶': [
    { method: '吊顶隐藏（最彻底）', difficulty: '装修级', cost: '高', description: '做平顶或假天花板，将横梁完整包入吊顶。眼不见不为煞。' },
    { method: '移动家具位置', difficulty: '简单', cost: '免费', description: '将床、沙发或灶台移开，避开横梁正下方。宁可压脚不可压头。' },
    { method: '两端挂葫芦', difficulty: '简单', cost: '极低', description: '在横梁两端各挂一个木质葫芦或铜葫芦，以葫芦化煞。' },
    { method: '五帝钱', difficulty: '简单', cost: '极低', description: '床头两侧各挂一串五帝钱或六帝钱，或挂在横梁两端。' },
    { method: '竹箫化煞', difficulty: '简单', cost: '低', description: '用红绳在梁上悬挂两只竹箫，45度角相对，箫口朝下。' },
  ],
  '暗卫': [
    { method: '大功率排气扇', difficulty: '简单', cost: '低', description: '安装大功率排气扇，每次使用后开启10分钟以上。排气管道需直通室外。' },
    { method: '明亮照明', difficulty: '简单', cost: '低', description: '安装暖色灯（3000K），保持卫生间全天明亮，以光补阳气。' },
    { method: '喜阴绿植', difficulty: '简单', cost: '低', description: '摆放绿萝、黄金葛、蕨类等喜阴植物，净化空气增加生气。' },
    { method: '干燥保持', difficulty: '简单', cost: '免费', description: '使用后擦干地面水渍，保持绝对干爽。潮湿加重阴暗的不利影响。' },
    { method: '浅色装修', difficulty: '中等', cost: '中', description: '装修时墙面地面使用白色、米白或浅灰色，增强反光让空间更明亮。' },
  ],
  '暗厨': [
    { method: '大吸力油烟机', difficulty: '简单', cost: '中', description: '安装大吸力油烟机，做完饭继续开10分钟，确保油烟彻底排出。' },
    { method: '排气扇辅助', difficulty: '简单', cost: '低', description: '加装辅助排气扇，与油烟机同时使用，增强空气流通。' },
    { method: '明亮照明加浅色装修', difficulty: '简单', cost: '低', description: '白色或米白色橱柜和墙面，充足暖光照明（4000K为宜）。' },
    { method: '绿植净化', difficulty: '简单', cost: '低', description: '摆放吊兰、绿萝等耐油烟植物，吸收油烟净化空气。' },
  ],
  '火烧天门': [
    { method: '黄色装饰', difficulty: '简单', cost: '低', description: '厨房内多用黄色或米色装饰（土泄火气、生金气），如黄色墙砖、米色台面。' },
    { method: '陶瓷摆件', difficulty: '简单', cost: '低', description: '在厨房西北角摆放陶瓷碗、紫砂壶等土属性物品，土生金护乾宫。' },
    { method: '悬挂铜葫芦', difficulty: '简单', cost: '极低', description: '在厨房西北方悬挂铜葫芦一个，铜为金补乾宫。' },
    { method: '避免红色', difficulty: '简单', cost: '免费', description: '厨房内减少红色或紫色装饰，避免火上浇油加剧火烧天门。' },
  ],
  '卧室门对卧室门': [
    { method: '挂门帘', difficulty: '简单', cost: '极低', description: '两扇门都挂上门帘，颜色选与房间色调协调的即可。' },
    { method: '常关一扇门', difficulty: '简单', cost: '免费', description: '平时至少保持一扇门关闭，防止气场互相干扰。' },
    { method: '五帝钱', difficulty: '简单', cost: '极低', description: '两门门框上各挂一串五帝钱，化解门冲。' },
    { method: '铺地毯', difficulty: '简单', cost: '低', description: '两门之间的地面铺一块地毯，引导气流由对冲变为平和。' },
  ],
  '床对镜子': [
    { method: '移开镜子或床', difficulty: '简单', cost: '免费', description: '改变镜子或床的位置，避免镜子正对床头，这是最直接的解法。' },
    { method: '布遮盖', difficulty: '简单', cost: '极低', description: '用布将镜子完全遮盖，白天用时掀开，晚上睡觉前盖好。' },
    { method: '贴磨砂膜', difficulty: '简单', cost: '低', description: '在镜面贴磨砂贴膜，降低反光度削弱镜子的反射效应。' },
    { method: '衣柜内藏', difficulty: '简单', cost: '低', description: '把镜子装在衣柜内部（柜门内侧），关上柜门即不可见，最为整洁。' },
  ],
  '客厅在北面': [
    { method: '暖色调装饰', difficulty: '简单', cost: '低', description: '客厅多用暖色（米色、橙色、浅红）装饰，平衡北方寒气。' },
    { method: '充足照明', difficulty: '简单', cost: '低', description: '增加暖光源（2700K-3000K），保持客厅明亮温暖。' },
    { method: '厚窗帘保温', difficulty: '简单', cost: '中', description: '加装厚实窗帘，冬季保暖夏季隔热，阻隔北风寒气。' },
    { method: '铺设地毯', difficulty: '简单', cost: '中', description: '地面铺设暖色厚地毯，增加温暖感，赤脚不寒。' },
  ],
  '卧室过大': [
    { method: '屏风分区', difficulty: '简单', cost: '中', description: '用屏风将大空间分隔为睡眠区加起居区，聚气不散。' },
    { method: '增加家具填满', difficulty: '简单', cost: '中', description: '增加衣柜、书桌、休闲椅让空间充实，避免空旷感导致气散。' },
    { method: '暖色调加多点照明', difficulty: '简单', cost: '低', description: '使用暖色系墙面加多光源布局，营造温馨感。' },
    { method: '布艺软装聚气', difficulty: '简单', cost: '中', description: '地毯、窗帘、床品用暖色软装，减少空旷感。' },
  ],
  '卧室过小': [
    { method: '浅色系装修', difficulty: '简单', cost: '低', description: '墙面米白或浅灰，视觉上扩展空间感。' },
    { method: '多功能家具', difficulty: '简单', cost: '中', description: '使用带储物功能的床架、嵌入式衣柜，最大化利用空间。' },
    { method: '减少杂物', difficulty: '简单', cost: '免费', description: '只留必要家具，避免拥挤感让小空间更压抑。' },
    { method: '镜面扩展（不对床）', difficulty: '简单', cost: '低', description: '在适当位置（不朝床）安装镜子，利用镜面反射扩展视觉空间。' },
  ],
  '床头靠窗': [
    { method: '移床靠墙', difficulty: '简单', cost: '免费', description: '将床移到靠实墙的位置，避免床头靠窗。床头有靠，心理安稳。' },
    { method: '厚窗帘加床头柜', difficulty: '简单', cost: '低', description: '窗边加装厚实窗帘，床头靠窗侧放一个高床头柜作为缓冲。' },
    { method: '屏风遮挡', difficulty: '简单', cost: '中', description: '在床头与窗户之间设置屏风或半高柜，形成心理上的"靠山"。' },
    { method: '高靠背床', difficulty: '简单', cost: '中', description: '使用高靠背床（高于窗台），躺下时头上有靠，心理舒适。' },
  ],
};

/**
 * 为弱点匹配解决方案
 * @param {string} itemText - 弱点的标题文本
 * @returns {Array} 1-4个解决方案
 */
// 别名映射：将规则引擎中的实际文本映射到解决方案键名
const KEY_ALIASES = {
  // 大门相关
  '阳台': '穿堂煞', '窗户': '穿堂煞', '对穿': '穿堂煞', '穿堂': '穿堂煞',
  '通后': '穿堂煞', '直进直出': '穿堂煞',
  '电梯': '大门对电梯', '楼梯': '大门对楼梯',
  '对卫生间': '大门对卫生间门', '对厕所': '大门对卫生间门',
  '对厨房': '大门对厨房门',
  '厨房与卫生间': '厨房门对卫生间门', '厨卫': '厨房门对卫生间门',
  '对卧室': '卧室门对卫生间门',
  '对长走廊': '穿心剑', '对走道': '穿心剑', '走廊': '穿心剑',
  // 厨房/卫生间
  '火烧天门': '火烧天门', '在西北方': '火烧天门',
  '暗厨': '暗厨', '无窗': null, // null = 不跳过，继续匹配
  '暗卫': '暗卫',
  '房屋中央': '厕占中宫', '中宫': '厕占中宫',
  // 卧室
  '对镜子': '床对镜子', '镜': '床对镜子',
  '横梁': '横梁压顶',
  '床头靠窗': '床头靠窗', '无靠山': '床头靠窗',
  '过大': '卧室过大', '过小': '卧室过小',
  '客厅在北': '客厅在北面', '客厅位于北方': '客厅在北面',
  // 环境
  '路冲': '路冲',
  '反弓': '反弓煞',
  '天斩': '天斩煞',
  '尖角': '尖角煞',
}

export function getSolutions(itemText) {
  // 提取括号内关键词（如"厨房无窗（暗厨）"→"暗厨"）
  const parens = []
  itemText.replace(/[（(]([^）)]+)[）)]/g, (_, m) => {
    parens.push(m); return ''
  })

  // 规范化主体
  const clean = itemText
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[正直]对/g, '对')
    .replace(/[正直]通/g, '通')
    .trim()

  // 合并主体+括号关键词用于匹配
  const full = [clean, ...parens].join(' ')

  // 1. 精确匹配
  for (const [key, solutions] of Object.entries(SOLUTIONS_DB)) {
    if (full.includes(key)) return solutions
  }

  // 2. 别名匹配
  for (const [alias, targetKey] of Object.entries(KEY_ALIASES)) {
    if (!targetKey) continue
    if (full.includes(alias) && SOLUTIONS_DB[targetKey]) {
      return SOLUTIONS_DB[targetKey]
    }
  }

  // 3. 反向长串匹配：key 的 3+ 字子串命中
  for (const [key, solutions] of Object.entries(SOLUTIONS_DB)) {
    for (let len = key.length; len >= 3; len--) {
      for (let i = 0; i + len <= key.length; i++) {
        if (full.includes(key.slice(i, i + len))) return solutions
      }
    }
  }

  // 4. 多关键词匹配（至少命中 2 个 2-char 词才采纳）
  let bestMatch = null
  let bestScore = 0
  for (const [key, solutions] of Object.entries(SOLUTIONS_DB)) {
    let hits = 0
    for (let i = 0; i + 2 <= key.length; i++) {
      if (clean.includes(key.slice(i, i + 2))) hits++
    }
    const score = hits / Math.max(1, key.length - 1)
    if (hits >= 2 && score > bestScore) {
      bestScore = score; bestMatch = solutions
    }
  }
  if (bestMatch) return bestMatch

  // 5. 兜底
  return [
    { method: '咨询专业风水师', difficulty: '中等', cost: '中', description: '当前问题建议咨询专业风水师获取针对性的个性化化解方案。' },
  ]
}

/**
 * 为 weaknesses 数组中的每条附上 solutions
 */
export function attachSolutions(weaknesses) {
  if (!weaknesses || !Array.isArray(weaknesses)) return [];
  return weaknesses.map(w => ({
    ...w,
    solutions: getSolutions(w.item || ''),
  }));
}

export default SOLUTIONS_DB;
