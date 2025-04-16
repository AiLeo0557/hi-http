// import SmCore from 'sm-core'
import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { isUndefined } from 'hi-datatype-operation';
//  AxiosError, AxiosRequestConfig,
/**
 * author: 杜朝辉
 * date: 2025-02-21
 * description: 定义服务
 */
const sm4key = new Array(16).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
// 解析堆栈帧
const parseStackFrame = (stackFrame: any) => {
  const match = stackFrame.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
  if (match) {
    return {
      functionName: match[1],
      fileName: match[2],
      lineNumber: match[3],
      columnNumber: match[4],
    };
  }
}
let SM2PubKey = ''
let headCRC = ''
if (Reflect.has(import.meta, 'env')) {
  SM2PubKey = Reflect.get((import.meta as any).env, 'VITE_SM2PUBKEY');
  headCRC = Reflect.get((import.meta as any).env, 'VITE_HEADCRC');
}
// const sm = new SmCore({
//   SM2PubKey,
//   headCRC,
//   SM2PriKey: '',
// })
let modeChaged = false;
let flag = false;
export function defineService(type: HiServiceType) {
  let accessToken = ''
  if (typeof window !== 'undefined') {
    console.log('localStorage:', window?.localStorage);
    accessToken = window?.localStorage?.getItem('USERTOKEN');
  }
  let baseURL = ''
  if (Reflect.has(import.meta, 'env')) {
    baseURL = Reflect.get((import.meta as any).env, `VITE_${type}_API_URL`);
  }
  const service = axios.create({
    baseURL,
    timeout: 30000
  })

  // Request拦截器
  service.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>): Promise<InternalAxiosRequestConfig<any>> => {
      const { url, method } = config
      const route = useRoute()
      const sysTime = new Date().getTime()
      const sign: AxiosConfigHeaderSign = {
        data: JSON.stringify(config.data || config.params) || 'OK',
        sysTime,
        sign: `${sysTime}${accessToken}${url}${method}${route.name as string}`,
        sm4Key: sm4key,
      }
      if (!accessToken) {
        sign.accessToken = ''
      }
      config.headers = {
        transmissionMode: false, // 传输模式
        catalog: route.name as string, // 菜单名称
        accessToken,
        sysTime,
        // sign: sm.encrypt(sign),
      } as any
      return config
    },
    (error: Error) => {
      return Promise.reject(error)
    }
  )
  // Response拦截器
  service.interceptors.response.use(
    (response: AxiosResponse) => {
      const { data } = response
      if (!data) {
        return response
      }
      try { } catch (error: any) {
        const { response, status = '-', config, stack, message } = error
        console.groupCollapsed(
          `%chttpCode:${status} 请求地址:${config?.url} 请求方法:${config?.method} 错误信息:${message}`,
          'color: red; font-size: 20px;'
        )
        const stackFrames = stack.split('\n')
        stackFrames?.slice(1).forEach((frame: string) => {
          const { functionName, fileName, lineNumber, columnNumber }: any = parseStackFrame(frame)
          console.log(`%c${functionName} ${fileName}:${lineNumber}:${columnNumber}`, 'color: blue;')
        })
        console.groupEnd()
        if (!response) {
          return
        }
        const msg = response?.data?.message
        switch (response.status) {
          case 400:
            ElMessage.error(msg || '数据被篡改!')
            break
          case 401:
            ElMessage.error(msg || '登录已过期，请重新登录')
            break
          case 403:
            ElMessage.error(msg || '请求被禁用!')
            break
          case 404:
            ElMessage.error(msg || '请求资源不存在')
            break
          case 500:
            ElMessage.error(msg || '服务器内部错误')
            break
          case 603:
            flag = true
            ElMessageBox.confirm(
              msg,
              '请求失败',
              {
                confirmButtonText: '重新登录',
                type: 'error',
                showClose: false,
                showCancelButton: false,
              }
            ).then(() => {
              const router = useRouter()
              flag = false
              router.replace({ name: 'login' })
            })
            break
          case 709:
            if (!modeChaged) {
              modeChaged = true
              const curr = sessionStorage.getItem('transmissionMode')
              sessionStorage.setItem('transmissionMode', curr === 'true' ? 'false' : 'true')
              setTimeout(
                () => {
                  window.location.reload()
                },
                700
              )
            }
            break
          default:
            ElMessage.error(msg || '请求失败')
            if (!response) {
              if (msg.includes('timeout')) {
                ElMessage.error('请求超时,请检查网络是否连接正常')
              } else {
                ElMessage.error('请求失败,请检查网络是否已连接')
              }
            }
            return Promise.reject(response)
        }
      }
    }
  )
  return service
}
export type HiServiceType = 'SYS' | 'BUS'
export interface AxiosConfigHeaderSign {
  accessToken?: string,
  data: string,
  sign: string,
  sysTime: number,
  sm4Key: string,
}
