/**
 * Axios 模拟文件
 * 用于在测试中模拟axios的行为
 */

export const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  }
};

export const mockAxiosInstance = {
  get: jest.fn(() => Promise.resolve({
    data: {
      successful: true,
      success: true,
      message: 'success',
      resultValue: { test: 'data' },
      resultHint: 'success'
    },
    status: 200,
    statusText: 'OK'
  })),
  post: jest.fn(() => Promise.resolve({
    data: {
      successful: true,
      success: true,
      message: 'success',
      resultValue: { test: 'data' },
      resultHint: 'success'
    },
    status: 200,
    statusText: 'OK'
  })),
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  }
};

// 模拟axios默认导出
const axios = {
  ...mockAxios,
  default: mockAxios
};

export default axios;