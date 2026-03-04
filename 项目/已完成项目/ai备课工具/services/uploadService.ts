import globalConfig from '../utils/globalConfig';
import OpenAI from 'openai';

// 获取 OpenAI 客户端（使用格谷接口）
const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://dalu.chatgptten.com/v1',
  dangerouslyAllowBrowser: true
});

/**
 * Upload an image file to the server
 * @param file - The file to upload (can be Blob or File)
 * @returns The uploaded image URL
 */
export const uploadImage = async (file: Blob | File): Promise<string> => {
  // 使用全局配置构建API地址
  const apiUrl = globalConfig.getApiUrl('/fileResouceItem/uploadUnified');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 开始上传图片 ===');
  console.log('API URL:', apiUrl);
  console.log('文件大小:', file.size, 'bytes');
  console.log('文件类型:', file.type);

  const formData = new FormData();
  formData.append('formfile', file, 'edited-image.png');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      },
      body: formData
    });

    console.log('上传响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('上传失败响应:', errorText);
      throw new Error(`图片上传失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('上传成功，返回数据:', result);

    // 根据API返回的数据结构提取图片URL
    // 可能的字段名: url, imageUrl, data.url, path 等
    const imageUrl = result.url || result.imageUrl || result.data?.url || result.path || result.data;

    if (!imageUrl) {
      console.error('无法从响应中提取图片URL:', result);
      throw new Error('上传成功但未返回图片URL');
    }

    console.log('图片上传成功，URL:', imageUrl);
    return imageUrl;

  } catch (error) {
    console.error('图片上传错误:', error);
    throw new Error('图片上传失败: ' + (error as Error).message);
  }
};

/**
 * Upload a video file to the server
 * @param file - The video file to upload (max 10MB)
 * @returns The uploaded video URL
 */
/**
 * Upload a PDF file to the server
 * @param file - The PDF file to upload
 * @returns The uploaded PDF URL
 */
export const uploadPdf = async (file: File): Promise<string> => {
  const apiUrl = globalConfig.getApiUrl('/fileResouceItem/uploadUnified');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 开始上传PDF ===');
  console.log('API URL:', apiUrl);
  console.log('文件大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('文件名:', file.name);

  const formData = new FormData();
  formData.append('formfile', file, file.name);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      },
      body: formData
    });

    console.log('上传响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('上传失败响应:', errorText);
      throw new Error(`PDF上传失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('上传成功，返回数据:', result);

    const pdfUrl = result.url || result.data?.url || result.path || result.data;

    if (!pdfUrl) {
      console.error('无法从响应中提取PDF URL:', result);
      throw new Error('上传成功但未返回PDF URL');
    }

    console.log('PDF上传成功，URL:', pdfUrl);
    return pdfUrl;

  } catch (error) {
    console.error('PDF上传错误:', error);
    throw new Error('PDF上传失败: ' + (error as Error).message);
  }
};

/**
 * Parse PDF to Markdown using AI API
 * @param pdfUrl - The URL of the uploaded PDF
 * @returns The parsed markdown content
 */
