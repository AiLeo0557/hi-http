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

## 快速开始

1. **安装并配置环境变量**

```bash
# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env 文件，设置你的 API 地址
```

2. **基本使用**

```typescript
import { useBusGet, useBusPost } from 'hi-http';

// GET 请求
const users = await useBusGet('/api/users', { page: 1 });

// POST 请求
const result = await useBusPost('/api/users', { name: 'John' });
```

3. **启用加密（可选）**

```bash
# 安装加密依赖
npm install sm-core
```

```env
# 在 .env 中设置
VITE_ENCRYPT_ENABLED=true
VITE_SM2PUBKEY=your_sm2_public_key
VITE_HEADCRC=your_head_crc
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

在 `.env` 文件中配置 API 地址和加密相关设置:

#### 基本配置

```env
# API 地址配置
VITE_BUS_API_URL=http://your-api-url/bus
VITE_SYS_API_URL=http://your-api-url/sys
VITE_FILE_DOWNLOAD_API_URL=http://your-api-url/download
```

#### 加密配置（可选）

```env
# 是否启用加密（默认: false）
VITE_ENCRYPT_ENABLED=true

# SM2 公钥（必需，当加密启用时）
VITE_SM2PUBKEY=your_sm2_public_key

# 头部校验码（必需，当加密启用时）
VITE_HEADCRC=your_head_crc

# SM2 私钥（可选）
VITE_SM2PRIKEY=your_sm2_private_key

# 传输模式（默认: false）
VITE_TRANSMISSION_MODE=true

# 加密调试模式（默认: false）
VITE_ENCRYPT_DEBUG=true
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

### 加密功能

hi-http 支持基于 SM2/SM4 的加密功能，可以通过环境变量灵活控制。

#### 启用加密

1. 在 `.env` 文件中设置加密配置:

```env
VITE_ENCRYPT_ENABLED=true
VITE_SM2PUBKEY=your_sm2_public_key
VITE_HEADCRC=your_head_crc
```

2. 安装 `sm-core` 依赖:

```bash
npm install sm-core
```

3. 加密将自动应用到所有请求中。

#### 加密特性

- **动态加载**: 只有在启用加密时才加载 `sm-core` 模块
- **自动降级**: 加密失败时自动使用普通模式
- **调试模式**: 通过 `VITE_ENCRYPT_DEBUG=true` 查看加密过程
- **灵活配置**: 支持多种加密参数配置

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

### 加密配置 API

你可以使用以下 API 来检查和获取加密配置：

```typescript
import { getHiHttpEncryptConfig, isEncryptEnabled } from 'hi-http';

// 检查加密是否启用
if (isEncryptEnabled()) {
  console.log('加密已启用');
}

// 获取当前加密配置
const encryptConfig = getHiHttpEncryptConfig();
console.log('加密配置:', {
  enabled: encryptConfig.enabled,
  hasSM2PubKey: !!encryptConfig.SM2PubKey,
  transmissionMode: encryptConfig.transmissionMode
});
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
| `getHiHttpEncryptConfig` | 获取当前加密配置 |
| `isEncryptEnabled` | 检查加密是否启用 |

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
