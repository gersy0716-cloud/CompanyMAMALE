import OpenAI from "openai";
import { MODEL_TEXT_LOGIC, MODEL_IMAGE_GEN, STYLE_PROMPTS, NARRATION_STYLES, COPYWRITING_STYLES } from "../constants";
import { Slide, PresentationSettings } from "../types";
import globalConfig from '../utils/globalConfig';

/**
 * Convert foreign image URL to Aliyun URL
 * @param url - The original image URL
 * @returns The converted Aliyun URL
 */
const convertUrlToAliyun = async (url: string): Promise<string> => {
  // 如果已经是阿里云地址，直接返回
  if (url.startsWith('https://s.mamale.vip')) {
    console.log('图片已经是阿里云地址，无需转换');
    return url;
  }

  console.log('=== 开始转换图片URL到阿里云 ===');
  console.log('原始URL:', url);

  const apiUrl = globalConfig.getApiUrl('/app/zjAi/myConvertUrl');
  const apiToken = globalConfig.getToken() || '';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({ url })
    });

    console.log('转换API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('转换失败响应:', errorText);
      throw new Error(`URL转换失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('转换成功，返回数据:', result);

    const convertedUrl = result.url;
    if (!convertedUrl) {
      console.error('无法从响应中提取转换后的URL:', result);
      throw new Error('转换成功但未返回URL');
    }

    console.log('✅ URL转换成功:', convertedUrl);
    return convertedUrl;

  } catch (error) {
    console.error('URL转换错误:', error);
    // 转换失败时返回原URL，不阻断流程
    console.warn('⚠️ URL转换失败，使用原始URL');
    return url;
  }
};

/**
 * Generate slide image using async API (for TuZiAsync provider)
 * Creates a task and polls for completion
 * @param slide - The slide to generate
 * @param style - Style prompt
 * @param model - Model name (e.g., 'gemini-3-pro-image-preview-async')
 * @param timeout - Request timeout in milliseconds (default: 150000ms = 150s)
 * @param abortController - Optional external AbortController for cancellation
 */
const generateSlideImageAsync = async (
  slide: Slide,
  style: string,
  model: string = 'gemini-3-pro-image-preview-async',
  timeout: number = 150000,
  abortController?: AbortController
): Promise<string> => {
  console.log('=== 开始异步生成图片 ===');
  console.log('时间戳:', new Date().toISOString());
  console.log('幻灯片标题:', slide.title);
  console.log('模型:', model);

  // Construct a prompt for image generation
  const visualPrompt = `
    设计一张专业的演示文稿幻灯片 (PPT Slide)。

    幻灯片标题: "${slide.title}"
    幻灯片内容: "${slide.content}"

    设计指令:
    ${slide.visualPrompt}

    重要要求:
    - 图片看起来必须像一张完成度极高的PPT页面。
    - 清晰地在页面顶部渲染标题 (中文)。
    - 在页面主体部分清晰可读地渲染主要内容要点 (中文)。
    - 保持高分辨率，专业排版。
    - 宽高比: 16:9。
    - 确保设计风格与描述严格一致。
  `;

  const apiToken = globalConfig.getToken() || '';
  const createTaskUrl = globalConfig.getApiUrl('/app/tuZi/asyncImageCreateMy');

  console.log('=== 异步图片生成API配置 ===');
  console.log('创建任务URL:', createTaskUrl);
  console.log('Token长度:', apiToken ? apiToken.length : 0);
  console.log('模型:', model);

  // Setup timeout control
  const controller = abortController || new AbortController();
  const startTime = Date.now();

  try {
    // Step 1: Create async task
    console.log('步骤1: 创建异步任务...');
    const createResponse = await fetch(createTaskUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        model: model,
        prompt: visualPrompt,
        size: '16:9'
      })
    });

    console.log('创建任务响应状态:', createResponse.status, createResponse.statusText);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('创建任务失败响应:', errorText);
      throw new Error(`创建任务失败 (${createResponse.status}): ${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log('创建任务成功，返回数据:', createResult);

    const taskId = createResult.taskId;
    if (!taskId) {
      console.error('无法从响应中提取任务ID:', createResult);
      throw new Error('创建任务成功但未返回任务ID');
    }

    console.log('✅ 任务创建成功，任务ID:', taskId);

    // Step 2: Poll for task completion
    console.log('步骤2: 轮询任务状态...');
    const queryUrl = globalConfig.getApiUrl(`/app/tuZi/asyncImageQueryMy/${taskId}`);
    let imageUrl = '';
    let pollCount = 0;
    const maxPolls = 120; // 最多轮询120次（因为接口需要排队，增加一倍）
    const pollInterval = 5000; // 每5秒轮询一次

    while (pollCount < maxPolls) {
      // Check if aborted
      if (controller.signal.aborted) {
        throw new Error('AbortError');
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`异步图片生成超时: 请求超过 ${timeout / 1000} 秒未完成`);
      }

      pollCount++;
      console.log(`轮询第 ${pollCount} 次...`);

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const queryResponse = await fetch(queryUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      console.log('查询任务响应状态:', queryResponse.status, queryResponse.statusText);

      if (!queryResponse.ok) {
        const errorText = await queryResponse.text();
        console.error('查询任务失败响应:', errorText);
        throw new Error(`查询任务失败 (${queryResponse.status}): ${errorText}`);
      }

      const queryResult = await queryResponse.json();
      console.log('查询任务返回数据:', queryResult);

      const { status, progress, video_url, isSucess } = queryResult;

      console.log(`任务状态: ${status}, 进度: ${progress}%, 成功: ${isSucess}`);

      if (status === 'completed' && isSucess && video_url) {
        imageUrl = video_url;
        console.log('✅ 任务完成，图片URL:', imageUrl);
        break;
      } else if (status === 'failed' || (status === 'completed' && !isSucess)) {
        throw new Error('异步图片生成失败: 任务状态为失败');
      }
    }

    if (!imageUrl) {
      throw new Error('异步图片生成超时: 超过最大轮询次数');
    }

    // 转换URL到阿里云（如果需要）
    const convertedUrl = await convertUrlToAliyun(imageUrl);

    console.log('=== 异步图片生成完成 ===');
    return convertedUrl;

  } catch (error) {
    console.error("Error generating slide image async:", error);

    // Handle abort error
    if ((error as Error).message === 'AbortError' || (error as Error).name === 'AbortError') {
      throw new Error(`异步图片生成已中止`);
    }

    throw new Error("异步图片生成失败: " + (error as Error).message);
  }
};

// Initialize OpenAI client with custom base URL
const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://dalu.chatgptten.com/v1',
  dangerouslyAllowBrowser: true // 允许在浏览器中使用
});

