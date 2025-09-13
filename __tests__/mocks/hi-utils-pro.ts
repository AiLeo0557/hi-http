/**
 * Hi-utils-pro 模拟文件
 * 用于在测试中模拟hi-utils-pro工具函数的行为
 */

export const getFormData = jest.fn((data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return formData;
});

export const getOmitProperties = jest.fn((obj: any, keys: string[]) => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
});

export const getFieldValueByPath = jest.fn((path: string, source: any) => {
  const keys = path.split('.');
  let result = source;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  return result;
});