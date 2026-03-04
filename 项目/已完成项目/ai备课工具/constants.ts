export const APP_NAME = "AI 备课工具 - 智能 PPT 生成器";

// Models - 使用第三方 API 接口
export const MODEL_TEXT_LOGIC = "gemini-3-pro-preview"; // For splitting text and outlining
export const MODEL_IMAGE_GEN = "gemini-3-pro-image-preview-2k"; // For generating slide visuals (图片生成模型，默认值)

export const DEFAULT_PAGE_COUNT = 10;

// 语音音色配置
export const VOICE_TYPES = {
  BV701_streaming: "擎苍",
  BV123_streaming: "阳光青年",
  BV120_streaming: "反卷青年",
  BV119_streaming: "通用赘婿",
  BV115_streaming: "古风少御",
  BV107_streaming: "霸气青叔",
  BV100_streaming: "质朴青年",
  BV104_streaming: "温柔淑女",
  BV004_streaming: "开朗青年",
  BV113_streaming: "甜宠少御",
  BV102_streaming: "儒雅青年"
} as const;

export type VoiceType = keyof typeof VOICE_TYPES;

// 默认音色
export const DEFAULT_VOICE_TYPE: VoiceType = "BV123_streaming"; // 阳光青年

// 讲解风格配置（原口播风格）
export const NARRATION_STYLES = {
  engaging: {
    name: "吸睛风格",
    prompt: "语音文稿需要在开场使用引人入胜的开场白，运用悬念、提问或有趣的事实来抓住听众注意力。语言要有吸引力和感染力，善用排比、对比等修辞手法，让学生一听就被吸引住。"
  },
  thoughtProvoking: {
    name: "发人深省",
    prompt: "语音文稿要引发学生深入思考，多使用启发性问题和哲理性表述。适当留白，给学生思考的空间。语言要有深度和内涵，引导学生从不同角度思考问题，培养批判性思维。"
  },
  lively: {
    name: "生动活泼",
    prompt: "语音文稿要充满活力和生机，使用口语化、轻快的表达方式。多用拟声词、感叹词，语气要热情洋溢。适合低年级学生，让学习过程充满趣味性和互动感。"
  },
  academic: {
    name: "严谨学术",
    prompt: "语音文稿要专业严谨，逻辑清晰，用词准确规范。多使用学术术语和专业表达，注重概念的准确定义和论证的严密性。适合高年级或学术性较强的内容。"
  },
  storytelling: {
    name: "故事叙述",
    prompt: "语音文稿采用讲故事的方式展开，要有完整的情节和场景描述。使用'从前''后来''最后'等叙事性词汇，让知识点融入生动的故事中，增强代入感和记忆点。"
  },
  interactive: {
    name: "互动提问",
    prompt: "语音文稿要多设置互动性问题，如'你们想想看''大家猜猜''你会怎么做'等。通过提问引导学生主动思考，营造课堂参与感，激发学生的好奇心和探索欲。"
  },
  simple: {
    name: "通俗易懂",
    prompt: "语音文稿要深入浅出，用简单明了的语言解释复杂概念。多用类比、举例的方法，避免过于专业的术语。确保每个学生都能听懂，降低理解门槛。"
  },
  motivational: {
    name: "激励鼓舞",
    prompt: "语音文稿要充满正能量和鼓励性语言，如'你一定可以''太棒了''继续加油'等。强调学习的意义和价值，激发学生的学习动力和自信心，让学生保持积极的学习态度。"
  },
  gentle: {
    name: "温柔亲切",
    prompt: "语音文稿要温和友善，语气要像朋友般亲切。多用'我们一起''让我们''小朋友们'等亲近的称呼。语速平缓，语调柔和，特别适合年幼的学生或需要耐心讲解的内容。"
  },
  humorous: {
    name: "幽默风趣",
    prompt: "语音文稿要轻松有趣，适当加入幽默元素和俏皮话。可以用比喻、双关、夸张等手法增加趣味性，但要注意分寸，不影响知识的准确传达。让学习在欢笑中进行。"
  }
} as const;

export type NarrationStyle = keyof typeof NARRATION_STYLES;

// 默认讲解风格（原口播风格）
export const DEFAULT_NARRATION_STYLE: NarrationStyle = "lively"; // 生动活泼

