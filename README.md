# Hi-HTTP

一个基于 Axios 的轻量级 HTTP 请求库，为 Vue 应用提供简单、易用的接口请求解决方案。

[![NPM Version](https://img.shields.io/npm/v/hi-http.svg)](https://www.npmjs.com/package/hi-http)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 特性

- 🚀 基于 Axios 封装，提供更简洁的 API
- 🔑 内置请求参数处理与验证
- 📦 支持多种请求参数格式（JSON、FormData 等）
- 🔄 灵活的请求拦截与响应处理
- 💡 类型安全，基于 TypeScript 开发
- 🛠️ 支持 BUS 和 SYS 两种服务类型
- 📋 便捷的文件下载功能

## 安装

使用 npm:

```bash
npm install hi-http
```

使用 yarn:

```bash
yarn add hi-http
```

使用 pnpm:

```bash
pnpm add hi-http
```

## 依赖

该库需要以下 peer dependencies:

```json
"peerDependencies": {
  "axios": "^1.7.9",
  "dayjs": "^1.11.13",
  "element-plus": "^2.9.4",
  "hi-datatype-operation": "^1.0.5",
  "hi-guardian": "^1.0.4",
  "hi-utils-pro": "^1.0.3",
  "hi-validator": "^1.0.2",
  "vue-router": "^4.5.0"
}
```

## 使用方法

### 配置环境变量

在 `.env` 文件中配置 API 地址:

```
VITE_BUS_API_URL=http://your-api-url/bus
VITE_SYS_API_URL=http://your-api-url/sys
VITE_FILE_DOWNLOAD_API_URL=http://your-api-url/download
```

### 基本使用

#### BUS 服务

BUS 服务主要用于业务相关的 API 请求。

```typescript
import { useBusGet, useBusPost } from 'hi-http';

// 发起 GET 请求
const fetchData = async () => {
  const result = await useBusGet('/api/data', { page: 1, pageSize: 10 });
  console.log(result);
};

// 发起 POST 请求
const submitData = async () => {
  const result = await useBusPost('/api/submit', { 
    name: 'John',
    age: 30 
  });
  console.log(result);
};
```

#### SYS 服务

SYS 服务主要用于系统相关的 API 请求。

```typescript
import { useSysGet, useSysPost } from 'hi-http';

// 发起 GET 请求
const fetchSystemData = async () => {
  const result = await useSysGet('/api/system/config');
  console.log(result);
};

// 发起 POST 请求
const updateSystemData = async () => {
  const result = await useSysPost('/api/system/update', { 
    config: 'value'
  });
  console.log(result);
};
```

### 高级选项

#### 参数处理与请求配置

```typescript
import { useBusPost } from 'hi-http';

const submitForm = async () => {
  const data = await useBusPost(
    '/api/form/submit',
    { name: 'John', files: [...fileList] },
    {
      // 请求参数类型: json, formData, json_str
      params_type: 'formData',
      
      // 成功消息提示
      success_message: '提交成功',
      
      // 请求成功回调
      onSuccess: (data) => {
        console.log('请求成功:', data);
      },
      
      // 格式化返回数据
      onFormat: (data) => {
        return data.resultValue;
      },
      
      // 格式化请求参数
      onFormatParams: (params) => {
        return { ...params, timestamp: Date.now() };
      },
      
      // 自定义提示
      onPrompt: (data) => {
        // 自定义成功提示逻辑
      }
    }
  );
  
  return data;
};
```

#### 文件下载

```typescript
import { useBusDownload } from 'hi-http';

const downloadFile = async (fileId, fileName) => {
  await useBusDownload(fileId, fileName, '.pdf');
};
```

### 自定义服务

你可以使用 `defineService` 创建自定义服务：

```typescript
import { defineService } from 'hi-http';

// 创建自定义服务实例
const customService = defineService('BUS'); // 或者 'SYS'

// 使用自定义服务发起请求
const fetchData = async () => {
  const response = await customService.get('/api/custom', { params: { id: 1 } });
  return response.data;
};
```

### 请求参数处理

使用 `getRequestParams` 处理复杂请求参数：

```typescript
import { getRequestParams } from 'hi-http';

const params = getRequestParams(
  { userId: 'id', userName: 'name' },
  { 
    param_userId_key: 'user.id',
    param_userName_key: 'user.name'
  },
  { 
    user: { 
      id: 123,
      name: 'John'
    } 
  }
);

// 结果: { userId: 123, userName: 'John' }
```

## 响应数据结构

### BUS 服务响应

```typescript
interface BusResponse<T> {
  successful: boolean;
  success: boolean;
  message: string;
  resultValue: T;
  resultHint: string;
}
```

### SYS 服务响应

```typescript
interface SysResponse<T> {
  statusCode: string;
  message: string;
  result: T;
  logLevel: string;
}
```

## API 参考

### 主要函数

| 函数 | 描述 |
| --- | --- |
| `useBusGet` | 发起 BUS 服务 GET 请求 |
| `useBusPost` | 发起 BUS 服务 POST 请求 |
| `useBusDownload` | 下载文件 |
| `useSysGet` | 发起 SYS 服务 GET 请求 |
| `useSysPost` | 发起 SYS 服务 POST 请求 |
| `defineService` | 创建自定义服务实例 |
| `getRequestParams` | 处理复杂请求参数 |

### 请求选项

| 选项 | 类型 | 描述 |
| --- | --- | --- |
| `params_type` | `'json_str' \| 'json' \| 'formData'` | 请求参数类型 |
| `contentType` | `string` | 请求内容类型 |
| `responseType` | `string` | 响应类型 |
| `success_message` | `string` | 成功提示信息 |
| `fail_message` | `string` | 失败提示信息 |
| `onSuccess` | `(data: any) => void` | 成功回调函数 |
| `onFormat` | `(data: any) => any` | 响应数据格式化 |
| `onFormatParams` | `(data: any) => any` | 请求参数格式化 |
| `onPrompt` | `((data: any) => void) \| boolean` | 自定义提示 |
| `param_not_null_key` | `string` | 必需参数键名 |
| `param_not_null_key_tip` | `string` | 必需参数缺失提示 |

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 许可证

[ISC](LICENSE)
