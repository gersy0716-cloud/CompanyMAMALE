import globalConfig from '../utils/globalConfig';

/**
 * 创建视频生成任务
 */
export const createVideoTask = async (prompt: string, imageUrl: string): Promise<string> => {
  const apiUrl = globalConfig.getApiUrl('/app/tuZi/asyncDataCreateMy');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 创建视频生成任务 ===');
  console.log('API URL:', apiUrl);
  console.log('提示词:', prompt);
  console.log('参考图片:', imageUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        model: 'sora-2',
        prompt: prompt,
        image: imageUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('创建任务失败响应:', errorText);
      throw new Error(`创建视频任务失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('创建任务成功，返回数据:', result);

    if (!result.id) {
      console.error('响应中未找到任务ID:', result);
      throw new Error('创建任务成功但未返回任务ID');
    }

    return result.id;
  } catch (error) {
    console.error('创建视频任务错误:', error);
    throw new Error('创建视频任务失败: ' + (error as Error).message);
  }
};

/**
 * 查询视频生成任务状态
 */
export const queryVideoTask = async (taskId: string): Promise<{
  status: string;
  progress: number;
  url?: string;
  thumbnail_url?: string;
}> => {
  const apiUrl = globalConfig.getApiUrl(`/app/tuZi/asyncDataQueryMy/${taskId}`);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 查询视频任务状态 ===');
  console.log('API URL:', apiUrl);
  console.log('任务ID:', taskId);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('查询任务失败响应:', errorText);
      throw new Error(`查询视频任务失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('查询任务成功，返回数据:', result);

    return {
      status: result.status || 'unknown',
      progress: result.progress || 0,
      url: result.url,
      thumbnail_url: result.thumbnail_url
    };
  } catch (error) {
    console.error('查询视频任务错误:', error);
    throw new Error('查询视频任务失败: ' + (error as Error).message);
  }
};

/**
 * 轮询查询视频任务直到完成
 */
export const pollVideoTask = async (
  taskId: string,
  onProgress?: (progress: number) => void,
  maxAttempts: number = 100,
  intervalMs: number = 3000
): Promise<string> => {
  console.log('开始轮询视频任务，任务ID:', taskId);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`轮询第 ${attempt}/${maxAttempts} 次`);

    const taskStatus = await queryVideoTask(taskId);

    // 通知进度
    if (onProgress) {
      onProgress(taskStatus.progress);
    }

    // 检查状态
    if (taskStatus.status === 'completed') {
      if (!taskStatus.url) {
        throw new Error('任务完成但未返回视频URL');
      }
      console.log('✅ 视频生成完成！URL:', taskStatus.url);
      return taskStatus.url;
    }

    if (taskStatus.status === 'failed' || taskStatus.status === 'error') {
      throw new Error('视频生成失败');
    }

    // 等待一段时间后继续查询
    if (attempt < maxAttempts) {
      console.log(`等待 ${intervalMs / 1000} 秒后继续查询...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('视频生成超时，请稍后重试');
};
