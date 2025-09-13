/**
 * useBUSfetch 测试
 */

// 模拟依赖
jest.mock('../src/defineService', () => ({
  defineService: jest.fn(() => mockService)
}));
jest.mock('element-plus', () => require('./mocks/element-plus'));
jest.mock('hi-utils-pro', () => require('./mocks/hi-utils-pro'));

import { useBusGet, useBusPost, useBusDownload } from '../src/useBUSfetch';
import { ElMessage } from './mocks/element-plus';
import { getFormData, getOmitProperties } from './mocks/hi-utils-pro';
import { createBusResponse, createMockAxiosResponse } from './utils/test-helpers';

// 模拟服务实例
const mockService = {
  get: jest.fn(),
  post: jest.fn()
};

describe('useBUSfetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的模拟响应
    mockService.get.mockResolvedValue(
      createMockAxiosResponse(createBusResponse({ test: 'data' }))
    );
    mockService.post.mockResolvedValue(
      createMockAxiosResponse(createBusResponse({ test: 'data' }))
    );
  });

  describe('useBusGet', () => {
    it('应该发起GET请求并返回结果', async () => {
      const url = '/api/users';
      const params = { page: 1, size: 10 };

      const result = await useBusGet(url, params);

      expect(mockService.get).toHaveBeenCalledWith(url, { params });
      expect(result).toEqual({ test: 'data' });
    });

    it('应该处理参数格式化', async () => {
      const url = '/api/users';
      const params = { page: 1 };
      const options = {
        onFormatParams: jest.fn((p) => ({ ...p, formatted: true }))
      };

      await useBusGet(url, params, options);

      expect(options.onFormatParams).toHaveBeenCalledWith(params);
      expect(mockService.get).toHaveBeenCalledWith(url, { 
        params: { page: 1, formatted: true } 
      });
    });

    it('应该处理必需参数检查', async () => {
      const url = '/api/users';
      const params = { name: '' };
      const options = {
        param_not_null_key: 'name',
        param_not_null_key_tip: '名称不能为空',
        onSuccess: jest.fn()
      };

      const result = await useBusGet(url, params, options);

      expect(ElMessage.warning).toHaveBeenCalledWith('名称不能为空');
      expect(options.onSuccess).toHaveBeenCalledWith({
        data: [],
        total: 0
      });
      expect(result).toBeUndefined();
    });

    it('应该处理请求失败的情况', async () => {
      mockService.get.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(null, false))
      );

      const result = await useBusGet('/api/test', {});

      expect(result).toBeUndefined();
    });

    it('应该处理成功提示', async () => {
      const options = {
        success_message: '获取成功'
      };

      await useBusGet('/api/test', {}, options);

      expect(ElMessage.success).toHaveBeenCalledWith('获取成功');
    });

    it('应该处理自定义提示函数', async () => {
      const onPrompt = jest.fn();
      const options = { onPrompt };

      await useBusGet('/api/test', {}, options);

      expect(onPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          successful: true,
          resultValue: { test: 'data' }
        })
      );
    });

    it('应该处理成功回调', async () => {
      const onSuccess = jest.fn();
      const options = { onSuccess };

      await useBusGet('/api/test', {}, options);

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          successful: true,
          resultValue: { test: 'data' }
        })
      );
    });

    it('应该处理数据格式化', async () => {
      const onFormat = jest.fn((data) => data.resultValue);
      const options = { onFormat };

      const result = await useBusGet('/api/test', {}, options);

      expect(onFormat).toHaveBeenCalled();
      expect(result).toEqual({ test: 'data' });
    });
  });

  describe('useBusPost', () => {
    it('应该发起POST请求并返回结果', async () => {
      const url = '/api/users';
      const params = { name: 'John', age: 30 };

      const result = await useBusPost(url, params);

      expect(mockService.post).toHaveBeenCalledWith(url, params, {
        responseType: 'json'
      });
      expect(result).toEqual({ test: 'data' });
    });

    it('应该处理默认数据', async () => {
      const defaultData = { default: true };
      const options = {
        default_data: defaultData,
        onFormat: jest.fn((data) => data),
        onSuccess: jest.fn()
      };

      const result = await useBusPost('/api/test', {}, options);

      expect(options.onSuccess).toHaveBeenCalledWith(defaultData);
      expect(result).toEqual(defaultData);
      expect(mockService.post).not.toHaveBeenCalled();
    });

    it('应该处理FormData参数类型', async () => {
      const params = { file: 'test-file', name: 'test' };
      const options = { params_type: 'formData' as const };
      
      (getFormData as jest.Mock).mockReturnValue(new FormData());

      await useBusPost('/api/upload', params, options);

      expect(getFormData).toHaveBeenCalledWith(params);
      expect(mockService.post).toHaveBeenCalledWith(
        '/api/upload',
        expect.any(FormData),
        { responseType: 'json' }
      );
    });

    it('应该处理json_str参数类型', async () => {
      const params = { page: 1, pageSize: 10, name: 'test' };
      const options = {
        params_type: 'json_str' as const,
        params_str: 'name={{name}}&data={{form_data_str}}',
        param_exclued_keys: ['page']
      };

      (getOmitProperties as jest.Mock).mockReturnValue({ pageSize: 10, name: 'test' });
      (getFormData as jest.Mock).mockReturnValue({ pageSize: '10', name: 'test' });

      await useBusPost('/api/test', params, options);

      expect(getOmitProperties).toHaveBeenCalledWith({ pageSize: 10, name: 'test' }, ['page']);
    });

    it('应该处理参数过滤', async () => {
      const params = {
        keep1: 'value1',
        keep2: 'value2',
        remove: 'should be removed'
      };
      const options = {
        params_filter: 'keep1,keep2'
      };

      await useBusPost('/api/test', params, options);

      // 验证只保留了指定的参数
      const expectedParams = { keep1: 'value1', keep2: 'value2' };
      expect(mockService.post).toHaveBeenCalledWith(
        '/api/test',
        expectedParams,
        { responseType: 'json' }
      );
    });

    it('应该处理file_selected_option特殊参数', async () => {
      const params = {
        name: 'test',
        file_selected_option: {
          fileId: '123',
          fileName: 'test.pdf'
        }
      };
      const options = {
        params_filter: 'single_key'
      };

      await useBusPost('/api/test', params, options);

      // file_selected_option应该被合并到主参数中
      expect(mockService.post).toHaveBeenCalledWith(
        '/api/test',
        {},  // 由于params_filter为single_key，所有其他参数都被过滤掉
        { responseType: 'json' }
      );
    });

    it('应该处理自定义Content-Type', async () => {
      const params = { data: 'test' };
      const options = {
        contentType: 'application/xml'
      };

      await useBusPost('/api/test', params, options);

      expect(mockService.post).toHaveBeenCalledWith(
        '/api/test',
        params,
        expect.objectContaining({
          transformRequest: expect.any(Function)
        })
      );
    });

    it('应该处理响应类型配置', async () => {
      const options = {
        responseType: 'blob' as const
      };

      await useBusPost('/api/download', {}, options);

      expect(mockService.post).toHaveBeenCalledWith(
        '/api/download',
        {},
        { responseType: 'blob' }
      );
    });

    it('应该处理空响应数据', async () => {
      mockService.post.mockResolvedValue({
        data: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await useBusPost('/api/test', {});

      // 应该自动设置默认的成功响应
      expect(result).toBeDefined();
    });

    it('应该处理必需参数验证', async () => {
      const params = { userId: '' };
      const options = {
        param_not_null_key: 'userId',
        param_not_null_key_tip: '用户ID不能为空',
        onSuccess: jest.fn()
      };

      const result = await useBusPost('/api/test', params, options);

      expect(ElMessage.warning).toHaveBeenCalledWith('用户ID不能为空');
      expect(options.onSuccess).toHaveBeenCalledWith({
        data: [],
        total: 0
      });
      expect(result).toBeUndefined();
    });

    it('应该处理请求失败情况', async () => {
      mockService.post.mockResolvedValue(
        createMockAxiosResponse(createBusResponse(null, false))
      );

      const result = await useBusPost('/api/test', {});

      expect(result).toBeUndefined();
    });
  });

  describe('useBusDownload', () => {
    // 模拟DOM环境
    const mockElement = {
      click: jest.fn(),
      href: '',
      download: ''
    };

    const mockParentElement = {
      insertBefore: jest.fn(),
      removeChild: jest.fn()
    };

    beforeEach(() => {
      // 重置DOM模拟
      (document.createElement as jest.Mock).mockReturnValue(mockElement);
      (document.getElementById as jest.Mock).mockReturnValue(mockParentElement);
      
      // 模拟download请求返回blob数据
      mockService.post.mockResolvedValue('mock-blob-data');
      
      // 模拟环境变量
      (global as any).import = {
        meta: {
          env: {
            VITE_FILE_DOWNLOAD_API_URL: 'http://localhost:3000/download'
          }
        }
      };
    });

    it('应该下载文件', async () => {
      const fileId = 'file-123';
      const fileName = 'test-document';
      const fileSuffix = '.pdf';

      await useBusDownload(fileId, fileName, fileSuffix);

      // 验证POST请求
      expect(mockService.post).toHaveBeenCalledWith(
        'http://localhost:3000/download/file-123',
        {},
        { responseType: 'blob' }
      );

      // 验证DOM操作
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.getElementById).toHaveBeenCalledWith('app');
      expect(mockElement.download).toBe('test-document.pdf');
      expect(mockParentElement.insertBefore).toHaveBeenCalledWith(mockElement, null);
      expect(mockElement.click).toHaveBeenCalled();
      expect(mockParentElement.removeChild).toHaveBeenCalledWith(mockElement);
    });

    it('应该处理没有文件后缀的情况', async () => {
      const fileId = 'file-123';
      const fileName = 'test-document';

      await useBusDownload(fileId, fileName);

      expect(mockElement.download).toBe('test-document');
    });

    it('应该创建正确的下载URL', async () => {
      const fileId = 'file-456';
      
      await useBusDownload(fileId, 'test', '.txt');

      expect(mockService.post).toHaveBeenCalledWith(
        'http://localhost:3000/download/file-456',
        {},
        { responseType: 'blob' }
      );
    });

    it('应该处理Blob对象', async () => {
      // 模拟Blob构造函数
      global.Blob = jest.fn(() => ({}) as any);
      
      await useBusDownload('file-123', 'test', '.txt');

      expect(global.Blob).toHaveBeenCalledWith(['mock-blob-data']);
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理网络错误', async () => {
      mockService.get.mockRejectedValue(new Error('Network Error'));

      await expect(useBusGet('/api/test', {})).rejects.toThrow('Network Error');
    });

    it('应该处理空参数', async () => {
      const result = await useBusGet('/api/test');

      expect(mockService.get).toHaveBeenCalledWith('/api/test', { params: undefined });
      expect(result).toEqual({ test: 'data' });
    });

    it('应该处理undefined选项', async () => {
      const result = await useBusPost('/api/test', { data: 'test' }, undefined);

      expect(result).toEqual({ test: 'data' });
    });

    it('应该处理复杂的参数过滤场景', async () => {
      const params = {
        file_selected_option: { fileId: '123' },
        keep: 'value',
        remove: 'should be removed'
      };
      const options = {
        params_filter: 'keep'
      };

      await useBusPost('/api/test', params, options);

      // 应该合并file_selected_option并过滤其他参数
      expect(mockService.post).toHaveBeenCalledWith(
        '/api/test',
        { fileId: '123' },
        { responseType: 'json' }
      );
    });
  });
});