# Hi-HTTP 测试文档

本文档描述了 hi-http 项目的测试架构和测试案例。

## 测试概览

### 测试框架
- **Jest**: 主要测试框架
- **TypeScript**: 测试用例使用 TypeScript 编写
- **JSDOM**: 浏览器环境模拟

### 测试覆盖范围
✅ 单元测试 - 各个模块的独立功能测试  
✅ 集成测试 - 模块间协作测试  
✅ 边界情况测试 - 异常情况和边界值测试  
✅ 类型安全测试 - TypeScript 类型支持测试  

## 目录结构

```
__tests__/
├── README.md                 # 本文档
├── utils/
│   ├── setup.ts             # Jest 测试环境设置
│   └── test-helpers.ts      # 测试工具函数
├── mocks/
│   ├── axios.ts             # Axios 模拟
│   ├── element-plus.ts      # Element Plus 模拟
│   └── hi-utils-pro.ts      # Hi-utils-pro 模拟
├── getRequestParams.test.ts # 请求参数处理测试
├── defineService.test.ts    # 服务定义测试
├── useBUSfetch.test.ts      # BUS 服务测试
├── useSYSfetch.test.ts      # SYS 服务测试
└── integration.test.ts      # 集成测试
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 运行特定测试

```bash
# 运行特定测试文件
npx jest getRequestParams.test.ts

# 运行特定测试套件
npx jest --testNamePattern="useBusGet"

# 运行集成测试
npx jest integration.test.ts
```

## 测试案例详解

### 1. getRequestParams.test.ts
测试请求参数处理功能：

**覆盖场景：**
- ✅ 简单对象参数映射
- ✅ 配置项参数映射  
- ✅ 运行时代码执行 (`runcode_`)
- ✅ 数组参数处理
- ✅ 单一参数处理
- ✅ 数组元素补充处理
- ✅ 边界情况处理

**重点测试：**
```typescript
// 参数映射测试
const result = getRequestParams(
  { userId: 'id', userName: 'name' },
  { param_userId_key: 'user.id', param_userName_key: 'user.name' },
  { user: { id: 123, name: 'John' } }
);
// 期望: { userId: 123, userName: 'John' }
```

### 2. defineService.test.ts
测试服务定义和配置：

**覆盖场景：**
- ✅ BUS/SYS 服务创建
- ✅ 加密配置管理
- ✅ 请求拦截器功能
- ✅ 响应拦截器功能  
- ✅ 错误处理机制
- ✅ 环境变量读取

**重点测试：**
```typescript
// 加密配置测试
mockImportMeta({
  VITE_ENCRYPT_ENABLED: 'true',
  VITE_SM2PUBKEY: 'test-key',
  VITE_HEADCRC: 'test-crc'
});

const config = getHiHttpEncryptConfig();
expect(config.enabled).toBe(true);
```

### 3. useBUSfetch.test.ts
测试 BUS 服务相关功能：

**覆盖场景：**
- ✅ GET 请求处理
- ✅ POST 请求处理
- ✅ 文件下载功能
- ✅ 参数格式化 (`FormData`, `json_str`)
- ✅ 参数过滤和验证
- ✅ 成功/失败回调
- ✅ 响应数据格式化

**重点测试：**
```typescript
// FormData 参数类型测试
await useBusPost('/api/upload', { file: 'test' }, { 
  params_type: 'formData' 
});
expect(getFormData).toHaveBeenCalled();

// 文件下载测试  
await useBusDownload('file-123', 'document', '.pdf');
expect(document.createElement).toHaveBeenCalledWith('a');
```

### 4. useSYSfetch.test.ts
测试 SYS 服务相关功能：

**覆盖场景：**
- ✅ GET 请求处理
- ✅ POST 请求处理
- ✅ 状态码处理 (200/非200)
- ✅ 错误处理和消息显示
- ✅ 回调函数支持
- ✅ 数据格式化

**重点测试：**
```typescript
// 状态码处理测试
mockService.get.mockResolvedValue({
  data: { statusCode: '403', message: '权限不足' }
});