/**
 * Generates an outline of slides based on the input text and settings.
 */
export const generateOutline = async (
  text: string,
  settings: PresentationSettings
): Promise<Omit<Slide, 'status'>[]> => {
  const client = getOpenAI();

  // 获取风格描述：如果是自定义风格，使用customStylePrompt，否则使用预定义的STYLE_PROMPTS
  const styleDescription = settings.style === 'custom' && settings.customStylePrompt
    ? settings.customStylePrompt
    : STYLE_PROMPTS[settings.style];

  // 获取风格名称：如果是自定义风格，使用customStyleName，否则使用style
  const styleName = settings.style === 'custom' && settings.customStyleName
    ? settings.customStyleName
    : settings.style;

  // 获取口播风格提示词
  const narrationStylePrompt = settings.enableVoice && settings.narrationStyle
    ? NARRATION_STYLES[settings.narrationStyle as keyof typeof NARRATION_STYLES]?.prompt || ''
    : '';

  // 获取文案风格提示词（可多选）
  const copywritingStylePrompts = settings.enableVoice && settings.copywritingStyles && settings.copywritingStyles.length > 0
    ? settings.copywritingStyles.map(s => {
        const style = COPYWRITING_STYLES[s as keyof typeof COPYWRITING_STYLES];
        return style ? `【${style.name}】${style.prompt}` : '';
      }).filter(Boolean).join('\n')
    : '';

  // 根据 AI 模式选择不同的系统提示词
  let systemPrompt: string;
  let userPrompt: string;

  if (settings.aiMode === 'rayleigh') {
    // 雷老师教学认知引擎模式
    systemPrompt = `你是由猫叔设计的【K12全域认知架构引擎】。你不是简单的PPT生成器，而是基于"第一性原理"的教学设计专家。

# 核心理念
1. **拒绝模板**：严禁套用"导入-讲解-练习-总结"等万能公式，除非它确实最适合当前知识点
2. **结构优先**：内容必须具有高度的层级感和逻辑闭环
3. **证据导向**：所有设计决策基于教材逻辑、课程标准或认知心理学原理
4. **可视化思维**：在内容描述中融入图表、流程图或思维导图的文字说明

# 工作流程（内部执行，不输出诊断）
## 第一步：知识拓扑分析
从教学材料中识别：
- 学科类型（语文/数学/英语/物理/化学/生物/历史/地理/政治/音乐/体育/美术等）
- 知识点名称（自动提取核心概念）
- 知识维度：
  * **事实类**（如"光合作用方程式"）→ 策略：记忆编码 + 图示化
  * **概念类**（如"民主制度定义"）→ 策略：属性抽象 + 正反例对比
  * **程序类**（如"解方程步骤"）→ 策略：算法可视化 + SOP化
  * **元认知类**（如"学习方法"）→ 策略：策略演示 + 反思引导

## 第二步：学科属性锚定
- **强逻辑学科（数/理/化/生）**：核心机制是消元、转化、守恒、因果推导
  → 策略：步骤规范化、错误预演、量化验证
- **强叙事学科（史/文/政）**：核心机制是时空观、共情、批判性思维、多元视角
  → 策略：情境重现、关键提问串、观点碰撞
- **强技能学科（音/体/美）**：核心机制是感知训练、肌肉记忆、创造性表达
  → 策略：示范-模仿-反馈、限制性练习、多维评价

## 第三步：策略架构（根据分析结果选择）
**程序性知识示例**：痛点场景引入 → 算法拆解(流程图文字描述) → 易错点辨析 → 变式训练 → 元认知反思
**概念性知识示例**：原型展示 → 属性抽象 → 正反例辨析 → 概念迁移 → 应用场景
**技能性知识示例**：感官唤醒 → 技法解构 → 限制性练习 → 自由创作 → 互评+师评

# 输出规范
- 语言风格：专业但不晦涩，避免"培养XX素养"等套话
- 内容要求：每个建议都说明"为什么"，多用动词（"让学生对比..."）
- 具体可操作：避免"加强XX"式空话
- 页数控制：严格按照目标页数生成，不超过不少于

请始终以 JSON 格式返回结果，不输出任何诊断或解释文字。`;

    userPrompt = `请运用【K12全域认知架构引擎】分析以下教学材料，并直接生成符合教学规律的PPT大纲。

# 教学材料
${text.substring(0, 30000)}
${text.length > 30000 ? '\n(材料已截断，请基于已提供内容进行设计)' : ''}

# 设计参数
- **目标页数**：${settings.targetPageCount} 页（严格控制，每页内容精练）
- **PPT风格**：${styleName}
- **内容侧重**：${settings.focus === 'summary' ? '概括摘要' : settings.focus === 'detailed' ? '详细内容' : '视觉为主'}
- **视觉风格**：${styleDescription}${settings.enableVoice ? `
- **口播风格**：${narrationStylePrompt}${copywritingStylePrompts ? `\n- **文案风格要求**：\n${copywritingStylePrompts}` : ''}` : ''}

# 执行要求
1. 自动识别学科、知识点、知识类型（不要在输出中显示分析过程）
2. 根据知识类型和学科属性，动态选择最适合的PPT结构（拒绝套用模板）
3. 每页标题体现教学环节或核心概念，内容结构化且符合认知规律
4. 视觉提示词必须融合教学情境，同时包含风格描述："${styleDescription}"${settings.enableVoice ? `
5. 语音文稿要自然流畅，适合课堂讲解，每段100-200字，体现教学节奏` : ''}

# 输出格式（JSON，不要输出其他内容）
{
  "slides": [
    {
      "title": "第1页标题",
      "content": "要点1\\n要点2\\n要点3",
      "visualPrompt": "视觉描述（必须包含：${styleDescription}）"${settings.enableVoice ? `,
      "voiceScript": "语音讲解文稿"` : ''}
    }
  ]
}`;

  } else {
    // 自由输入模式（原有逻辑）
    systemPrompt = "你是一位专业的演示文稿设计师，擅长创建结构清晰、内容丰富的教学课件。请始终以 JSON 格式返回结果。";

    userPrompt = `你是一位专业的演示文稿（PPT）设计师。
请分析以下的源文本，并创建一个结构清晰的演示文稿大纲。

限制条件:
- 目标页数: 大约 ${settings.targetPageCount} 页。
- 风格: ${styleName}
- 侧重点: ${settings.focus}

源文本:
"${text.substring(0, 30000)}"
(如果文本过长已截断)

对于每一页幻灯片，请提供：
1. 一个简洁的中文标题 (Title)。
2. 关键内容 (Content)，使用中文要点或短段落，用于在PPT上展示。
3. 具体的视觉提示词 (Visual Prompt)，用于指导AI生成背景图片。
   **重要**：视觉提示词必须包含以下风格描述以保证整套PPT设计风格统一："${styleDescription}"。
   视觉提示词应描述一个能够融合标题和内容的画面布局。可以使用中文描述。${settings.enableVoice ? `
4. 语音播放文稿 (Voice Script)，一段适合口头讲解的文字，约100-200字，详细解释该页内容。文稿应自然流畅，适合老师在课堂上讲解。
   ${narrationStylePrompt ? `**口播风格要求**: ${narrationStylePrompt}` : ''}${copywritingStylePrompts ? `\n   **文案风格要求**:\n   ${copywritingStylePrompts}` : ''}` : ''}

请以 JSON 格式返回，格式如下：
{
  "slides": [
    {
      "title": "标题",
      "content": "内容要点",
      "visualPrompt": "视觉提示词"${settings.enableVoice ? `,
      "voiceScript": "语音播放文稿"` : ''}
    }
  ]
}`;
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL_TEXT_LOGIC,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const jsonText = response.choices[0]?.message?.content;
    if (!jsonText) throw new Error("AI 未返回有效响应");

    const parsed = JSON.parse(jsonText);

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      throw new Error("AI 返回的数据格式不正确");
    }

    return parsed.slides.map((s: any, index: number) => ({
      id: `slide-${Date.now()}-${index}`,
      pageNumber: index + 1,
      title: s.title || "未命名",
      content: s.content || "",
      visualPrompt: s.visualPrompt || "",
      voiceScript: s.voiceScript || undefined
    }));

  } catch (error) {
    console.error("Error generating outline:", error);
    throw new Error("大纲生成失败: " + (error as Error).message);
  }
};