export const parsePdfToMarkdown = async (pdfUrl: string): Promise<string> => {
  const apiUrl = globalConfig.getApiUrl('/app/aiTextin/myPdfToDoMarkdown');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 开始解析PDF ===');
  console.log('API URL:', apiUrl);
  console.log('PDF URL:', pdfUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        url: pdfUrl,
        isToHtml: false
      })
    });

    console.log('解析响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('解析失败响应:', errorText);
      throw new Error(`PDF解析失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('解析成功，返回数据长度:', result.markdown?.length || 0);

    if (!result.markdown) {
      console.error('无法从响应中提取markdown:', result);
      throw new Error('PDF解析成功但未返回内容');
    }

    return result.markdown;

  } catch (error) {
    console.error('PDF解析错误:', error);
    throw new Error('PDF解析失败: ' + (error as Error).message);
  }
};

/**
 * Clean and normalize markdown content using AI
 * Converts HTML tags, removes page markers, normalizes tables to standard markdown
 * @param rawContent - The raw content from PDF parsing
 * @returns Cleaned markdown content
 */
export const cleanMarkdownWithAI = async (rawContent: string): Promise<string> => {
  const client = getOpenAI();

  console.log('=== 开始清理 Markdown 格式 ===');
  console.log('原始内容长度:', rawContent.length);

  const systemPrompt = `你是一个专业的文档格式转换专家。你的任务是将输入的文档内容转换为干净、标准的 Markdown 格式。

## 转换规则

### 1. HTML 标签转换
- 将 <table>、<tr>、<td>、<th> 等 HTML 表格标签转换为标准 Markdown 表格格式
- 将 <br> 转换为换行
- 将 <b>、<strong> 转换为 **粗体**
- 将 <i>、<em> 转换为 *斜体*
- 移除其他无意义的 HTML 标签，保留内容

### 2. 清理无用内容
- 删除页码标记，如 <!-- 1 -->、<!-- -5- -->、<!-- ■城区... --> 等 HTML 注释
- 删除多余的空行（保留最多一个空行作为段落分隔）
- 删除无意义的分隔符

### 3. 表格格式规范
将 HTML 表格转换为 Markdown 表格格式：
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |

对于合并单元格（rowspan、colspan），尽量用文字描述或拆分表示。

### 4. 标题层级
- 保持原有的标题层级结构（#、##、### 等）
- 确保标题前后有空行

### 5. 列表格式
- 无序列表使用 - 或 *
- 有序列表使用 1. 2. 3.
- 保持列表的缩进层级

### 6. 图片不保留
- 不保留 ![alt](url) 格式的图片链接

### 7. 输出要求
- 请根据自己的理解重新编写文字内容，逻辑通顺
- 只输出转换后的 Markdown 内容
- 不要添加任何解释或说明`;

  const userPrompt = `请将以下文档内容转换为干净、标准的 Markdown 格式：

${rawContent}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gemini-3-pro-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    });

    const cleanedContent = response.choices[0]?.message?.content?.trim();

    if (!cleanedContent) {
      console.warn('AI 未返回清理后的内容，使用原始内容');
      return rawContent;
    }

    console.log('清理后内容长度:', cleanedContent.length);
    console.log('=== Markdown 格式清理完成 ===');

    return cleanedContent;

  } catch (error) {
    console.error('Markdown 清理失败:', error);
    // 清理失败时返回原始内容
    console.warn('使用原始内容');
    return rawContent;
  }
};

/**
 * Upload PDF and parse to Markdown (combined function)
 * @param file - The PDF file to upload and parse
 * @returns The parsed markdown content
 */
export const uploadAndParsePdf = async (file: File): Promise<string> => {
  console.log('=== 开始上传并解析PDF ===');

  // Step 1: Upload PDF to cloud storage
  const pdfUrl = await uploadPdf(file);

  // Step 2: Parse PDF to Markdown
  const rawMarkdown = await parsePdfToMarkdown(pdfUrl);

  // Step 3: Clean and normalize markdown using AI
  const cleanedMarkdown = await cleanMarkdownWithAI(rawMarkdown);

  console.log('=== PDF上传并解析完成 ===');
  return cleanedMarkdown;
};

export const uploadVideo = async (file: File): Promise<string> => {
  // 使用全局配置构建API地址
  const apiUrl = globalConfig.getApiUrl('/fileResouceItem/uploadUnified');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 开始上传视频 ===');
  console.log('API URL:', apiUrl);
  console.log('文件大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('文件类型:', file.type);
  console.log('文件名:', file.name);

  const formData = new FormData();
  formData.append('formfile', file, file.name);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      },
      body: formData
    });

    console.log('上传响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('上传失败响应:', errorText);
      throw new Error(`视频上传失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('上传成功，返回数据:', result);

    // 根据API返回的数据结构提取视频URL
    const videoUrl = result.url || result.videoUrl || result.data?.url || result.path || result.data;

    if (!videoUrl) {
      console.error('无法从响应中提取视频URL:', result);
      throw new Error('上传成功但未返回视频URL');
    }

    console.log('视频上传成功，URL:', videoUrl);
    return videoUrl;

  } catch (error) {
    console.error('视频上传错误:', error);
    throw new Error('视频上传失败: ' + (error as Error).message);
  }
};
