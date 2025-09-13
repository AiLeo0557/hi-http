/**
 * getRequestParams 测试
 */

// 模拟依赖
jest.mock('hi-utils-pro', () => require('./mocks/hi-utils-pro'));
jest.mock('hi-datatype-operation', () => ({
  isString: (value: any): value is string => typeof value === 'string',
  isEmptyObject: (value: any): boolean => 
    value != null && typeof value === 'object' && Object.keys(value).length === 0,
  isStrictObject: (value: any): boolean => 
    value != null && typeof value === 'object' && !Array.isArray(value)
}));
jest.mock('hi-guardian', () => ({
  createObjTypeGuard: () => () => true,
  createTupleTypeGuard: () => () => true
}));
jest.mock('hi-validator', () => ({
  createValidator: (fn: Function, message: string) => fn
}));

import { getRequestParams, isHiRequestArgument } from '../src/getRequestParams';
import { getFieldValueByPath } from 'hi-utils-pro';

describe('getRequestParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('形式一：对象参数处理', () => {
    it('应该处理简单的键值对象', () => {
      const paramObj = { userId: 'value1', userName: 'value2' };
      const paramOptions = {};
      const dataSource = {};

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ userId: 'value1', userName: 'value2' });
    });

    it('应该使用参数配置映射字段', () => {
      const paramObj = { userId: 'id', userName: 'name' };
      const paramOptions = {
        param_userId_key: 'user.id',
        param_userName_key: 'user.name'
      };
      const dataSource = {
        user: { id: 123, name: 'John Doe' }
      };

      // 模拟getFieldValueByPath的返回值
      (getFieldValueByPath as jest.Mock)
        .mockReturnValueOnce(123)  // user.id
        .mockReturnValueOnce('John Doe');  // user.name

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ userId: 123, userName: 'John Doe' });
      expect(getFieldValueByPath).toHaveBeenCalledWith('user.id', dataSource);
      expect(getFieldValueByPath).toHaveBeenCalledWith('user.name', dataSource);
    });

    it('应该处理runcode_参数', () => {
      const paramObj = { computedValue: 'computed' };
      const paramOptions = {
        param_computedValue_key: 'runcode_param_obj.userId + "_" + param_obj.userName'
      };
      const dataSource = {};

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toHaveProperty('computedValue');
    });

    it('应该处理数组类型的参数键', () => {
      const paramObj = { multipleValues: 'multi' };
      const paramOptions = {
        param_multipleValues_key: ['user.id', 'user.name']
      };
      const dataSource = {
        user: { id: 123, name: 'John' }
      };

      (getFieldValueByPath as jest.Mock)
        .mockReturnValueOnce(123)
        .mockReturnValueOnce('John');

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ multipleValues: [123, 'John'] });
    });

    it('应该处理空对象', () => {
      const result = getRequestParams({}, {}, {});
      expect(result).toEqual({});
    });

    it('应该跳过非对象参数', () => {
      const result = getRequestParams(null as any, {}, {});
      expect(result).toEqual({});
    });
  });

  describe('形式二：单一参数处理', () => {
    it('应该处理param_key_name和param_value_name配置', () => {
      const paramObj = {};
      const paramOptions = {
        param_key_name: 'userId',
        param_value_name: 'user.id'
      };
      const dataSource = {
        user: { id: 456 }
      };

      (getFieldValueByPath as jest.Mock).mockReturnValue(456);

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ userId: 456 });
      expect(getFieldValueByPath).toHaveBeenCalledWith('user.id', dataSource);
    });

    it('应该在缺少配置时跳过处理', () => {
      const paramObj = {};
      const paramOptions = {
        param_key_name: 'userId'
        // param_value_name 缺失
      };
      const dataSource = {};

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({});
    });
  });

  describe('形式三：数组参数处理', () => {
    it('应该处理数组参数并追加配置项', () => {
      const paramObj = [{ createrUser: '', userName: '' }];
      const paramOptions = {
        param_value_name: 'items',
        param_createrUser_key: 'currentUser.id',
        param_userName_key: 'currentUser.name'
      };
      const dataSource = {
        items: [
          { id: 1, title: 'Item 1' },
          { id: 2, title: 'Item 2' }
        ],
        currentUser: { id: 100, name: 'Admin' }
      };

      (getFieldValueByPath as jest.Mock)
        .mockReturnValueOnce([{ id: 1, title: 'Item 1' }, { id: 2, title: 'Item 2' }])  // items
        .mockReturnValueOnce(100)  // currentUser.id
        .mockReturnValueOnce('Admin');  // currentUser.name

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        { id: 1, title: 'Item 1', createrUser: 100, userName: 'Admin' },
        { id: 2, title: 'Item 2', createrUser: 100, userName: 'Admin' }
      ]);
    });

    it('应该在没有param_value_name时跳过数组处理', () => {
      const paramObj = [{ test: 'value' }];
      const paramOptions = {};
      const dataSource = {};

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({});
    });

    it('应该处理非对象数组项', () => {
      const paramObj = ['string1', 'string2'];
      const paramOptions = {
        param_value_name: 'stringArray'
      };
      const dataSource = {
        stringArray: ['a', 'b', 'c']
      };

      (getFieldValueByPath as jest.Mock).mockReturnValue(['a', 'b', 'c']);

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('边界情况', () => {
    it('应该处理undefined的数据源', () => {
      const paramObj = { test: 'value' };
      const paramOptions = {};
      const dataSource = undefined as any;

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ test: 'value' });
    });

    it('应该处理null的参数配置', () => {
      const paramObj = { test: 'value' };
      const paramOptions = null as any;
      const dataSource = {};

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({ test: 'value' });
    });

    it('应该处理复杂嵌套的数据结构', () => {
      const paramObj = { 
        level1: 'val1',
        level2: 'val2'
      };
      const paramOptions = {
        param_level1_key: 'data.nested.deep.value1',
        param_level2_key: 'data.nested.deep.value2'
      };
      const dataSource = {
        data: {
          nested: {
            deep: {
              value1: 'deep1',
              value2: 'deep2'
            }
          }
        }
      };

      (getFieldValueByPath as jest.Mock)
        .mockReturnValueOnce('deep1')
        .mockReturnValueOnce('deep2');

      const result = getRequestParams(paramObj, paramOptions, dataSource);

      expect(result).toEqual({
        level1: 'deep1',
        level2: 'deep2'
      });
    });
  });
});

describe('isHiRequestArgument', () => {
  it('应该验证正确的请求参数格式', () => {
    const validArgs = [
      '/api/test',
      { param1: 'value1' },
      { success_message: 'Success!' }
    ];

    const result = isHiRequestArgument(validArgs);
    expect(result).toBe(true);
  });

  it('应该验证不完整的请求参数', () => {
    const incompleteArgs = ['/api/test'];
    
    const result = isHiRequestArgument(incompleteArgs);
    expect(result).toBe(true); // 根据定义，最少需要1个参数
  });
});