import globalConfig from '../utils/globalConfig';

/**
 * 课件数据结构（与 CoursewareCard 保持一致）
 */
export interface CoursewareItem {
  id: string;
  name: string;
  converImg: string;
  creationTime: string;
  slideCount?: number;
  creatorName?: string;
  viewCount?: number;
  isShare?: boolean; // 是否分享（true=分享，false=锁定/不分享）
}

/**
 * 课件列表响应数据
 */
export interface CoursewareListResponse {
  totalCount: number;
  items: CoursewareItem[];
}

/**
 * 分页参数
 */
export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
  sorting?: string;
  categoryId?: string; // 分类ID（可选）
  filter?: string; // 搜索关键词（可选）
}

/**
 * 获取所有课件列表
 */
export const getAllCourseware = async (params: PaginationParams): Promise<CoursewareListResponse> => {
  const { pageIndex, pageSize, sorting = 'id desc', categoryId, filter } = params;

  let url = `/app/aiPPTX?Sorting=${encodeURIComponent(sorting)}&PageIndex=${pageIndex}&PageSize=${pageSize}`;
  if (categoryId) {
    url += `&AiApplicationCategoryId=${encodeURIComponent(categoryId)}`;
  }
  if (filter) {
    url += `&Filter=${encodeURIComponent(filter)}`;
  }

  const apiUrl = globalConfig.getApiUrl(url);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 获取所有课件列表 ===');
  console.log('API URL:', apiUrl);
  console.log('分页参数:', params);
  if (categoryId) {
    console.log('分类ID:', categoryId);
  }

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
      console.error('获取所有课件列表失败响应:', errorText);
      throw new Error(`获取所有课件列表失败 (${response.status}): ${errorText}`);
    }

    const result: CoursewareListResponse = await response.json();
    console.log('获取所有课件列表成功，共', result.totalCount, '个课件');

    return result;

  } catch (error) {
    console.error('获取所有课件列表错误:', error);
    throw new Error('获取所有课件列表失败: ' + (error as Error).message);
  }
};

/**
 * 获取本校区课件列表（使用 TenantId 筛选）
 */
export const getSchoolCourseware = async (params: PaginationParams): Promise<CoursewareListResponse> => {
  const { pageIndex, pageSize, sorting = 'id desc', categoryId, filter } = params;
  const tenantId = globalConfig.get('tenant');

  if (!tenantId) {
    console.warn('未找到 tenant 参数，无法筛选本校区课件');
    // 如果没有 tenant，返回空列表
    return { totalCount: 0, items: [] };
  }

  let url = `/app/aiPPTX?Sorting=${encodeURIComponent(sorting)}&PageIndex=${pageIndex}&PageSize=${pageSize}&TenantId=${encodeURIComponent(tenantId)}`;
  if (categoryId) {
    url += `&AiApplicationCategoryId=${encodeURIComponent(categoryId)}`;
  }
  if (filter) {
    url += `&Filter=${encodeURIComponent(filter)}`;
  }

  const apiUrl = globalConfig.getApiUrl(url);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 获取本校区课件列表 ===');
  console.log('API URL:', apiUrl);
  console.log('分页参数:', params);
  console.log('Tenant ID:', tenantId);
  if (categoryId) {
    console.log('分类ID:', categoryId);
  }

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
      console.error('获取本校区课件列表失败响应:', errorText);
      throw new Error(`获取本校区课件列表失败 (${response.status}): ${errorText}`);
    }

    const result: CoursewareListResponse = await response.json();
    console.log('获取本校区课件列表成功，共', result.totalCount, '个课件');

    return result;

  } catch (error) {
    console.error('获取本校区课件列表错误:', error);
    throw new Error('获取本校区课件列表失败: ' + (error as Error).message);
  }
};

/**
 * 获取我的课件列表
 */
export const getMyCourseware = async (params: PaginationParams): Promise<CoursewareListResponse> => {
  const { pageIndex, pageSize, sorting = 'id desc', categoryId, filter } = params;

  let url = `/app/aiPPTX/my?Sorting=${encodeURIComponent(sorting)}&PageIndex=${pageIndex}&PageSize=${pageSize}`;
  if (categoryId) {
    url += `&AiApplicationCategoryId=${encodeURIComponent(categoryId)}`;
  }
  if (filter) {
    url += `&Filter=${encodeURIComponent(filter)}`;
  }

  const apiUrl = globalConfig.getApiUrl(url);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 获取我的课件列表 ===');
  console.log('API URL:', apiUrl);
  console.log('分页参数:', params);
  if (categoryId) {
    console.log('分类ID:', categoryId);
  }

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
      console.error('获取我的课件列表失败响应:', errorText);
      throw new Error(`获取我的课件列表失败 (${response.status}): ${errorText}`);
    }

    const result: CoursewareListResponse = await response.json();
    console.log('获取我的课件列表成功，共', result.totalCount, '个课件');

    return result;

  } catch (error) {
    console.error('获取我的课件列表错误:', error);
    throw new Error('获取我的课件列表失败: ' + (error as Error).message);
  }
};

/**
 * 删除课件
 */
export const deleteCourseware = async (id: string): Promise<void> => {
  const apiUrl = globalConfig.getApiUrl(`/app/aiPPTX/${id}/my`);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 删除课件 ===');
  console.log('API URL:', apiUrl);
  console.log('课件 ID:', id);

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('删除课件失败响应:', errorText);
      throw new Error(`删除课件失败 (${response.status}): ${errorText}`);
    }

    console.log('删除课件成功');

  } catch (error) {
    console.error('删除课件错误:', error);
    throw new Error('删除课件失败: ' + (error as Error).message);
  }
};

