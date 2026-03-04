/**
 * 全局配置 - 存储和管理URL参数
 */

interface GlobalConfig {
  [key: string]: string;
}

class ConfigManager {
  private config: GlobalConfig = {};
  private initialized = false;

  /**
   * 初始化配置 - 解析URL参数并存储
   * 优先从 Hash 中读取参数，如果没有则从 Search 中读取
   */
  initialize() {
    if (this.initialized) return;

    try {
      let urlParams: URLSearchParams;

      // 优先从 Hash 中读取参数
      const hash = window.location.hash;
      if (hash && hash.includes('?')) {
        // Hash 模式: #/preview?type=3w-api&id=xxx
        const queryString = hash.split('?')[1]; // 获取 ? 后面的部分
        urlParams = new URLSearchParams(queryString);
        console.log('从 Hash 中读取参数:', queryString);
      } else {
        // 普通模式: ?type=3w-api&id=xxx
        urlParams = new URLSearchParams(window.location.search);
        console.log('从 Search 中读取参数:', window.location.search);
      }

      // 存储所有参数
      urlParams.forEach((value, key) => {
        this.config[key] = value;
      });

      console.log('全局配置已初始化:', this.config);
      this.initialized = true;
    } catch (error) {
      console.error('初始化全局配置失败:', error);
    }
  }

  /**
   * 获取指定参数
   * @param key 参数名
   * @param defaultValue 默认值
   */
  get(key: string, defaultValue?: string): string | undefined {
    return this.config[key] || defaultValue;
  }

  /**
   * 获取所有参数
   */
  getAll(): GlobalConfig {
    return { ...this.config };
  }

  /**
   * 设置参数
   * @param key 参数名
   * @param value 参数值
   */
  set(key: string, value: string) {
    this.config[key] = value;
  }

  /**
   * 检查参数是否存在
   * @param key 参数名
   */
  has(key: string): boolean {
    return key in this.config;
  }

  /**
   * 获取type参数（用于构建API地址）
   */
  getType(): string {
    return this.config.type || '3w-api';
  }

  /**
   * 获取token参数（用于API认证）
   */
  getToken(): string | undefined {
    return this.config.token;
  }

  /**
   * 构建API基础URL
   * @param path API路径
   */
  getApiUrl(path: string): string {
    const type = this.getType();
    return `https://${type}.mamale.vip/api${path}`;
  }
}

// 创建全局单例
const globalConfig = new ConfigManager();

// 自动初始化
if (typeof window !== 'undefined') {
  globalConfig.initialize();
}

export default globalConfig;