/**
 * Generates the actual slide image using custom API with SSE streaming.
 * Uses the new unified OpenAI stream endpoint with configurable provider and model.
 * @param provider - Provider name (e.g., 'TuZi')
 * @param model - Model name (e.g., 'gemini-3-pro-image-preview-2k')
 * @param timeout - Request timeout in milliseconds (default: 150000ms = 150s)
 * @param abortController - Optional external AbortController for cancellation
 */
export const generateSlideImage = async (
  slide: Slide,
  style: string,
  provider: string = 'TuZi',
  model: string = 'gemini-3-pro-image-preview-2k',
  timeout: number = 150000,
  abortController?: AbortController
): Promise<string> => {
  // 如果是兔子异步通道，使用异步生成方式
  if (provider === 'TuZiAsync') {
    return generateSlideImageAsync(slide, style, model, timeout, abortController);
  }

  console.log('=== 开始生成图片 ===');
  console.log('时间戳:', new Date().toISOString());
  console.log('幻灯片标题:', slide.title);

  // Construct a prompt for image generation
  const visualPrompt = `
    设计一张专业的演示文稿幻灯片 (PPT Slide)。

    幻灯片标题: "${slide.title}"
    幻灯片内容: "${slide.content}"

    设计指令:
    ${slide.visualPrompt}

    重要要求:
    - 图片看起来必须像一张完成度极高的PPT页面。
    - 清晰地在页面顶部渲染标题 (中文)。
    - 在页面主体部分清晰可读地渲染主要内容要点 (中文)。
    - 保持高分辨率，专业排版。
    - 宽高比: 16:9。
    - 确保设计风格与描述严格一致。
  `;

  const apiUrl = process.env.IMAGE_API_URL || 'https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream';
  const apiToken = process.env.IMAGE_API_TOKEN || '';

  console.log('=== 图片生成API配置 ===');
  console.log('URL:', apiUrl);
  console.log('Token长度:', apiToken ? apiToken.length : 0);
  console.log('Token前20字符:', apiToken ? apiToken.substring(0, 20) + '...' : '(空)');
  console.log('通道 (Provider):', provider);
  console.log('模型 (Model):', model);

  // Setup timeout control - use external controller if provided
  const controller = abortController || new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestBody = {
    provideName: provider,
    model: model,
    messages: [
      {
        role: "user",
        content: visualPrompt
      }
    ]
  };

  console.log('发送请求体:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('=== API响应 ===');
    console.log('状态码:', response.status, response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== API错误响应 ===');
      console.error('错误内容:', errorText);
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let fullContent = ''; // 累积完整的内容
    let buffer = '';

    console.log('开始解析SSE流...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('收到 [DONE] 标记');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content; // 累积内容
              console.log('累积内容片段:', content);
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn('跳过无效JSON:', data);
          }
        }
      }
    }

    console.log('完整累积内容:', fullContent);

    // 从完整内容中提取图片URL
    let imageUrl = '';
    const match = fullContent.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    if (match && match[1]) {
      imageUrl = match[1];
      console.log('提取到图片URL:', imageUrl);
    }

    if (!imageUrl) {
      console.error('未能从内容中提取到图片URL，完整内容为:', fullContent);
      throw new Error("API 未返回图片 URL");
    }

    // 转换URL到阿里云（如果需要）
    const convertedUrl = await convertUrlToAliyun(imageUrl);

    // 返回转换后的图片 URL
    return convertedUrl;

  } catch (error) {
    console.error("Error generating slide image:", error);

    // Handle abort error (timeout)
    if ((error as Error).name === 'AbortError') {
      throw new Error(`图片生成超时: 请求超过 ${timeout / 1000} 秒未完成`);
    }

    throw new Error("图片生成失败: " + (error as Error).message);
  } finally {
    // Clear timeout
    clearTimeout(timeoutId);
  }
};