// 文案风格配置（可多选，影响讲解稿内容特点）
export const COPYWRITING_STYLES = {
  deepThinking: {
    name: "深度思考",
    prompt: "深入剖析底层原理，引导学生透过现象看本质，多用追问和层层递进的分析方式，培养学生的深度思维能力。"
  },
  wittyHumor: {
    name: "风趣幽默",
    prompt: "融入段子、俏皮话、谐音梗等幽默元素，让知识点更有趣味，用轻松诙谐的方式化解学习的枯燥感。"
  },
  quotable: {
    name: "金句频出",
    prompt: "提炼精辟总结句和记忆口诀，用朗朗上口的表达方式帮助学生记忆和引用，每个知识点都有一句精华总结。"
  },
  caseDriven: {
    name: "案例驱动",
    prompt: "用真实案例和生活场景引入知识点，通过具体事例增强代入感和说服力，让抽象知识变得可感可触。"
  },
  analogyAssociation: {
    name: "类比联想",
    prompt: "善用生活化比喻和跨领域类比，将抽象概念转化为学生熟悉的具象事物，降低理解门槛，增强记忆效果。"
  },
  suspenseGuide: {
    name: "悬念引导",
    prompt: "设置悬念和反转，用'你猜怎么着''结果出乎意料'等方式激发好奇心，层层揭晓答案，保持学生的注意力。"
  },
  emotionalResonance: {
    name: "情感共鸣",
    prompt: "融入情感元素和人文关怀，用共情打动学生，将知识与情感体验结合，增强感染力和学习动力。"
  },
  rigorousLogic: {
    name: "逻辑严密",
    prompt: "环环相扣的推理论证，用'因为...所以...''由此可见'等逻辑连接词串联知识点，培养学生严谨的逻辑思维能力。"
  },
  interdisciplinary: {
    name: "跨学科关联",
    prompt: "打通学科壁垒，将当前知识与其他学科领域巧妙关联，拓展学生视野，培养融会贯通的综合思维能力。"
  },
  lifeOriented: {
    name: "生活化表达",
    prompt: "用日常生活场景和口语化表达拉近距离，将课堂知识与学生的日常经验紧密联系，让学习更接地气。"
  }
} as const;

export type CopywritingStyle = keyof typeof COPYWRITING_STYLES;

