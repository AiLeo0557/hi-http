/**
 * Element Plus 模拟文件
 * 用于在测试中模拟Element Plus组件的行为
 */

export const ElMessage = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

export const ElMessageBox = {
  confirm: jest.fn(() => Promise.resolve()),
  alert: jest.fn(() => Promise.resolve()),
  prompt: jest.fn(() => Promise.resolve())
};