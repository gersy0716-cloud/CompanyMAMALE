import globalConfig from '../utils/globalConfig';

/**
 * 分类接口数据结构
 */
export interface Category {
  id: string;
  name: string;
  fullName: string;
  code: string;
  level: number;
  sortId: number;
  parentId: string | null;
  logo: string | null;
  lastModificationTime: string;
  creationTime: string;
  count: number;
  children: Category[];
}

/**
 * 分类列表响应数据
 */
export interface CategoryListResponse {
  totalCount: number;
  items: Category[];
}

/**
 * 保存到云端的请求参数
 */
export interface SaveToCloudRequest {
  aiApplicationCategoryId: string;
  name: string;
  converImg: string;
  pptData: string;
  isShare: boolean;
}

/**
 * 获取分类列表
 * @returns 分类列表数据
 */
export const getCategories = async (): Promise<CategoryListResponse> => {
  const apiUrl = globalConfig.getApiUrl('/app/aiApplicationCategory/public?Sorting=id%20desc&PageIndex=1&PageSize=100');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 获取分类列表 ===');
  console.log('API URL:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取分类列表失败响应:', errorText);
      throw new Error(`获取分类列表失败 (${response.status}): ${errorText}`);
    }

    const result: CategoryListResponse = await response.json();
    console.log('获取分类列表成功，共', result.totalCount, '个分类');

    return result;

  } catch (error) {
    console.error('获取分类列表错误:', error);
    throw new Error('获取分类列表失败: ' + (error as Error).message);
  }
};

/**
 * 上传JSON文件到服务器
 * @param jsonData - JSON数据对象
 * @param filename - 文件名
 * @returns 上传后的文件URL
 */
export const uploadJSONFile = async (jsonData: any, filename: string = '演示文稿.json'): Promise<string> => {
  const apiUrl = globalConfig.getApiUrl('/fileResouceItem/uploadUnified');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 上传JSON文件 ===');
  console.log('API URL:', apiUrl);
  console.log('文件名:', filename);

  // 将JSON数据转换为Blob
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  const formData = new FormData();
  formData.append('formfile', blob, filename);

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
      throw new Error(`JSON文件上传失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('上传成功，返回数据:', result);

    // 根据API返回的数据结构提取文件URL
    const fileUrl = result.url || result.data?.url || result.path || result.data;

    if (!fileUrl) {
      console.error('无法从响应中提取文件URL:', result);
      throw new Error('上传成功但未返回文件URL');
    }

    console.log('JSON文件上传成功，URL:', fileUrl);
    return fileUrl;

  } catch (error) {
    console.error('JSON文件上传错误:', error);
    throw new Error('JSON文件上传失败: ' + (error as Error).message);
  }
};

/**
 * 保存演示文稿到云端
 * @param params - 保存参数
 * @returns 保存结果
 */
export const saveToCloud = async (params: SaveToCloudRequest): Promise<any> => {
  const apiUrl = globalConfig.getApiUrl('/app/aiPPTX/my');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 保存到云端 ===');
  console.log('API URL:', apiUrl);
  console.log('请求参数:', params);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('保存到云端失败响应:', errorText);
      throw new Error(`保存到云端失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('保存到云端成功，返回数据:', result);

    return result;

  } catch (error) {
    console.error('保存到云端错误:', error);
    throw new Error('保存到云端失败: ' + (error as Error).message);
  }
};