// 21个课件风格主题 - nanobanana 提示词
export const STYLE_PROMPTS = {
  // 原有4个风格
  playful: "K12童趣卡通风格，色彩鲜艳明快（如明黄、天蓝、草绿），包含可爱的卡通插画角色（如学生、小动物），使用圆润可爱的字体，版式活泼有趣，适合幼儿园及小学低年级，能够充分吸引孩子注意力。",
  chalkboard: "经典黑板教学风格，逼真的深绿色或墨黑色黑板纹理背景，文字呈现白色或彩色粉笔手写质感，配以手绘风格的粉笔简笔画图标（箭头、下划线、简单的图形），营造传统沉浸式课堂氛围，适合全学段。",
  nature: "清新自然风格，以淡雅的绿色、浅蓝色为主色调，融合树叶、云朵、水彩质感的自然元素，背景干净柔和，视觉上护眼且舒适，非常适合小学语文、思想品德、自然科学或生物课程。",
  notebook: "纸张笔记风格，背景模拟横线笔记本、方格纸或牛皮纸质感，文字采用整洁的手写风格，包含文具元素装饰（如回形针、胶带、铅笔涂鸦），像学霸笔记一样亲切，特别适合小学高年级及中学的数学、物理或英语课程。",

  // 新增17个风格
  cartoon3d: "采用3D渲染技术，呈现立体卡通角色和场景，色彩饱和度高，光影效果柔和圆润，材质具有卡通质感（非真实系），适合儿童教育和趣味性内容。画面构图活泼，角色造型夸张可爱，背景简洁但富有层次感，整体氛围轻松欢快，16:9比例，高清渲染质量。",
  oriental: "融合中国传统水墨画元素，采用留白构图法，色调以水墨黑、朱砂红、青绿为主，笔触飘逸灵动，意境深远。画面中可见山水、竹石、梅兰竹菊等传统元素，线条流畅优雅，追求神韵而非形似，具有禅意和诗意，整体风格古朴典雅，适合传统文化、国学、艺术类课程。",
  pixelgame: "8-bit或16-bit复古像素风格，方格马赛克质感明显，色彩采用早期游戏机调色板（饱和度高、对比强烈），画面简洁几何化，具有怀旧游戏感，细节用大色块表现，边缘锯齿明显但整体协调，适合游戏化教学、IT技术、创意设计类课程，充满怀旧与趣味性。",
  adventure: "采用手绘素描风格，线条粗犷自由，带有探险日记或旅行手账的质感。使用钢笔淡彩或炭笔素描技法，色调以棕褐色、灰蓝色、橄榄绿为主，画面富有动感和叙事性，常见地图元素、指南针、探险装备等符号，整体风格粗犷原始又不失细腻，适合地理、历史、户外探险类课程。",
  papercut: "模拟中国传统剪纸艺术，采用镂空剪影效果，色彩以大红、金黄、黑色为主，边缘呈现剪刀裁切的锯齿感。画面具有强烈的平面装饰性，构图对称或重复，富含吉祥寓意和民俗元素（花鸟、福字、窗花纹样），层次丰富，适合传统节日、民间艺术、手工制作类课程。",
  vintage: "模拟20世纪中期浪漫主义插画风格，色调温暖柔和（玫瑰粉、奶油黄、天鹅绒紫、薄荷绿），画面具有油画质感或彩色印刷的颗粒感。人物优雅浪漫，场景梦幻唯美，常见花卉、蕾丝、丝带等装饰元素，整体氛围怀旧温馨，适合文学、艺术、生活美学类课程。",
  comic: "日式或美式漫画分镜风格，画面分割成多个矩形格子，每格讲述故事的一个片段。线条流畅，黑白对比强烈或采用网点渲染，人物表情夸张生动，常有速度线、爆炸框、对话气泡等漫画符号，叙事性强，节奏感明显，适合故事叙述、情节教学、创意表达类课程。",
  blueprint: "模拟建筑或机械工程蓝图风格，深蓝色背景配白色或浅青色线条，采用精密的网格系统和标注符号。线条笔直精准，具有技术图纸的严谨性，常见尺寸标注、剖面图、俯视图等工程元素，整体风格理性专业，适合工程、建筑、机械、技术类课程。",
  journal: "模拟手工手账风格，采用手绘线条和水彩晕染，色彩清新淡雅（粉色系、蓝色系、绿色系），画面包含胶带装饰、贴纸元素、手写字体、涂鸦符号等。构图自由随意，富有生活气息和个人化特征，质感温暖亲切，适合生活记录、创意写作、美术手工类课程。",
  minimal: "遵循少即是多的设计原则，画面极度简洁，去除一切装饰性元素，仅保留核心信息。色彩单纯（黑白灰或单一主色），构图留白充足，几何形状规整，字体现代简洁，整体风格冷静理性，具有现代艺术感和高级感，适合设计、哲学、现代商务类课程。",
  watercolor: "采用水彩画技法，色彩透明流动，具有水渍晕染和颜料交融的自然肌理。色调柔和清新（淡粉、浅蓝、嫩绿、淡黄），边缘模糊柔和，画面充满童话感和温柔气息。常见于儿童绘本插画，适合儿童教育、文学故事、艺术鉴赏类课程，整体风格梦幻温馨。",
  cinematic: "借鉴电影视觉语言，采用电影级色彩分级（teal and orange配色常见），构图遵循三分法或黄金比例，景深明显。光影处理电影化（Rembrandt光、轮廓光等），氛围营造强烈，具有叙事性和情绪张力，质感细腻真实，适合影视分析、叙事艺术、视觉传达类课程。",
  academic: "学术论文PPT风格，采用简洁专业的排版，色彩保守正式（深蓝、灰色、白色为主），字体衬线或无衬线且易读性强。画面以图表、数据可视化、逻辑框图为主，避免过度装饰，强调信息的清晰传达，整体风格严谨专业，适合学术报告、科研汇报、商务演示。",
  davinci: "模拟达芬奇手稿的视觉风格，采用褐色牛皮纸质感背景，使用深棕色或乌贼墨色线条。画面包含精密的解剖图、机械草图、镜像文字、几何图形等元素，线条细腻精准，具有文艺复兴时期的科学美学，整体风格古典神秘，充满探索精神，适合历史、科学、艺术、发明创造类课程。",
  inkpen: "采用钢笔或针管笔绘制，线条均匀流畅，以黑色线条为主。通过线条疏密、交叉排线、点画等技法表现明暗和质感，画面黑白对比强烈，具有版画或插画的精致感。风格细腻严谨，适合建筑、设计、插画艺术、技术绘图类课程，整体呈现理性美学。",
  pencil: "模拟铅笔素描风格，线条带有铅笔特有的颗粒感和涂抹痕迹，明暗通过排线和擦拭表现。色调以灰度为主，质感柔和细腻，画面具有草图或速写的自然感。适合展示创作过程、概念草图、艺术教学，整体风格质朴真实，富有手工温度和艺术气息。",
  blackboard: "模拟传统黑板板报风格，采用深绿色或黑色黑板背景，使用白色、黄色、粉色等粉笔色彩。字体手写风格粗犷，常见粉笔笔触和擦拭痕迹，配合简单的粉笔画插图（花边、小图标、简笔画）。画面具有校园教室的怀旧感和亲切感，适合教育、校园文化、传统课堂类内容。",

  // 新增10个风格
  lego: "采用乐高积木拼搭风格，所有元素由标准乐高积木块构成，具有鲜明的凸点纹理和拼接缝隙。色彩使用乐高经典配色（鲜红、亮黄、天蓝、草绿、黑白），质感呈现塑料光泽和磨砂效果。画面充满创造力和游戏感，人物、建筑、物品均为积木拼装形态，适合儿童教育、创意搭建、STEM教育、益智游戏类课程，整体风格充满童趣和想象力。",
  ghibli: "模仿宫崎骏吉卜力工作室动画风格，采用水彩手绘质感，色彩柔和温暖，笔触细腻流畅。画面充满自然元素（天空、云朵、草地、树木），光影处理温柔梦幻，人物造型简约可爱但富有情感。构图讲究留白和意境，背景精致细腻，整体氛围治愈宁静，带有奇幻与现实交融的诗意美感，适合文学、自然、情感教育、艺术鉴赏类课程。",
  doraemon: "藤本弘《哆啦A梦》漫画风格，采用简洁圆润的线条，色彩明快饱和（以蓝白红黄为主色），人物造型Q版可爱，表情夸张生动。画面干净简洁，背景多为平涂色块，常见未来道具、日常生活场景。整体风格童真有趣，充满科幻与友情元素，适合儿童教育、科普启蒙、道德品质、想象力培养类课程。",
  vangogh: "模仿梵高后印象派油画风格，采用厚重的笔触和旋转流动的线条，色彩浓郁对比强烈（金黄、深蓝、紫罗兰、橙红）。画面充满激情和张力，星空、麦田、向日葵等元素呈现动态质感，笔触清晰可见，带有狂野的艺术感染力。整体风格热烈而富有情感，适合艺术鉴赏、美术教学、情感表达、欧洲文化类课程。",
  inkwash: "传统中国水墨画风格，采用浓淡干湿的墨色变化，注重笔墨韵味和意境表现。画面以黑白灰为主，辅以淡青、赤褐等传统色彩，大量留白营造空灵意境。线条飘逸洒脱，墨色晕染自然，常见山水、花鸟、竹石等传统题材，追求写意而非写实，具有深厚的东方哲学美学，适合国学、古诗词、传统文化、书法艺术类课程。",
  onepiece: "尾田荣一郎《海贼王》漫画风格，线条流畅夸张，人物造型极具个性和辨识度。色彩鲜艳饱和，阴影采用网点或色块处理，画面充满动感和戏剧性。构图大胆夸张，常见冒险元素（海洋、船只、宝藏、战斗场景），人物表情夸张生动，充满热血和励志氛围。适合励志教育、冒险故事、团队合作、梦想主题类课程。",
  graffiti: "街头涂鸦艺术风格，采用喷漆质感和大胆配色，线条粗犷自由，字体变形夸张。色彩对比强烈（荧光色、金属色、黑白撞色），画面充满叛逆和街头文化气息，常见标签字体、卡通人物、社会符号等元素。质感呈现喷漆颗粒和墙面纹理，整体风格年轻潮流、充满个性和创造力，适合艺术设计、流行文化、创意表达、青年教育类课程。",
  marvel: "漫威漫画美式超级英雄风格，采用鲜艳的对比色（红蓝、金红、黑黄等经典配色），线条清晰有力，肌肉线条夸张强壮。画面充满动感和力量感，常见英雄姿态、能量光效、爆炸冲击等视觉元素，阴影处理戏剧化，构图大气磅礴。整体风格热血激昂，充满正义与力量，适合英雄主题、励志教育、科幻冒险、品格培养类课程。",
  naruto: "岸本齐史《火影忍者》漫画风格，采用日式少年漫画的线条处理，人物造型帅气且具有东方忍者特色。色彩以橙蓝黑为主色调，阴影采用网点或渐变处理，画面充满速度感和战斗张力。常见忍术特效（火遁、雷遁等）、忍者装备、木叶村场景，人物表情坚毅热血，充满努力拼搏的精神内核，适合励志教育、毅力培养、日本文化、动漫艺术类课程。",
  pixar: "皮克斯3D动画风格，采用高质量3D渲染技术，色彩饱和明亮且和谐，光影处理自然真实。人物造型夸张可爱但细节丰富，材质呈现真实的物理质感（金属、布料、皮肤等），场景精致细腻。画面构图讲究景深和层次，充满温情和幽默感，整体风格温暖治愈，兼具艺术性和技术性，适合儿童教育、情感教育、动画艺术、视觉设计类课程。",

  // 新增4个风格
  mindmap: "思维导图视觉风格，采用中心辐射式树状结构，主题位于中心并向外发散分支。使用多层级线条连接（粗细递减），色彩采用分支彩虹配色或主题色系，节点呈现圆角矩形、椭圆或云朵形状。画面包含图标、关键词、简洁文字，线条可为直线或有机曲线，整体布局清晰有序，强调逻辑关系和层次结构，适合知识梳理、概念图解、头脑风暴类课程，充满思维可视化的条理美感。",
  handdrawnmap: "手绘地图插画风格，采用俯视或斜45度等距视角，线条手绘自由带有涂鸦质感。色彩温暖柔和（米黄、土橙、森林绿、天蓝），画面包含建筑简笔画、道路标识、地标图标、装饰性文字等元素。质感呈现纸张或羊皮纸纹理，常见指南针玫瑰、图例框、虚线路径等地图符号，整体风格童趣亲切，富有探索和叙事感，适合地理教学、城市文化、旅游规划、历史故事类课程。",
  japanesecomic: "日式漫画风格，采用精致的线条绘制，黑白为主或采用网点/色调渲染技法。人物造型符合日式美学（大眼、精致五官、流畅发丝），表情细腻生动，常见速度线、集中线、背景简化等漫画技法。画面可包含对话框、音效字、情绪符号（汗滴、闪光），构图讲究分镜节奏和视觉引导，整体风格细腻唯美或夸张动感，适合文学、情感教育、日本文化、创意叙事类课程。",
  cityposter: "现代城市海报设计风格，采用扁平化或2.5D等距视角，色彩鲜明对比强烈（霓虹色、撞色、渐变色）。画面包含城市建筑剪影、几何图形、现代字体排版、抽象装饰元素，构图大胆前卫，强调视觉冲击力和信息层级。质感现代简洁，常见光影效果、纹理叠加、网格系统，整体风格时尚潮流，充满都市活力，适合城市规划、现代艺术、设计、商业、流行文化类课程。",

  // 新增8个风格
  "business-simple": "全局视觉语言应体现国际顶级咨询公司的专业与稳重。配色严格锁定为深沉权威的海军蓝（#0B1F3B）背景，纯白（#FFFFFF）和微量天蓝色（#38BDF8）作为点缀。整体风格追求极致的扁平化与秩序感，拒绝多余装饰，强调信息的清晰传达。排版遵循严格的模块化网格系统，使用细线条或浅灰色色块（#E5E7EB）划分内容区域。字体应用粗壮有力的无衬线字体（如Helvetica或Roboto）作为标题，正文保持纤细清晰。图表元素为扁平化的2D矢量图形，配色单一且克制。光照环境为均匀的演播室漫射光，无明显戏剧性阴影。矢量插画风格，极高清晰度，展现严谨的商务美学，适合世界500强企业汇报场景。",
  "tech-modern": "全局视觉语言融合赛博朋克与现代SaaS产品的未来感。背景色采用深邃的午夜黑（#0B0F19），衬托前景亮度。主色调使用高饱和度的电光蓝（#00A3FF）与赛博紫（#7C3AED）进行线性渐变，营造流动的能量感。材质大量运用半透明的玻璃、发光的网格线及金属光泽的几何体。画面包含悬浮的3D几何元素（立方体、四面体、芯片结构），带有线框渲染（Wireframe）效果。排版布局倾向不对称的动态平衡，使用科技感的等宽字体。背景可隐约添加电路板纹理、二进制代码流或点阵地图。光照采用暗调环境下的自发光效果，模拟霓虹灯管和激光的辉光。Octane Render渲染风格，强调光线追踪、辉光（Bloom）效果和景深控制，呈现精细的粒子特效和充满科技张力的视觉冲击力。",
  "academic-formal": "全局视觉语言模拟高质量印刷出版物或经典论文的排版风格，传达理性、客观和知识的厚重感。画面必须铺满全屏，严禁出现书本装订线、纸张边缘、卷角、阴影或任何形式的边框。背景严格限制为米白色（#F8F7F2），模拟高级道林纸的质感。前景色仅使用纯黑（#000000）、深炭灰（#1F2937）和作为强调色的深红（#7F1D1D）或深蓝（#1E3A8A），强调色占比不超过5%。材质完全呈现为高质量的纸质印刷效果，具有细腻的纸张纹理。排版必须遵循经典版式设计原则，拥有宽阔的页边距。使用带有衬线的字体（类似Times New Roman或Garamond）体现传统与正式。视觉元素主要由精细的黑色线条框、标准的学术表格样式和黑白线稿插图组成。布局采用左右分栏或上下结构的严谨对齐方式。超高分辨率扫描件风格，强调字体的灰度抗锯齿效果和线条的锐度，如同精装学术期刊的内页，展现绝对的专业性与权威性。",
  "creative-fun": "全局视觉语言像充满活力的初创公司Pitch Deck或儿童教育应用界面。背景色使用高明度的暖黄色（#FFD54A）。配色方案极其大胆，混合使用鲜艳的活力橙（#FF6A00）、草绿（#22C55E）和天蓝（#38BDF8），形成孟菲斯（Memphis）风格的撞色效果。材质模拟手绘涂鸦、剪纸或粗糙边缘的矢量插画。画面内容包含手绘风格的插图元素，如涂鸦箭头、星星、波浪线和不规则的有机形状色块。排版上允许文字倾斜、重叠或跳跃，打破僵硬的网格。字体选用圆润可爱的圆体或手写体。角落放置拟人化的可爱物体或夸张的对话气泡。光照明亮且充满阳光感，色彩之间没有阴影，呈现彻底的扁平化。Dribbble热门插画风格，色彩鲜艳平涂，线条流畅且富有弹性，视觉上给人快乐、友好且极具亲和力的感觉。",
  "minimalist-clean": "全局视觉语言借鉴北欧设计（Scandinavian Design）和Kinfolk杂志的审美。背景色为极浅的雾霾灰（#F5F5F7）。前景色仅使用中灰色（#6B7280）和低饱和度的莫兰迪色系（如灰蓝#7A8FA6）作为微小的点缀。材质体现细腻的哑光质感，偶尔出现一点点石膏（Plaster）的微纹理。构图的核心是留白（Negative Space），留白面积应占据画面的70%以上。排版极为克制，文字字号较小，行间距宽大，使用纤细优雅的非衬线字体。视觉锚点是简单的几何线条构成的图标，布局上追求绝对的平衡。光照采用极柔和的漫反射天光，阴影非常淡且边缘模糊，营造出空气感。极简主义摄影风格，高动态范围（HDR），画面极其干净，没有任何噪点，展现出画廊般的艺术陈列感。强调少即是多的哲学，整体氛围空灵、静谧。",
  "luxury-premium": "全局视觉语言融合高端腕表广告或五星级酒店的品牌形象。背景色严格锁定为深沉的曜石黑（#0B0B0F）。前景色主要由香槟金（#F7E7CE）构成。材质必须体现昂贵的触感，核心组合为：背景呈现哑光黑天鹅绒质感，前景装饰呈现拉丝金属质感。排版采用经典的居中对齐或对称布局，强调仪式感。字体必须使用高雅的衬线体（Serif），字间距适当加宽以体现尊贵。画面中可以加入细致的金色边框线条、Art Deco风格的装饰纹样。如果有3D物体，应呈现出珠宝般的抛光质感。光照采用戏剧性的伦勃朗光或聚光灯效果，重点照亮关键元素，其余部分隐没在黑暗中。电影级写实渲染，强调材质的物理属性（PBR），特别是金属的高光反射和丝绒的漫反射细节，画面呈现奢侈品广告大片的高级质感，整体氛围神秘、高贵、独一无二。",
  "nature-fresh": "全局视觉语言旨在唤起人们对大自然、环保和健康生活的向往，类似全食超市（Whole Foods）或Aesop的品牌视觉。背景色采用柔和的米色（#EAD9C6）。配色方案取自自然界，重点使用森林绿（#14532D）和大地棕（#7A4E2D）。材质强调天然纹理，如再生纸的颗粒感和植物叶片的脉络。画面中融合真实的自然元素，主要是伸展的绿植叶片，这些元素可以作为背景装饰或前景框架。排版使用圆���亲和的字体。布局可以稍微松散，模仿自然生长的形态。阴影处理要柔和自然，避免生硬的黑色投影。光照模拟清晨穿过树叶的斑驳阳光（丁达尔效应），温暖而柔和。微距摄影风格结合3D渲染，强调植物表面的透光感（Subsurface Scattering）和自然材质的细腻纹理，画面清新淡雅，令人心旷神怡，整体氛围治愈、透气、有机。",
  "gradient-vibrant": "全局视觉语言对标现代科技独角兽公司（如Stripe或Linear）的官网视觉，呈现极光般的流动美感。背景即前景，使用全屏的弥散渐变色。配色方案采用高雅且和谐的全息色系，以深邃的宝石蓝（#2563EB）为基底，平滑过渡到紫罗兰（#7C3AED）和明亮的洋红色（#DB2777）。颜色之间如水彩般晕染，没有生硬的边界。材质锁定为磨砂玻璃（Frosted Glass）质感，让色彩看起来像是透过一层雾面屏透出来的，增加朦胧的高级感。插画使用有质感的半立体彩色设计。画面核心是缓慢流动的有机波浪形状，形态柔和自然。排版使用醒目的粗体无衬线字（Bold Sans-serif），文字颜色为纯白（#FFFFFF），确保在多彩背景上的绝对清晰度。界面元素采用玻璃拟态（Glassmorphism），即高透明度的白色圆角卡片，带有细腻的白色描边和背景模糊效果。C4D流体模拟渲染，强调丝绸般的顺滑光泽，配合轻微的噪点（Grain）增加质感，色彩饱满但不刺眼，展现流光溢彩的现代数字美学，整体氛围梦幻、通透且富有呼吸感。",

  custom: "" // 自定义风格，提示词由用户输入
};

