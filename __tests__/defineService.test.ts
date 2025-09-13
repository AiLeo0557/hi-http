/**
 * defineService 测试
 */

// 模拟依赖
jest.mock('axios', () => require('./mocks/axios'));
jest.mock('element-plus', () => require('./mocks/element-plus'));

import { defineService, getHiHttpEncryptConfig, isEncryptEnabled } from '../src/defineService';
import { mockAxios, mockAxiosInstance } from './mocks/axios';
import { ElMessage, ElMessageBox } from './mocks/element-plus';
import { mockImportMeta, mockLocalStorage } from './utils/test-helpers';

describe('defineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置环境变量
    mockImportMeta({
      VITE_BUS_API_URL: 'http://localhost:3000/bus',
      VITE_SYS_API_URL: 'http://localhost:3000/sys',
      VITE_ENCRYPT_ENABLED: 'false'
    });
  });

  describe('服务创建', () => {
    it('应该创建BUS服务', () => {
      const service = defineService('BUS');

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000/bus',
        timeout: 30000
      });
      expect(service).toBe(mockAxiosInstance);
    });

    it('应该创建SYS服务', () => {
      const service = defineService('SYS');

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000/sys',
        timeout: 30000
      });
      expect(service).toBe(mockAxiosInstance);
    });

    it('应该处理缺失的环境变量', () => {
      mockImportMeta({});
      
      const service = defineService('BUS');

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: undefined,
        timeout: 30000
      });
    });
  });

  describe('加密配置', () => {
    it('应该返回默认的加密配置', () => {
      const config = getHiHttpEncryptConfig();

      expect(config).toEqual(
        expect.objectContaining({
          enabled: false,
          SM2PubKey: '',
          headCRC: ''
        })
      );
    });

    it('应该从环境变量读取加密配置', () => {
      mockImportMeta({
        VITE_ENCRYPT_ENABLED: 'true',
        VITE_SM2PUBKEY: 'test-public-key',
        VITE_HEADCRC: 'test-head-crc',
        VITE_TRANSMISSION_MODE: 'true',
        VITE_ENCRYPT_DEBUG: 'true'
      });

      // 重新导入以获取新的配置
      jest.resetModules();
      const { getHiHttpEncryptConfig: newGetConfig } = require('../src/defineService');
      const config = newGetConfig();

      expect(config.enabled).toBe(true);
      expect(config.SM2PubKey).toBe('test-public-key');
      expect(config.headCRC).toBe('test-head-crc');
    });

    it('应该正确检查加密是否启用', () => {
      expect(isEncryptEnabled()).toBe(false);

      mockImportMeta({
        VITE_ENCRYPT_ENABLED: 'true',
        VITE_SM2PUBKEY: 'test-key',
        VITE_HEADCRC: 'test-crc'
      });

      jest.resetModules();
      const { isEncryptEnabled: newIsEnabled } = require('../src/defineService');
      expect(newIsEnabled()).toBe(true);
    });
  });

  describe('请求拦截器', () => {
    it('应该设置请求拦截器', () => {
      defineService('BUS');

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      const [requestInterceptor] = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0];
      expect(typeof requestInterceptor).toBe('function');
    });

    it('应该在请求中添加必要的头部信息', async () => {
      mockLocalStorage({ USERTOKEN: 'test-token' });
      
      defineService('BUS');
      const [requestInterceptor] = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0];

      const config = {
        url: '/test',
        method: 'GET',
        data: { test: 'data' },
        headers: {}
      };

      const result = await requestInterceptor(config);

      expect(result.headers).toEqual(
        expect.objectContaining({
          accessToken: 'test-token',
          catalog: 'test-page',
          transmissionMode: false
        })
      );
      expect(typeof result.headers.sysTime).toBe('number');
    });

    it('应该处理没有token的情况', async () => {
      mockLocalStorage({});
      
      defineService('BUS');
      const [requestInterceptor] = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0];

      const config = {
        url: '/test',
        method: 'GET',
        headers: {}
      };

      const result = await requestInterceptor(config);

      expect(result.headers.accessToken).toBeUndefined();
    });
  });

  describe('响应拦截器', () => {
    it('应该设置响应拦截器', () => {
      defineService('BUS');

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      const [successInterceptor, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];
      expect(typeof successInterceptor).toBe('function');
      expect(typeof errorInterceptor).toBe('function');
    });

    it('应该处理成功响应', () => {
      defineService('BUS');
      const [successInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const response = {
        data: {
          successful: true,
          success: true,
          message: 'success'
        }
      };

      const result = successInterceptor(response);
      expect(result).toBe(response);
    });

    it('应该处理失败响应', () => {
      defineService('BUS');
      const [successInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const response = {
        data: {
          successful: false,
          message: 'error message'
        }
      };

      expect(() => successInterceptor(response)).toThrow('error message');
    });

    it('应该处理无效token (603错误)', () => {
      defineService('BUS');
      const [successInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const response = {
        data: {
          statusCode: '603',
          message: 'Token无效'
        }
      };

      expect(() => successInterceptor(response)).toThrow('Token无效');
    });

    it('应该处理网络错误', () => {
      defineService('BUS');
      const [, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const error = {
        response: {
          status: 400,
          data: { message: '数据被篡改' }
        },
        config: { url: '/test' },
        stack: 'Error stack trace'
      };

      const result = errorInterceptor(error);

      expect(ElMessage.error).toHaveBeenCalledWith('数据被篡改');
      expect(result).rejects.toBe(error);
    });

    it('应该处理403错误', () => {
      defineService('BUS');
      const [, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const error = {
        response: {
          status: 403,
          data: { message: '请求被禁用' }
        },
        config: { url: '/test' }
      };

      errorInterceptor(error);

      expect(ElMessage.error).toHaveBeenCalledWith('请求被禁用');
    });

    it('应该处理603登录过期错误并弹出确认框', () => {
      defineService('BUS');
      const [, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const error = {
        response: {
          status: 603,
          data: { 
            message: 'Token已过期',
            statusCode: 603
          }
        },
        config: { url: '/test' }
      };

      errorInterceptor(error);

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        'Token已过期',
        '请求失败',
        expect.objectContaining({
          confirmButtonText: '重新登录',
          type: 'error'
        })
      );
    });

    it('应该处理709传输模式切换', () => {
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: jest.fn(() => 'false'),
          setItem: jest.fn()
        }
      });

      defineService('BUS');
      const [, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const error = {
        response: {
          status: 709,
          data: { message: '传输模式错误' }
        },
        config: { url: '/test' }
      };

      errorInterceptor(error);

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('transmissionMode', 'true');
    });
  });

  describe('边界情况', () => {
    it('应该处理空响应数据', () => {
      defineService('BUS');
      const [successInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const response = { data: null };
      const result = successInterceptor(response);
      
      expect(result).toBe(response);
    });

    it('应该处理remarks为isKey的情况', () => {
      defineService('BUS');
      const [successInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const response = {
        data: {
          remarks: 'isKey',
          message: '密钥相关操作'
        }
      };

      successInterceptor(response);
      
      expect(ElMessage.success).toHaveBeenCalledWith('密钥相关操作');
    });

    it('应该处理没有响应的错误', () => {
      defineService('BUS');
      const [, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const error = {
        message: 'Network Error',
        config: { url: '/test' },
        stack: 'Error stack'
      };

      const result = errorInterceptor(error);
      expect(result).toBeUndefined();
    });

    it('应该处理超时错误', () => {
      defineService('BUS');
      const [, errorInterceptor] = (mockAxiosInstance.interceptors.response.use as jest.Mock).mock.calls[0];

      const error = {
        message: 'timeout of 30000ms exceeded',
        config: { url: '/test' }
      };

      errorInterceptor(error);
      
      expect(ElMessage.error).toHaveBeenCalledWith('请求超时，请检查网络是否连接正常');
    });
  });
});