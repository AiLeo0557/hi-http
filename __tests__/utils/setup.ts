/**
 * Jest 测试环境设置文件
 * 配置全局测试环境和模拟
 */

// 模拟环境变量
(global as any).import = {
  meta: {
    env: {
      VITE_BUS_API_URL: 'http://localhost:3000/bus',
      VITE_SYS_API_URL: 'http://localhost:3000/sys',
      VITE_FILE_DOWNLOAD_API_URL: 'http://localhost:3000/download',
      VITE_ENCRYPT_ENABLED: 'false',
      VITE_SM2PUBKEY: 'test-public-key',
      VITE_HEADCRC: 'test-head-crc',
      VITE_TRANSMISSION_MODE: 'false',
      VITE_ENCRYPT_DEBUG: 'false'
    }
  }
};

// 模拟 window 对象
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test-page',
    replace: jest.fn()
  },
  writable: true
});

// 模拟 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

// 模拟 sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(() => 'false'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

// 模拟 DOM 元素
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    click: jest.fn(),
    href: '',
    download: ''
  })),
  writable: true
});

Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => ({
    insertBefore: jest.fn(),
    removeChild: jest.fn()
  })),
  writable: true
});

// 模拟 URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-blob-url'),
  writable: true
});

// 全局模拟console输出（可选，用于减少测试输出噪声）
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // 重置所有模拟
  jest.clearAllMocks();
});

// 如果需要静默控制台输出，可以取消注释以下代码
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();

afterAll(() => {
  // 恢复原始的console方法
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});