// 风格中文显示名称
export const STYLE_NAMES: Record<string, string> = {
  playful: "童趣卡通",
  chalkboard: "黑板教学",
  nature: "清新自然",
  notebook: "笔记本纸",
  cartoon3d: "3D卡通",
  oriental: "东方美学",
  pixelgame: "像素游戏",
  adventure: "冒险手绘",
  papercut: "剪纸艺术",
  vintage: "复古浪漫",
  comic: "漫画分镜",
  blueprint: "工程蓝图",
  journal: "手账日记",
  minimal: "极简设计",
  watercolor: "水彩绘本",
  cinematic: "电影叙事",
  academic: "简约学术",
  davinci: "达芬奇",
  inkpen: "钢笔素描",
  pencil: "铅笔速写",
  blackboard: "传统黑板",
  lego: "乐高积木",
  ghibli: "吉卜力",
  doraemon: "哆啦A梦",
  vangogh: "梵高星空",
  inkwash: "水墨国风",
  onepiece: "海贼王",
  graffiti: "涂鸦街头",
  marvel: "漫威动画",
  naruto: "火影忍者",
  pixar: "皮克斯3D",
  mindmap: "思维导图",
  handdrawnmap: "手绘地图",
  japanesecomic: "日本漫画",
  cityposter: "城市海报",
  "business-simple": "简约商务",
  "tech-modern": "现代科技",
  "academic-formal": "严谨学术",
  "creative-fun": "活泼创意",
  "minimalist-clean": "极简清爽",
  "luxury-premium": "高端奢华",
  "nature-fresh": "自然清新",
  "gradient-vibrant": "渐变活力",
  custom: "自定义"
};