/**
 * 获取课件详情（用于查看/编辑）
 */
export const getCoursewareDetail = async (id: string): Promise<any> => {
  const apiUrl = globalConfig.getApiUrl(`/app/aiPPTX/${id}/my`);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 获取课件详情 ===');
  console.log('API URL:', apiUrl);
  console.log('课件 ID:', id);

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
      console.error('获取课件详情失败响应:', errorText);
      throw new Error(`获取课件详情失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('获取课件详情成功');

    return result;

  } catch (error) {
    console.error('获取课件详情错误:', error);
    throw new Error('获取课件详情失败: ' + (error as Error).message);
  }
};

/**
 * 更新课件数据结构
 */
export interface UpdateCoursewareRequest {
  id: string;
  aiApplicationCategoryId: string;
  name: string;
  converImg: string;
  pptData: string;
  isShare: boolean;
}

/**
 * 更新课件
 */
export const updateCourseware = async (id: string, data: UpdateCoursewareRequest): Promise<any> => {
  const apiUrl = globalConfig.getApiUrl(`/app/aiPPTX/${id}/my`);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 更新课件 ===');
  console.log('API URL:', apiUrl);
  console.log('课件 ID:', id);
  console.log('更新数据:', data);

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('更新课件失败响应:', errorText);
      throw new Error(`更新课件失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('更新课件成功');

    return result;

  } catch (error) {
    console.error('更新课件错误:', error);
    throw new Error('更新课件失败: ' + (error as Error).message);
  }
};

/**
 * 重命名课件
 */
export const renameCourseware = async (id: string, name: string): Promise<void> => {
  const apiUrl = globalConfig.getApiUrl(`/app/aiPPTX/${id}/my`);
  const apiToken = globalConfig.getToken() || '';

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, name })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`重命名课件失败 (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.error('重命名课件错误:', error);
    throw new Error('重命名课件失败: ' + (error as Error).message);
  }
};

/**
 * 切换课件分享状态（锁定/解锁）
 */
export const toggleCoursewareShare = async (id: string, isShare: boolean): Promise<void> => {
  const apiUrl = globalConfig.getApiUrl(`/app/aiPPTX/${id}/myIsShare`);
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 切换课件分享状态 ===');
  console.log('API URL:', apiUrl);
  console.log('课件 ID:', id);
  console.log('分享状态 (isShare):', isShare);

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isShare })
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('切换课件分享状态失败响应:', errorText);
      throw new Error(`切换课件分享状态失败 (${response.status}): ${errorText}`);
    }

    console.log('切换课件分享状态成功');

  } catch (error) {
    console.error('切换课件分享状态错误:', error);
    throw new Error('切换课件分享状态失败: ' + (error as Error).message);
  }
};

/**
 * 课表目录树节点
 */
export interface CourseMethodTreeNode {
  id: string;
  name: string;
  fullName: string;
  code: string;
  level: number;
  sortId: number;
  parentId: string | null;
  lastModificationTime: string;
  creationTime: string;
  count: number;
  children: CourseMethodTreeNode[];
  aiCourseMethodApplications: any | null;
}

/**
 * 课表目录树响应
 */
export interface CourseMethodTreeResponse {
  totalCount: number;
  items: CourseMethodTreeNode[];
}

/**
 * 获取课表目录树（懒加载，一级一级获取）
 */
export const getCourseMethodTree = async (parentId: string = ''): Promise<CourseMethodTreeResponse> => {
  const apiUrl = globalConfig.getApiUrl('/app/aiCourseMethod/myTree');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 获取课表目录树 ===');
  console.log('API URL:', apiUrl);
  console.log('父节点 ID:', parentId || '(根节点)');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parentId })
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取课表目录树失败响应:', errorText);
      throw new Error(`获取课表目录树失败 (${response.status}): ${errorText}`);
    }

    const result: CourseMethodTreeResponse = await response.json();
    console.log('获取课表目录树成功，共', result.totalCount, '个节点');

    return result;

  } catch (error) {
    console.error('获取课表目录树错误:', error);
    throw new Error('获取课表目录树失败: ' + (error as Error).message);
  }
};

/**
 * 将课件加入课表的请求参数
 */
export interface AddToCourseMethodRequest {
  aiCourseMethodIds: string[];  // 目录ID数组
  aiPPTId: string;              // 课件ID
  targetType: number;           // 类型，aiPPTX为3
  name: string;                 // 课件名称
}

/**
 * 将课件加入课表
 */
export const addToCourseMethod = async (params: AddToCourseMethodRequest): Promise<void> => {
  const apiUrl = globalConfig.getApiUrl('/app/aiCourseMethodApplication/myBatch');
  const apiToken = globalConfig.getToken() || '';

  console.log('=== 将课件加入课表 ===');
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
      console.error('将课件加入课表失败响应:', errorText);
      throw new Error(`将课件加入课表失败 (${response.status}): ${errorText}`);
    }

    console.log('将课件加入课表成功');

  } catch (error) {
    console.error('将课件加入课表错误:', error);
    throw new Error('将课件加入课表失败: ' + (error as Error).message);
  }
};
