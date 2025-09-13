/**
 * hi-http 集成测试
 * 测试各个模块之间的协作和端到端功能
 */

// 模拟依赖
jest.mock('axios', () => require('./mocks/axios'));
jest.mock('element-plus', () => require('./mocks/element-plus'));
jest.mock('hi-utils-pro', () => require('./mocks/hi-utils-pro'));

import * as hiHttp from '../src/index';
import { mockAxiosInstance } from './mocks/axios';
import { ElMessage } from './mocks/element-plus';
import { mockImportMeta, mockLocalStorage, createBusResponse, createSysResponse, createMockAxiosResponse } from './utils/test-helpers';

describe('hi-http 集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 设置默认环境变量
    mockImportMeta({
      VITE_BUS_API_URL: 'http://localhost:3000/bus',
      VITE_SYS_API_URL: 'http://localhost:3000/sys',
      VITE_FILE_DOWNLOAD_API_URL: 'http://localhost:3000/download',
      VITE_ENCRYPT_ENABLED: 'false'
    });

    mockLocalStorage({ USERTOKEN: 'test-token-123' });
  });

  describe('完整的BUS请求流程', () => {
    it('应该完成完整的BUS GET请求流程', async () => {
      const responseData = { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] };
      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(responseData))
      );

      const result = await hiHttp.useBusGet('/api/users', { page: 1 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/users', {
        params: { page: 1 }
      });
      expect(result).toEqual(responseData);
    });

    it('应该完成完整的BUS POST请求流程', async () => {
      const requestData = { name: 'New User', email: 'user@example.com' };
      const responseData = { id: 123, ...requestData };

      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(responseData))
      );

      const result = await hiHttp.useBusPost('/api/users', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/users', requestData, {
        responseType: 'json'
      });
      expect(result).toEqual(responseData);
    });

    it('应该完成带选项的复杂BUS请求', async () => {
      const requestData = { searchTerm: 'test', filters: { active: true } };
      const responseData = { results: [], total: 0 };
      const onSuccess = jest.fn();
      const onFormat = jest.fn((data) => data.resultValue);

      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(responseData))
      );

      const options = {
        success_message: '搜索成功',
        onSuccess,
        onFormat,
        onFormatParams: (params: any) => ({ ...params, timestamp: Date.now() })
      };

      const result = await hiHttp.useBusPost('/api/search', requestData, options);

      expect(onSuccess).toHaveBeenCalled();
      expect(onFormat).toHaveBeenCalled();
      expect(ElMessage.success).toHaveBeenCalledWith('搜索成功');
      expect(result).toEqual(responseData);
    });
  });

  describe('完整的SYS请求流程', () => {
    it('应该完成完整的SYS GET请求流程', async () => {
      const responseData = { config: { theme: 'dark', language: 'zh-CN' } };
      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(responseData))
      );

      const result = await hiHttp.useSysGet('/api/system/config');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/system/config');
      expect(result).toEqual(responseData);
    });

    it('应该完成完整的SYS POST请求流程', async () => {
      const requestData = { theme: 'light', notifications: true };
      const responseData = { updated: true, config: requestData };

      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(responseData))
      );

      const result = await hiHttp.useSysPost('/api/system/config', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/system/config', requestData);
      expect(result).toEqual(responseData);
    });

    it('应该完成带回调的SYS请求', async () => {
      const responseData = { users: [{ id: 1, name: 'Admin' }] };
      const onSuccess = jest.fn();
      const onFormat = jest.fn((data) => ({ count: data.result.users.length }));

      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(responseData))
      );

      const result = await hiHttp.useSysPost('/api/system/users', {}, { onSuccess, onFormat });

      expect(onSuccess).toHaveBeenCalled();
      expect(onFormat).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('参数处理集成测试', () => {
    it('应该正确处理复杂参数映射', () => {
      const paramObj = { userId: 'user', roleId: 'role' };
      const paramOptions = {
        param_userId_key: 'currentUser.id',
        param_roleId_key: 'selectedRole.id'
      };
      const dataSource = {
        currentUser: { id: 100, name: 'John' },
        selectedRole: { id: 5, name: 'Admin' }
      };

      // 模拟 getFieldValueByPath 返回值
      const { getFieldValueByPath } = require('hi-utils-pro');
      (getFieldValueByPath as jest.Mock)
        .mockReturnValueOnce(100)  // currentUser.id
        .mockReturnValueOnce(5);   // selectedRole.id

      const result = hiHttp.getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ userId: 100, roleId: 5 });
    });

    it('应该处理数组参数的复杂映射', () => {
      const paramObj = [{ createdBy: '', status: '' }];
      const paramOptions = {
        param_value_name: 'itemList',
        param_createdBy_key: 'user.id',
        param_status_key: 'defaultStatus'
      };
      const dataSource = {
        itemList: [
          { id: 1, title: 'Item 1' },
          { id: 2, title: 'Item 2' }
        ],
        user: { id: 999 },
        defaultStatus: 'active'
      };

      const { getFieldValueByPath } = require('hi-utils-pro');
      (getFieldValueByPath as jest.Mock)
        .mockReturnValueOnce([{ id: 1, title: 'Item 1' }, { id: 2, title: 'Item 2' }])
        .mockReturnValueOnce(999)
        .mockReturnValueOnce('active');

      const result = hiHttp.getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual([
        { id: 1, title: 'Item 1', createdBy: 999, status: 'active' },
        { id: 2, title: 'Item 2', createdBy: 999, status: 'active' }
      ]);
    });
  });

  describe('文件下载集成测试', () => {
    beforeEach(() => {
      // 模拟 Blob 和 URL
      global.Blob = jest.fn((content, options) => ({ content, options })) as any;
      (window.URL.createObjectURL as jest.Mock).mockReturnValue('blob:test-url');

      // 模拟 DOM 元素
      const mockElement = { click: jest.fn(), href: '', download: '' };
      const mockParent = { insertBefore: jest.fn(), removeChild: jest.fn() };
      (document.createElement as jest.Mock).mockReturnValue(mockElement);
      (document.getElementById as jest.Mock).mockReturnValue(mockParent);

      // 模拟下载响应
      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse({
          successful: true,
          success: true,
          message: 'File downloaded successfully',
          resultValue: { test: 'binary-file-data' },
          resultHint: '',
        })
      );
    });

    it('应该完成完整的文件下载流程', async () => {
      await hiHttp.useBusDownload('file-123', 'document', '.pdf');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'http://localhost:3000/download/file-123',
        {},
        { responseType: 'blob' }
      );

      expect(global.Blob).toHaveBeenCalledWith(['binary-file-data']);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.getElementById).toHaveBeenCalledWith('app');
    });
  });

  describe('错误处理集成测试', () => {
    it('应该处理BUS服务的请求失败', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(null, false))
      );

      const result = await hiHttp.useBusGet('/api/error');

      expect(result).toBeUndefined();
    });

    it('应该处理SYS服务的错误响应', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '500',
          message: '服务器内部错误',
          result: null,
          logLevel: 'error'
        })
      );

      const result = await hiHttp.useSysGet('/api/system/error');

      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalledWith('服务器内部错误');
    });

    it('应该处理网络错误', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network timeout'));

      await expect(hiHttp.useBusPost('/api/test', {})).rejects.toThrow('Network timeout');
    });
  });

  describe('加密功能集成测试', () => {
    it('应该在启用加密时创建加密配置', () => {
      mockImportMeta({
        VITE_ENCRYPT_ENABLED: 'true',
        VITE_SM2PUBKEY: 'test-public-key',
        VITE_HEADCRC: 'test-head-crc',
        VITE_TRANSMISSION_MODE: 'true'
      });

      // 重新加载模块以获取新的配置
      jest.resetModules();
      const { getHiHttpEncryptConfig, isEncryptEnabled } = require('../src/defineService');

      expect(isEncryptEnabled()).toBe(true);
      const config = getHiHttpEncryptConfig();
      expect(config.enabled).toBe(true);
      expect(config.SM2PubKey).toBe('test-public-key');
      expect(config.headCRC).toBe('test-head-crc');
    });

    it('应该在禁用加密时使用默认配置', () => {
      const config = hiHttp.getHiHttpEncryptConfig();

      expect(hiHttp.isEncryptEnabled()).toBe(false);
      expect(config.enabled).toBe(false);
    });
  });

  describe('实际使用场景模拟', () => {
    it('应该模拟用户登录流程', async () => {
      const loginRequest = { username: 'testuser', password: 'password123' };
      const loginResponse = {
        token: 'jwt-token-abc123',
        user: { id: 1, username: 'testuser', role: 'admin' }
      };

      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(loginResponse))
      );

      const result = await hiHttp.useBusPost('/api/auth/login', loginRequest, {
        success_message: '登录成功',
        onSuccess: (data) => {
          // 模拟保存token到localStorage
          window.localStorage.setItem('USERTOKEN', data.resultValue.token);
        }
      });

      expect(result).toEqual(loginResponse);
      expect(ElMessage.success).toHaveBeenCalledWith('登录成功');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('USERTOKEN', 'jwt-token-abc123');
    });

    it('应该模拟数据列表获取和处理', async () => {
      const listResponse = {
        list: [
          { id: 1, name: 'Item 1', status: 'active' },
          { id: 2, name: 'Item 2', status: 'inactive' },
          { id: 3, name: 'Item 3', status: 'active' }
        ],
        total: 3,
        page: 1,
        pageSize: 10
      };

      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(listResponse))
      );

      const result = await hiHttp.useBusGet('/api/items', { page: 1, pageSize: 10 }, {
        onFormat: (data) => ({
          ...data.resultValue,
          activeCount: data.resultValue.list.filter((item: any) => item.status === 'active').length
        })
      });

      expect(result.activeCount).toBe(2);
      expect(result.list).toHaveLength(3);
    });

    it('应该模拟系统配置更新流程', async () => {
      const configUpdate = {
        theme: 'dark',
        language: 'en',
        notifications: { email: true, push: false }
      };

      mockAxiosInstance.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse({ updated: true, config: configUpdate }))
      );

      const onSuccess = jest.fn((data, response) => {
        console.log('配置更新成功:', data.result.config);
      });

      const result = await hiHttp.useSysPost('/api/system/config', configUpdate, {
        onSuccess,
        onFormat: (data) => data.result.config
      });

      expect(result).toEqual(configUpdate);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('应该模拟表单提交与验证', async () => {
      const formData = {
        name: '',
        email: 'invalid-email'
      };

      const result = await hiHttp.useBusPost('/api/users', formData, {
        param_not_null_key: 'name',
        param_not_null_key_tip: '姓名不能为空',
        onSuccess: jest.fn(),
        onFormatParams: (params) => {
          // 客户端验证
          if (!params.name.trim()) {
            throw new Error('姓名不能为空');
          }
          return params;
        }
      });

      expect(ElMessage.warning).toHaveBeenCalledWith('姓名不能为空');
      expect(result).toBeUndefined();
    });
  });

  describe('性能和可靠性测试', () => {
    it('应该处理并发请求', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce(createMockAxiosResponse(createBusResponse({ id: 1 })))
        .mockResolvedValueOnce(createMockAxiosResponse(createBusResponse({ id: 2 })))
        .mockResolvedValueOnce(createMockAxiosResponse(createBusResponse({ id: 3 })));

      const promises = [
        hiHttp.useBusGet('/api/item/1'),
        hiHttp.useBusGet('/api/item/2'),
        hiHttp.useBusGet('/api/item/3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ id: 1 });
      expect(results[1]).toEqual({ id: 2 });
      expect(results[2]).toEqual({ id: 3 });
    });

    it('应该处理请求重试机制', async () => {
      // 模拟第一次请求失败，第二次成功
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce(createMockAxiosResponse(createBusResponse({ retry: true })));

      // 第一次请求失败
      await expect(hiHttp.useBusPost('/api/retry')).rejects.toThrow('Network Error');

      // 第二次请求成功
      const result = await hiHttp.useBusPost('/api/retry');
      expect(result).toEqual({ retry: true });
    });

    it('应该处理大量数据的响应', async () => {
      const largeData = {
        items: new Array(1000).fill(null).map((_, i) => ({ id: i, name: `Item ${i}` })),
        total: 1000
      };

      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(largeData))
      );

      const result = await hiHttp.useBusGet('/api/large-dataset');

      expect(result.items).toHaveLength(1000);
      expect(result.total).toBe(1000);
    });
  });
});

// 导出类型测试
describe('TypeScript 类型支持', () => {
  it('应该支持泛型类型', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    // 这些调用应该通过TypeScript类型检查
    const getUsersCall = (): Promise<User[] | undefined> =>
      hiHttp.useBusGet<User[]>('/api/users');

    const createUserCall = (user: Omit<User, 'id'>): Promise<User | undefined> =>
      hiHttp.useBusPost<User>('/api/users', { ...user, id: 0 });

    expect(typeof getUsersCall).toBe('function');
    expect(typeof createUserCall).toBe('function');
  });
});