// 风格预览图URL配置（云存储地址 - 压缩后，200KB以内）
export const STYLE_IMAGE_URLS: Record<string, string> = {
  playful: "https://s.mamale.vip/2025/12/29/8afb4fec1a9ad664a2af3a1e77e5554b.png",
  chalkboard: "https://s.mamale.vip/2025/12/29/d77101cf83c17212ee6b3a1e77e57f9b.png",
  nature: "https://s.mamale.vip/2025/12/29/1d56518e7d98cab7fa273a1e77e52b79.png",
  notebook: "https://s.mamale.vip/2025/12/29/f08e37c257f383e6d5ac3a1e77e5597f.png",
  cartoon3d: "https://s.mamale.vip/2025/12/29/4c7ba7061f2f6376eb8e3a1e77e4a5c8.png",
  oriental: "https://s.mamale.vip/2025/12/29/b801d35e93c26f7b36433a1e77e4ac14.png",
  pixelgame: "https://s.mamale.vip/2025/12/29/4f60aa209a3ebfca22cf3a1e77e4c21f.png",
  adventure: "https://s.mamale.vip/2025/12/29/0546ae42a947ae1298b33a1e77e4c5f1.png",
  papercut: "https://s.mamale.vip/2025/12/29/1c88a6eda6b9a5840f5a3a1e77e4cb43.png",
  vintage: "https://s.mamale.vip/2025/12/29/27e684a38c42e382ad963a1e77e4dff3.png",
  comic: "https://s.mamale.vip/2025/12/29/9e5bf1dcd0e069a7d6683a1e77e53abb.png",
  blueprint: "https://s.mamale.vip/2025/12/29/48e431cb93d5b3e30f2d3a1e77e4e4f0.png",
  journal: "https://s.mamale.vip/2025/12/29/52d0bc7c8fad65b73c8f3a1e77e4f624.png",
  minimal: "https://s.mamale.vip/2025/12/29/6a323d2363aa4e346c853a1e77e505b9.png",
  watercolor: "https://s.mamale.vip/2025/12/29/becbbc172128bb89fdb73a1e77e51833.png",
  cinematic: "https://s.mamale.vip/2025/12/29/52c0c4b94f329d6ca5f03a1e77e54bf4.png",
  academic: "https://s.mamale.vip/2025/12/29/0978f9ca7a6c6832ba563a1e77e564e4.png",
  davinci: "https://s.mamale.vip/2025/12/29/740fe2c5d338b40aea153a1e77e56de8.png",
  inkpen: "https://s.mamale.vip/2025/12/29/bd32d3b3a100ff28911c3a1e77e572ff.png",
  pencil: "https://s.mamale.vip/2025/12/29/406b56cb15d0695e2f283a1e77e577b3.png",
  blackboard: "https://s.mamale.vip/2025/12/29/6217627e1a742594b07f3a1e77e4bbdc.png",
  lego: "https://s.mamale.vip/2025/12/29/330fb0fb2e8ccbf5d7953a1e77e4b460.png",
  ghibli: "https://s.mamale.vip/2025/12/29/e5234ed67d8eb7dad5ca3a1e77e4cfcb.png",
  doraemon: "https://s.mamale.vip/2025/12/29/044e5e90fc08709dc6693a1e77e4d432.png",
  vangogh: "https://s.mamale.vip/2025/12/29/070bb09618b4e9fe425f3a1e77e50a20.png",
  inkwash: "https://s.mamale.vip/2025/12/29/f14eeada852eb7b180453a1e77e511f5.png",
  onepiece: "https://s.mamale.vip/2025/12/29/b9e7430ff2348ae1057f3a1e77e523a3.png",
  graffiti: "https://s.mamale.vip/2025/12/29/693ff3735c5a8c021f5e3a1e77e527de.png",
  marvel: "https://s.mamale.vip/2025/12/29/9a30852544f6b0623a763a1e77e53355.png",
  naruto: "https://s.mamale.vip/2025/12/29/50f080a8632677ab9f273a1e77e5414d.png",
  pixar: "https://s.mamale.vip/2025/12/29/61c849f86824fc0fd8a33a1e77e5514b.png",
  mindmap: "https://s.mamale.vip/2025/12/29/c132e5b9ad4bb39608633a1e77e4ebb4.png",
  handdrawnmap: "https://s.mamale.vip/2025/12/29/d97d6e165caa1d8e28143a1e77e4f082.png",
  japanesecomic: "https://s.mamale.vip/2025/12/29/ae9af4e93e48a76773c03a1e77e4faef.png",
  cityposter: "https://s.mamale.vip/2025/12/29/f81944e2b0efeb61833b3a1e77e4dae7.png",
  "business-simple": "https://s.mamale.vip/2025/12/29/61843b7d146005c500ac3a1e77e560d5.png",
  "tech-modern": "https://s.mamale.vip/2025/12/29/98dd2fc975aa50213e273a1e77e546d2.png",
  "academic-formal": "https://s.mamale.vip/2025/12/29/40c41cbb16d26425c3423a1e77e4b065.png",
  "creative-fun": "https://s.mamale.vip/2025/12/29/9bbf28ad8775e35521603a1e77e51d4e.png",
  "minimalist-clean": "https://s.mamale.vip/2025/12/29/1893a6ec62b9794c10433a1e77e4ff8c.png",
  "luxury-premium": "https://s.mamale.vip/2025/12/29/9cb6ee250a621daaebe23a1e77e57baf.png",
  "nature-fresh": "https://s.mamale.vip/2025/12/29/6dff819251711b30edda3a1e77e56887.png",
  "gradient-vibrant": "https://s.mamale.vip/2025/12/29/a20f6e4b74828390266a3a1e77e52f7d.png"
};