const result = await useSysGet('/api/protected');
expect(result).toBeUndefined();
expect(ElMessage.error).toHaveBeenCalledWith('权限不足');
```

### 5. integration.test.ts
集成测试和端到端场景：

**覆盖场景：**
- ✅ 完整请求流程测试
- ✅ 模块间协作测试
- ✅ 实际使用场景模拟
- ✅ 并发请求处理
- ✅ 错误恢复机制
- ✅ TypeScript 类型支持

**重点测试：**
```typescript
// 用户登录流程模拟
const result = await hiHttp.useBusPost('/api/auth/login', loginData, {
  success_message: '登录成功',
  onSuccess: (data) => {
    localStorage.setItem('USERTOKEN', data.resultValue.token);
  }
});

expect(ElMessage.success).toHaveBeenCalledWith('登录成功');
expect(localStorage.setItem).toHaveBeenCalledWith('USERTOKEN', 'jwt-token');
```

## 模拟 (Mocks) 说明

### Axios 模拟
模拟 axios 请求和响应，支持：
- 请求方法模拟 (`get`, `post`)
- 响应数据格式化
- 拦截器模拟

### Element Plus 模拟
模拟 UI 组件库：
- `ElMessage` - 消息提示
- `ElMessageBox` - 确认框

### Hi-utils-pro 模拟
模拟工具函数：
- `getFormData` - FormData 转换
- `getFieldValueByPath` - 对象路径取值
- `getOmitProperties` - 对象属性过滤

## 测试最佳实践

### 1. 测试隔离
每个测试用例都是独立的，使用 `beforeEach` 重置模拟状态：

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // 重置环境变量和模拟数据
});
```

### 2. 数据驱动测试
对于多种情况的测试，使用数据驱动方式：

```typescript
const testCases = [
  { statusCode: '400', shouldSucceed: false },
  { statusCode: '401', shouldSucceed: false },
  { statusCode: '403', shouldSucceed: false }
];

for (const testCase of testCases) {
  // 执行测试...
}
```

### 3. 断言清晰
使用明确的断言和描述性的测试名称：

```typescript
it('应该处理必需参数检查', async () => {
  const result = await useBusGet('/api/users', { name: '' }, {
    param_not_null_key: 'name',
    param_not_null_key_tip: '名称不能为空'
  });

  expect(ElMessage.warning).toHaveBeenCalledWith('名称不能为空');
  expect(result).toBeUndefined();
});
```

## 覆盖率目标

当前目标覆盖率：
- **语句覆盖率**: ≥ 90%
- **分支覆盖率**: ≥ 85%  
- **函数覆盖率**: ≥ 95%
- **行覆盖率**: ≥ 90%

查看详细覆盖率报告：
```bash
npm run test:coverage
# 在浏览器中打开 coverage/lcov-report/index.html
```

## 持续集成

测试应该在以下情况下自动运行：
- 代码提交前 (pre-commit hook)
- Pull Request 创建时
- 主分支合并前
- 发布新版本前

## 故障排除

### 常见问题

1. **模块找不到错误**
   ```bash
   # 确保所有依赖都已安装
   npm install
   ```

2. **TypeScript 编译错误**
   ```bash
   # 检查 tsconfig.json 和 jest.config.ts 配置
   npx tsc --noEmit
   ```

3. **环境变量未生效**
   ```typescript
   // 确保在测试中正确设置了 mockImportMeta
   mockImportMeta({
     VITE_BUS_API_URL: 'http://test-api'
   });
   ```

4. **异步测试超时**
   ```typescript
   // 增加测试超时时间或使用 done 回调
   it('async test', async () => {
     // 测试代码...
   }, 10000); // 10秒超时
   ```

### 调试测试

```bash
# 运行单个测试文件并显示详细输出
npx jest --verbose defineService.test.ts

# 调试模式运行测试
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 贡献指南

添加新测试时请遵循：

1. **命名规范**: 测试文件以 `.test.ts` 结尾
2. **描述清晰**: 使用中文描述测试场景
3. **覆盖全面**: 包含正常情况、边界情况和错误情况
4. **模拟合理**: 只模拟外部依赖，不模拟被测试的代码
5. **断言准确**: 验证函数行为而非实现细节

## 更新日志

- **v1.0.0**: 初始测试套件完成
  - 完整的单元测试覆盖
  - 集成测试和端到端测试
  - 模拟系统和测试工具
  - 详细的测试文档