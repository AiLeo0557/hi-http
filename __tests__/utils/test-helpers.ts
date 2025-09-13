/**
 * 测试工具函数
 * 提供测试中常用的辅助函数
 */

// 模拟环境变量设置
export const mockImportMeta = (envVars: Record<string, any>) => {
  (global as any).import = {
    meta: {
      env: {
        ...envVars
      }
    }
  };
};

// 模拟localStorage
export const mockLocalStorage = (values: Record<string, string> = {}) => {
  const storage = {
    getItem: jest.fn((key: string) => values[key] || null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    writable: true
  });
  
  return storage;
};

// 创建模拟的axios响应
export const createMockAxiosResponse = (data: any, status = 200, statusText = 'OK') => ({
  data,
  status,
  statusText,
  headers: {},
  config: {}
});

// 创建BUS服务响应
export const createBusResponse = (data: any, successful = true) => ({
  successful,
  success: successful,
  message: successful ? 'success' : 'error',
  resultValue: data,
  resultHint: successful ? 'Operation successful' : 'Operation failed'
});

// 创建SYS服务响应
export const createSysResponse = (data: any, statusCode = '200') => ({
  statusCode,
  message: statusCode === '200' ? 'success' : 'error',
  result: data,
  logLevel: 'info'
});

// 等待Promise解析的工具函数
export const waitFor = (fn: () => boolean, timeout = 5000, interval = 100): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (fn()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        reject(new Error('Timeout waiting for condition'));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
};

// 延迟函数
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));