/**
 * Regenerate slide image with user edits using async API (for TuZiAsync provider)
 * Creates a task and polls for completion
 * @param slide - The slide to regenerate
 * @param style - Style prompt
 * @param model - Model name (e.g., 'gemini-3-pro-image-preview-async')
 * @param uploadedImageUrl - URL of the uploaded edited image
 * @param userPrompt - Additional user prompt for modifications
 * @param timeout - Request timeout in milliseconds (default: 150000ms = 150s)
 * @param abortController - Optional external AbortController for cancellation
 */
const regenerateSlideImageWithEditAsync = async (
  slide: Slide,
  style: string,
  model: string = 'gemini-3-pro-image-preview-async',
  uploadedImageUrl: string,
  userPrompt: string = '',
  timeout: number = 150000,
  abortController?: AbortController
): Promise<string> => {
  console.log('=== 开始异步图生图重新生成 ===');
  console.log('时间戳:', new Date().toISOString());
  console.log('幻灯片标题:', slide.title);
  console.log('上传的图片URL:', uploadedImageUrl);
  console.log('用户提示词:', userPrompt);

  // Construct a prompt that includes the user's edits
  const combinedPrompt = `
    重新设计这张PPT幻灯片，保持原有的标题和内容，但根据用户的标注和要求进行修改。

    原始标题: "${slide.title}"
    原始内容: "${slide.content}"

    用户修改要求: ${userPrompt || '按照图片上的标注进行修改'}

    设计指令:
    ${slide.visualPrompt}

    重要要求:
    - 保持 16:9 宽高比
    - 根据用户在图片上的红色标注进行相应修改
    - 保持专业的PPT页面风格
    - ${userPrompt ? '特别注意：' + userPrompt : ''}
  `;

  const apiToken = globalConfig.getToken() || '';
  const createTaskUrl = globalConfig.getApiUrl('/app/tuZi/asyncImageCreateMy');

  console.log('=== 异步图生图API配置 ===');
  console.log('创建任务URL:', createTaskUrl);
  console.log('Token长度:', apiToken ? apiToken.length : 0);
  console.log('模型:', model);
  console.log('上传图片URL:', uploadedImageUrl);

  // Setup timeout control
  const controller = abortController || new AbortController();
  const startTime = Date.now();

  try {
    // Step 1: Create async task with image
    console.log('步骤1: 创建异步图生图任务...');
    const createResponse = await fetch(createTaskUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        model: model,
        prompt: combinedPrompt,
        size: '16:9',
        image_url: uploadedImageUrl  // 添加图片URL用于图生图
      })
    });

    console.log('创建任务响应状态:', createResponse.status, createResponse.statusText);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('创建任务失败响应:', errorText);
      throw new Error(`创建任务失败 (${createResponse.status}): ${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log('创建任务成功，返回数据:', createResult);

    const taskId = createResult.taskId;
    if (!taskId) {
      console.error('无法从响应中提取任务ID:', createResult);
      throw new Error('创建任务成功但未返回任务ID');
    }

    console.log('✅ 任务创建成功，任务ID:', taskId);

    // Step 2: Poll for task completion
    console.log('步骤2: 轮询任务状态...');
    const queryUrl = globalConfig.getApiUrl(`/app/tuZi/asyncImageQueryMy/${taskId}`);
    let imageUrl = '';
    let pollCount = 0;
    const maxPolls = 120; // 最多轮询120次（因为接口需要排队，增加一倍）
    const pollInterval = 5000; // 每5秒轮询一次

    while (pollCount < maxPolls) {
      // Check if aborted
      if (controller.signal.aborted) {
        throw new Error('AbortError');
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`异步图生图超时: 请求超过 ${timeout / 1000} 秒未完成`);
      }

      pollCount++;
      console.log(`轮询第 ${pollCount} 次...`);

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const queryResponse = await fetch(queryUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      console.log('查询任务响应状态:', queryResponse.status, queryResponse.statusText);

      if (!queryResponse.ok) {
        const errorText = await queryResponse.text();
        console.error('查询任务失败响应:', errorText);
        throw new Error(`查询任务失败 (${queryResponse.status}): ${errorText}`);
      }

      const queryResult = await queryResponse.json();
      console.log('查询任务返回数据:', queryResult);

      const { status, progress, video_url, isSucess } = queryResult;

      console.log(`任务状态: ${status}, 进度: ${progress}%, 成功: ${isSucess}`);

      if (status === 'completed' && isSucess && video_url) {
        imageUrl = video_url;
        console.log('✅ 任务完成，图片URL:', imageUrl);
        break;
      } else if (status === 'failed' || (status === 'completed' && !isSucess)) {
        throw new Error('异步图生图失败: 任务状态为失败');
      }
    }

    if (!imageUrl) {
      throw new Error('异步图生图超时: 超过最大轮询次数');
    }

    // 转换URL到阿里云（如果需要）
    const convertedUrl = await convertUrlToAliyun(imageUrl);

    console.log('=== 异步图生图完成 ===');
    return convertedUrl;

  } catch (error) {
    console.error("Error regenerating slide image with edit async:", error);

    // Handle abort error
    if ((error as Error).message === 'AbortError' || (error as Error).name === 'AbortError') {
      throw new Error(`异步图生图已中止`);
    }

    throw new Error("异步图生图失败: " + (error as Error).message);
  }
};

/**
 * Regenerate slide image with user edits (image-to-image).
 * Sends the uploaded edited image URL along with a prompt to generate a new version.
 * @param slide - The slide to regenerate
 * @param style - Style prompt
 * @param provider - Provider name (e.g., 'TuZi')
 * @param model - Model name
 * @param uploadedImageUrl - URL of the uploaded edited image
 * @param userPrompt - Additional user prompt for modifications
 * @param timeout - Request timeout in milliseconds (default: 150000ms = 150s)
 * @param abortController - Optional external AbortController for cancellation
 */
export const regenerateSlideImageWithEdit = async (
  slide: Slide,
  style: string,
  provider: string = 'TuZi',
  model: string = 'gemini-3-pro-image-preview-2k',
  uploadedImageUrl: string,
  userPrompt: string = '',
  timeout: number = 150000,
  abortController?: AbortController
): Promise<string> => {
  // 如果是兔子异步通道，使用异步生成方式
  if (provider === 'TuZiAsync') {
    return regenerateSlideImageWithEditAsync(slide, style, model, uploadedImageUrl, userPrompt, timeout, abortController);
  }

  console.log('=== 开始图生图重新生成 ===');
  console.log('时间戳:', new Date().toISOString());
  console.log('幻灯片标题:', slide.title);
  console.log('上传的图片URL:', uploadedImageUrl);
  console.log('用户提示词:', userPrompt);

  // Construct a prompt that includes the user's edits
  const combinedPrompt = `
    重新设计这张PPT幻灯片，保持原有的标题和内容，但根据用户的标注和要求进行修改。

    原始标题: "${slide.title}"
    原始内容: "${slide.content}"

    用户修改要求: ${userPrompt || '按照图片上的标注进行修改'}

    设计指令:
    ${slide.visualPrompt}

    重要要求:
    - 保持 16:9 宽高比
    - 根据用户在图片上的红色标注进行相应修改
    - 保持专业的PPT页面风格
    - ${userPrompt ? '特别注意：' + userPrompt : ''}
  `;

  const apiUrl = process.env.IMAGE_API_URL || 'https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream';
  const apiToken = process.env.IMAGE_API_TOKEN || '';

  console.log('=== 图生图API配置 ===');
  console.log('URL:', apiUrl);
  console.log('Token长度:', apiToken ? apiToken.length : 0);
  console.log('通道 (Provider):', provider);
  console.log('模型 (Model):', model);
  console.log('上传图片URL:', uploadedImageUrl);

  // Setup timeout control - use external controller if provided
  const controller = abortController || new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestBody = {
    provideName: provider,
    model: model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: combinedPrompt
          },
          {
            type: "image_url",
            image_url: {
              url: uploadedImageUrl  // 使用上传后的图片URL
            }
          }
        ]
      }
    ]
  };

  console.log('发送图生图请求...');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('=== API响应 ===');
    console.log('状态码:', response.status, response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== API错误响应 ===');
      console.error('错误内容:', errorText);
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    console.log('开始解析SSE流...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('收到 [DONE] 标记');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              console.log('累积内容片段:', content);
            }
          } catch (e) {
            console.warn('跳过无效JSON:', data);
          }
        }
      }
    }

    console.log('完整累积内容:', fullContent);

    // 从完整内容中提取图片URL
    let imageUrl = '';
    const match = fullContent.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    if (match && match[1]) {
      imageUrl = match[1];
      console.log('提取到图片URL:', imageUrl);
    }

    if (!imageUrl) {
      console.error('未能从内容中提取到图片URL，完整内容为:', fullContent);
      throw new Error("API 未返回图片 URL");
    }

    // 转换URL到阿里云（如果需要）
    const convertedUrl = await convertUrlToAliyun(imageUrl);

    return convertedUrl;

  } catch (error) {
    console.error("Error regenerating slide image with edit:", error);

    if ((error as Error).name === 'AbortError') {
      throw new Error(`图生图超时: 请求超过 ${timeout / 1000} 秒未完成`);
    }

    throw new Error("图生图失败: " + (error as Error).message);
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Generate style description based on style name using AI.
 * @param styleName - The name of the custom style
 * @returns AI-generated style description prompt
 */
export const generateStyleDescription = async (styleName: string): Promise<string> => {
  console.log('=== 开始生成风格描述 ===');
  console.log('时间戳:', new Date().toISOString());
  console.log('风格名称:', styleName);

  const client = getOpenAI();

  const prompt = `你是一位专业的PPT设计师和视觉艺术专家。

用户想要创建一个名为"${styleName}"的PPT风格。

请为这个风格生成一段详细的视觉描述提示词，用于指导AI生成具有该风格特征的PPT幻灯片图片。

描述应该包括：
- 色彩风格（主色调、配色方案）
- 视觉元素（图形、图案、装饰）
- 排版风格（字体风格、布局特点）
- 整体氛围和感觉
- 适用场景

请参考以下优秀示例的格式和详细程度：

示例1："K12童趣卡通风格，色彩鲜艳明快（如明黄、天蓝、草绿），包含可爱的卡通插画角色（如学生、小动物），使用圆润可爱的字体，版式活泼有趣，适合幼儿园及小学低年级，能够充分吸引孩子注意力。"

示例2："模拟达芬奇手稿的视觉风格，采用褐色牛皮纸质感背景，使用深棕色或乌贼墨色线条。画面包含精密的解剖图、机械草图、镜像文字、几何图形等元素，线条细腻精准，具有文艺复兴时期的科学美学，整体风格古典神秘，充满探索精神，适合历史、科学、艺术、发明创造类课程。"

请直接返回风格描述文本，不要包含任何引号、其他解释或格式标记。长度控制在100-200字左右。`;

  console.log('使用模型:', MODEL_TEXT_LOGIC);
  console.log('提示词长度:', prompt.length);

  try {
    console.log('发送API请求...');

    const response = await client.chat.completions.create({
      model: MODEL_TEXT_LOGIC,
      messages: [
        {
          role: "system",
          content: "你是一位专业的PPT设计师和视觉艺术专家，擅长用准确的语言描述各种视觉风格。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    console.log('=== API响应成功 ===');
    console.log('响应模型:', response.model);
    console.log('完成原因:', response.choices[0]?.finish_reason);
    console.log('使用Token:', response.usage);

    const description = response.choices[0]?.message?.content?.trim();

    console.log('原始返回内容:', description);

    if (!description) {
      console.error('=== 错误：AI未返回内容 ===');
      console.error('完整响应:', JSON.stringify(response, null, 2));
      throw new Error("AI 未返回有效的风格描述");
    }

    console.log('=== 风格描述生成成功 ===');
    console.log('描述长度:', description.length);
    console.log('生成的描述:', description);

    return description;

  } catch (error: any) {
    console.error('=== 风格描述生成失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);

    // 更详细的错误信息
    if (error.response) {
      console.error('API响应错误:', error.response);
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }

    if (error.code) {
      console.error('错误代码:', error.code);
    }

    // 根据不同的错误类型提供更友好的错误信息
    let errorMessage = "风格描述生成失败";

    if (error.message.includes('API key')) {
      errorMessage = "API密钥配置错误，请检查环境变量";
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = "网络连接失败，请检查网络设置";
    } else if (error.message.includes('timeout')) {
      errorMessage = "请求超时，请稍后重试";
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = "无法连接到API服务器";
    } else if (error.status === 401) {
      errorMessage = "API认证失败，请检查密钥是否正确";
    } else if (error.status === 429) {
      errorMessage = "请求过于频繁，请稍后再试";
    } else if (error.status === 500) {
      errorMessage = "API服务器错误，请稍后重试";
    } else {
      errorMessage = `风格描述生成失败: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};
