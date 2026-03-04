/**
 * 语音合成服务 - 使用火山引擎TTS API
 */

import globalConfig from '../utils/globalConfig';

/**
 * 获取请求头（包含token）
 */
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = globalConfig.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * 提交语音合成任务
 * @param content 要合成的文本内容
 * @param format 音频格式，默认mp3
 * @param voiceType 音色类型，可选（如：BV123_streaming）
 * @returns taskId 任务ID
 */
export const submitTTSTask = async (content: string, format: string = 'mp3', voiceType?: string): Promise<string> => {
  try {
    const apiUrl = globalConfig.getApiUrl('/app/volcengine/ttsMy');

    const requestBody: any = {
      content,
      format
    };

    // 如果提供了音色类型，添加到请求体中
    if (voiceType) {
      requestBody.voiceType = voiceType;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`语音合成任务提交失败: ${response.status}`);
    }

    const data = await response.json();

    if (!data.taskId) {
      throw new Error('未获取到任务ID');
    }

    return data.taskId;
  } catch (error) {
    console.error('提交TTS任务失败:', error);
    throw new Error(`语音合成失败: ${(error as Error).message}`);
  }
};

/**
 * 查询语音合成任务结果
 * @param taskId 任务ID
 * @returns audioUrl 音频URL，如果未完成则返回null
 */
export const queryTTSResult = async (taskId: string): Promise<string | null> => {
  try {
    const apiUrl = globalConfig.getApiUrl(`/app/volcengine/queryTtsMy/${taskId}?isOss=1`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`查询语音合成结果失败: ${response.status}`);
    }

    const data = await response.json();

    // 如果有audioUrl，说明任务完成
    if (data.audioUrl) {
      return data.audioUrl;
    }

    // 任务还未完成
    return null;
  } catch (error) {
    console.error('查询TTS结果失败:', error);
    throw new Error(`查询语音合成结果失败: ${(error as Error).message}`);
  }
};

/**
 * 轮询查询语音合成结果
 * @param taskId 任务ID
 * @param maxAttempts 最大轮询次数，默认30次
 * @param interval 轮询间隔（毫秒），默认2000ms
 * @returns audioUrl 音频URL
 */
export const pollTTSResult = async (
  taskId: string,
  maxAttempts: number = 30,
  interval: number = 2000
): Promise<string> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const audioUrl = await queryTTSResult(taskId);

      if (audioUrl) {
        return audioUrl;
      }

      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      // 如果是查询错误，等待后重试
      if (attempts < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } else {
        throw error;
      }
    }
  }

  throw new Error('语音合成超时，请稍后重试');
};

/**
 * 生成语音（一站式方法）
 * @param content 要合成的文本内容
 * @param format 音频格式，默认mp3
 * @param voiceType 音色类型，可选（如：BV123_streaming）
 * @returns audioUrl 音频URL
 */
export const generateVoice = async (content: string, format: string = 'mp3', voiceType?: string): Promise<string> => {
  // 第一步：提交任务
  const taskId = await submitTTSTask(content, format, voiceType);

  // 第二步：轮询获取结果
  const audioUrl = await pollTTSResult(taskId);

  return audioUrl;
};
