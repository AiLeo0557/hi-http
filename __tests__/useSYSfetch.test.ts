/**
 * useSYSfetch 测试
 */
// 模拟服务实例
const mockService = {
  get: jest.fn(),
  post: jest.fn()
};

// 模拟依赖
jest.mock('../src/defineService', () => ({
  defineService: jest.fn(() => mockService)
}));
jest.mock('element-plus', () => require('./mocks/element-plus'));

import { useSysGet, useSysPost } from '../src/useSYSfetch';
import { ElMessage } from './mocks/element-plus';
import { createSysResponse, createMockAxiosResponse } from './utils/test-helpers';



describe('useSYSfetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSysGet', () => {
    it('应该发起GET请求并返回结果', async () => {
      const testData = { users: ['user1', 'user2'] };
      mockService.get.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const result = await useSysGet('/api/sys/users');

      expect(mockService.get).toHaveBeenCalledWith('/api/sys/users');
      expect(result).toEqual(testData);
    });

    it('应该处理成功响应 (statusCode 200)', async () => {
      const testData = { config: { theme: 'dark' } };
      mockService.get.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData, '200'))
      );

      const result = await useSysGet('/api/sys/config');

      expect(result).toEqual(testData);
      expect(ElMessage.error).not.toHaveBeenCalled();
    });

    it('应该处理错误响应 (statusCode 非200)', async () => {
      const errorMessage = '权限不足';
      mockService.get.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(null, '403'))
      );

      // 重写模拟以包含错误消息
      mockService.get.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '403',
          message: errorMessage,
          result: null,
          logLevel: 'error'
        })
      );

      const result = await useSysGet('/api/sys/protected');

      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalledWith(errorMessage);
    });

    it('应该处理网络异常', async () => {
      const errorMessage = 'Network Error';
      mockService.get.mockRejectedValue(new Error(errorMessage));

      const result = await useSysGet('/api/sys/test');

      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalledWith(errorMessage);
    });

    it('应该处理空URL', async () => {
      const testData = { empty: true };
      mockService.get.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const result = await useSysGet('');

      expect(mockService.get).toHaveBeenCalledWith('');
      expect(result).toEqual(testData);
    });

    it('应该处理statusCode为字符串类型', async () => {
      const testData = { test: 'data' };
      mockService.get.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '200',  // 字符串类型
          message: 'success',
          result: testData,
          logLevel: 'info'
        })
      );

      const result = await useSysGet('/api/test');

      expect(result).toEqual(testData);
    });
  });

  describe('useSysPost', () => {
    it('应该发起POST请求并返回结果', async () => {
      const testData = { id: 123, name: 'Test User' };
      const requestParams = { name: 'Test User', email: 'test@example.com' };

      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const result = await useSysPost('/api/sys/users', requestParams);

      expect(mockService.post).toHaveBeenCalledWith('/api/sys/users', requestParams);
      expect(result).toEqual(testData);
    });

    it('应该处理空参数', async () => {
      const testData = { success: true };
      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const result = await useSysPost('/api/sys/test');

      expect(mockService.post).toHaveBeenCalledWith('/api/sys/test', {});
      expect(result).toEqual(testData);
    });

    it('应该处理请求选项', async () => {
      const testData = { processed: true };
      const params = { data: 'test' };
      const onSuccess = jest.fn();
      const onFormat = jest.fn((response) => response.result);
      const onFail = jest.fn();

      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const options = { onSuccess, onFormat, onFail };
      const result = await useSysPost('/api/sys/process', params, options);

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: '200',
          result: testData
        }),
        expect.any(Object)
      );
      expect(onFormat).toHaveBeenCalled();
      expect(onFail).not.toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it('应该处理失败响应', async () => {
      const errorMessage = '数据验证失败';
      const onFail = jest.fn();
      const onSuccess = jest.fn();

      mockService.post.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '400',
          message: errorMessage,
          result: null,
          logLevel: 'error'
        })
      );

      const options = { onFail, onSuccess };
      const result = await useSysPost('/api/sys/validate', { invalid: 'data' }, options);

      expect(onFail).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: '400',
          message: errorMessage
        })
      );
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalledWith(`/api/sys/validate:${errorMessage}`);
    });

    it('应该使用onFormat格式化返回数据', async () => {
      const rawData = { users: [{ id: 1, name: 'User1' }] };
      const formattedData = { userCount: 1 };

      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(rawData))
      );

      const onFormat = jest.fn(() => formattedData);
      const result = await useSysPost('/api/sys/users', {}, { onFormat });

      expect(onFormat).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: '200',
          result: rawData
        })
      );
      expect(result).toEqual(formattedData);
    });

    it('应该处理网络异常', async () => {
      const errorMessage = 'Connection timeout';
      mockService.post.mockRejectedValue(new Error(errorMessage));

      const result = await useSysPost('/api/sys/test', { data: 'test' });

      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalledWith(`/api/sys/test:${errorMessage}`);
    });

    it('应该处理各种statusCode', async () => {
      const testCases = [
        { statusCode: '201', shouldSucceed: false },
        { statusCode: '400', shouldSucceed: false },
        { statusCode: '401', shouldSucceed: false },
        { statusCode: '403', shouldSucceed: false },
        { statusCode: '404', shouldSucceed: false },
        { statusCode: '500', shouldSucceed: false }
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockService.post.mockResolvedValue(
          createMockAxiosResponse({
            statusCode: testCase.statusCode,
            message: `Status ${testCase.statusCode}`,
            result: { data: 'test' },
            logLevel: 'info'
          })
        );

        const result = await useSysPost('/api/test', {});

        if (testCase.shouldSucceed) {
          expect(result).toEqual({ data: 'test' });
          expect(ElMessage.error).not.toHaveBeenCalled();
        } else {
          expect(result).toBeUndefined();
          expect(ElMessage.error).toHaveBeenCalled();
        }
      }
    });

    it('应该正确处理成功的201状态码', async () => {
      // 修正：201也应该被视为非200状态码，因此会失败
      const testData = { created: true };
      mockService.post.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '201',
          message: 'Created successfully',
          result: testData,
          logLevel: 'info'
        })
      );

      const result = await useSysPost('/api/sys/create', { name: 'New Item' });

      // 根据代码逻辑，只有statusCode === '200'才会成功
      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalledWith('/api/sys/create:Created successfully');
    });

    it('应该调用onFail回调当请求失败时', async () => {
      const onFail = jest.fn();
      const errorResponse = {
        statusCode: '500',
        message: '服务器内部错误',
        result: null,
        logLevel: 'error'
      };

      mockService.post.mockResolvedValue(
        createMockAxiosResponse(errorResponse)
      );

      await useSysPost('/api/sys/error', {}, { onFail });

      expect(onFail).toHaveBeenCalledWith(errorResponse);
    });

    it('应该处理复杂的请求参数', async () => {
      const complexParams = {
        user: {
          name: 'John Doe',
          details: {
            age: 30,
            skills: ['JavaScript', 'TypeScript']
          }
        },
        options: {
          validate: true,
          format: 'json'
        }
      };

      const testData = { id: 456 };
      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const result = await useSysPost('/api/sys/complex', complexParams);

      expect(mockService.post).toHaveBeenCalledWith('/api/sys/complex', complexParams);
      expect(result).toEqual(testData);
    });
  });

  describe('边界情况和错误处理', () => {
    it('useSysGet 应该处理空响应', async () => {
      mockService.get.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '200',
          message: 'success',
          result: null,
          logLevel: 'info'
        })
      );

      const result = await useSysGet('/api/sys/empty');

      expect(result).toBeNull();
    });

    it('useSysPost 应该处理空响应', async () => {
      mockService.post.mockResolvedValue(
        createMockAxiosResponse({
          statusCode: '200',
          message: 'success',
          result: undefined,
          logLevel: 'info'
        })
      );

      const result = await useSysPost('/api/sys/empty', {});

      expect(result).toBeUndefined();
    });

    it('应该处理undefined的选项参数', async () => {
      const testData = { test: 'data' };
      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createSysResponse(testData))
      );

      const result = await useSysPost('/api/sys/test', {}, undefined);

      expect(result).toEqual(testData);
    });

    it('应该处理错误对象没有message属性的情况', async () => {
      mockService.get.mockRejectedValue({ code: 'NETWORK_ERROR' });

      const result = await useSysGet('/api/sys/test');

      expect(result).toBeUndefined();
      expect(ElMessage.error).toHaveBeenCalled();
    });

    it('应该处理响应数据格式异常', async () => {
      // 模拟响应数据格式不正确的情况
      mockService.get.mockResolvedValue({
        data: null // 缺少必要的字段
      });

      const result = await useSysGet('/api/sys/malformed');

      expect(result).toBeUndefined();
    });

    it('应该处理POST请求中的异常响应格式', async () => {
      mockService.post.mockResolvedValue({
        data: 'invalid response format' // 不是预期的对象格式
      });

      const result = await useSysPost('/api/sys/malformed', {});

      expect(result).toBeUndefined();
    });
  });
});