// 学科分类列表
export const SUBJECTS = [
  "全部",
  "语文",
  "数学",
  "英语",
  "物理",
  "化学",
  "生物",
  "地理",
  "历史",
  "道德与法治",
  "信息技术",
  "美术",
  "音乐",
  "科学",
  "教师论文"
] as const;

export type Subject = typeof SUBJECTS[number];

// 学科与风格映射关系
export const SUBJECT_STYLE_MAP: Record<Subject, string[]> = {
  "全部": Object.keys(STYLE_PROMPTS),
  "语文": ["playful", "chalkboard", "nature", "cartoon3d", "oriental", "adventure", "papercut", "vintage", "comic", "journal", "watercolor", "cinematic", "academic", "pencil", "blackboard", "ghibli", "doraemon", "inkwash", "onepiece", "pixar", "mindmap", "handdrawnmap", "japanesecomic", "cityposter", "creative-fun", "academic-formal", "minimalist-clean", "business-simple", "custom"],
  "数学": ["playful", "chalkboard", "notebook", "cartoon3d", "pixelgame", "blueprint", "minimal", "academic", "inkpen", "blackboard", "lego", "mindmap", "academic-formal", "business-simple", "minimalist-clean", "tech-modern", "custom"],
  "英语": ["playful", "chalkboard", "notebook", "cartoon3d", "journal", "academic", "blackboard", "marvel", "pixar", "mindmap", "japanesecomic", "creative-fun", "academic-formal", "business-simple", "minimalist-clean", "custom"],
  "物理": ["chalkboard", "notebook", "blueprint", "minimal", "academic", "davinci", "inkpen", "blackboard", "mindmap", "academic-formal", "business-simple", "tech-modern", "custom"],
  "化学": ["chalkboard", "notebook", "blueprint", "minimal", "academic", "davinci", "blackboard", "mindmap", "academic-formal", "business-simple", "tech-modern", "custom"],
  "生物": ["chalkboard", "nature", "minimal", "academic", "davinci", "blackboard", "mindmap", "nature-fresh", "academic-formal", "business-simple", "custom"],
  "地理": ["chalkboard", "nature", "adventure", "academic", "blackboard", "mindmap", "handdrawnmap", "cityposter", "nature-fresh", "academic-formal", "business-simple", "custom"],
  "历史": ["chalkboard", "oriental", "adventure", "vintage", "comic", "cinematic", "academic", "davinci", "blackboard", "inkwash", "mindmap", "handdrawnmap", "japanesecomic", "academic-formal", "business-simple", "luxury-premium", "custom"],
  "道德与法治": ["chalkboard", "nature", "oriental", "papercut", "comic", "watercolor", "academic", "blackboard", "doraemon", "inkwash", "onepiece", "marvel", "naruto", "mindmap", "japanesecomic", "cityposter", "creative-fun", "academic-formal", "business-simple", "nature-fresh", "custom"],
  "信息技术": ["chalkboard", "cartoon3d", "pixelgame", "blueprint", "academic", "blackboard", "lego", "graffiti", "mindmap", "cityposter", "tech-modern", "gradient-vibrant", "academic-formal", "business-simple", "minimalist-clean", "custom"],
  "美术": ["playful", "chalkboard", "nature", "cartoon3d", "oriental", "pixelgame", "papercut", "vintage", "comic", "journal", "watercolor", "cinematic", "academic", "davinci", "inkpen", "pencil", "blackboard", "lego", "ghibli", "doraemon", "vangogh", "inkwash", "onepiece", "graffiti", "marvel", "naruto", "pixar", "mindmap", "handdrawnmap", "japanesecomic", "cityposter", "business-simple", "tech-modern", "academic-formal", "creative-fun", "minimalist-clean", "luxury-premium", "nature-fresh", "gradient-vibrant", "custom"],
  "音乐": ["playful", "chalkboard", "nature", "vintage", "watercolor", "academic", "blackboard", "ghibli", "mindmap", "japanesecomic", "creative-fun", "academic-formal", "minimalist-clean", "luxury-premium", "custom"],
  "科学": ["playful", "chalkboard", "nature", "cartoon3d", "adventure", "academic", "davinci", "blackboard", "lego", "ghibli", "doraemon", "pixar", "mindmap", "handdrawnmap", "nature-fresh", "tech-modern", "creative-fun", "academic-formal", "business-simple", "custom"],
  "教师论文": ["minimal", "academic", "blackboard", "mindmap", "business-simple", "academic-formal", "minimalist-clean", "luxury-premium", "custom"]
};