import SmCore from 'sm-core'
import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

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
const sm = new SmCore({
  SM2PubKey,
  headCRC,
  SM2PriKey: '',
})
let modeChanged = false;
let flag = false; // 解决多次弹出登录框
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
      let { pathname } = window.location
      const _arr = pathname.split('/')
      pathname = _arr[_arr.length - 1]
      const sysTime = new Date().getTime()
      const sign: AxiosConfigHeaderSign = {
        data: JSON.stringify(config.data || config.params) || 'OK',
        sysTime,
        sign: `${sysTime}${accessToken}${url}${method}${pathname}`,
        sm4Key: sm4key,
      }
      if (!accessToken) {
        sign.accessToken = ''
      }
      console.log(69, 'sign:', sm.encrypt(sign))
      config.headers = {
        transmissionMode: false, // 传输模式
        catalog: pathname, // 菜单名称
        accessToken,
        sysTime,
        sign: sm.encrypt(sign)._sign,
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
      try {
        const { remarks, resultHint, successful, resultValue, success, message, statusCode, sV } = data
        if (remarks === 'isKey') {
          ElMessage.success(message)
        }
        const nowtime = new Date().getTime()
        // 只是再第一个接口请求的时候，对timeOut进行修改值
        // if (request.responseURL.includes('getSystemConfig')) {
        //   store.setTimeouts(sV - nowtime)
        // }
        // statusCode === '603' Token无效
        if (successful === false || success === false || statusCode === '603') {
          throw new Error(resultHint || message || resultValue)
        }
        return response
      } catch (error: any) {
        const { response, status = '-', config, stack, message } = error
        ElMessage.error(message)
        if (response?.data?.statusCode == 603 && !flag) {
          flag = true
          ElMessageBox.confirm(`${message}`, '请求失败', {
            confirmButtonText: '重新登录',
            type: 'error',
            showClose: false,
            showCancelButton: false
          }).then(() => {
            // store.$reset()
            flag = false
            // router.replace({ name: 'login' })
            window.location.replace('/login')
          })
        }
        return response
      }
    },
    (error: AxiosError<any, any>) => {
      const { response, status = '-', config, stack, message } = error
      console.groupCollapsed(
        `%chttpCode:${status} request url: ${config ? config.url : '-'} `,
        'color:red'
      )
      console.log('message:', message)
      const stackFrames = stack?.split('\n')
      stackFrames?.slice(1)?.forEach((frame, index) => {
        const parsedFrame = parseStackFrame(frame) || {}
        /**
         * todo: 实现点击跳转
         */
        Object.entries(parsedFrame).forEach(([k, v]) => { })
      })
      console.groupEnd()
      if (!response) {
        return
      }
      const msg = response!.data!.message
      // 网络GG
      if (response.status === 400) {
        ElMessage.error('数据被篡改')
      } else if (response.status === 403) {
        ElMessage.error('请求被禁用')
      }
      if (response.status === 709) {
        if (!modeChanged) {
          modeChanged = true
          const curr = sessionStorage.getItem('transmissionMode')
          sessionStorage.setItem('transmissionMode', curr == 'false' ? 'true' : 'false')
          setTimeout(() => {
            window.location.reload()
          }, 700)
        }
      }
      if ((response.status == 603 || response.data.statusCode == 603) && !flag) {
        flag = true
        ElMessageBox.confirm(`${msg}`, '请求失败', {
          confirmButtonText: '重新登录',
          type: 'error',
          showClose: false,
          showCancelButton: false
        }).then(() => {
          // store.$reset()
          flag = false
          // router.replace({ name: 'login' })
          window.location.replace('/login')
        })
      }
      if (
        response.status != 200 &&
        response.status != 708 &&
        response.status !== 403 &&
        response.status !== 400 &&
        response.status !== 709 &&
        response.status !== 603 &&
        !((response as any).status instanceof Blob)
      ) {
        ElMessage.error(msg)
      } else if (!response) {
        // 请求超时状态
        if (msg.includes('timeout')) {
          ElMessage.error('请求超时，请检查网络是否连接正常')
        } else {
          // 可以展示断网组件
          ElMessage.error('请求失败，请检查网络是否已连接')
        }
        return
      }
      // do something 拦截响应
      return Promise.reject(error)
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
type ParamsType = 'json_str' | 'formData' | 'json'
export interface HiRequestOptions<T> {
  params_type?: ParamsType
  onSuccess?: (res: any) => void
  onFormat?: (res: any) => any
  onFail?: (res: any) => void
  onFormatParams?: (res: any) => any // 格式化提交参数
  fail_message?: string // 请求失败自定义消息
  success_message?: string // 请求成功自定义消息
  onPrompt?: boolean | ((res: any) => void) // 自定义请求提示
  responseType?: ResponseType // 请求类型
  param_not_null_key?: string // 用于阻止默认请求
  param_not_null_key_tip?: string // 用于阻止默认请求后提示
  params_filter?: any
  res_key_name?: string // 返回数据字段名称
  // params_type?: 'json_str' | 'json' | 'formData'
  params_str?: string
  contentType: string
  /**
   * 格式化 table row data
   * electricPriceFiles/电价政策文件
   * itemFiles: [{documentId, originalAllFilename, originalFilename}]}
   */
  format_table_row_data: {
    format_key: string // 待格式化字段名称
    format_type: string // 待格式化字段类型
    format_content: string // 待格式化字段内容
  }
  res_data_name?: string // 表格数据对应字段名称
  res_total_name?: string // 表格数据总数对应字段
}
export interface HiResponseData<T> {
  logLevel: string
  message: string
  remarks: string
  sV: number
  statusCode: '200' | '603' | '708'
  result?: T
  successful?: boolean // 请求是否成功
  success?: boolean // 请求是否成功
  resultValue?: T
  resultHint?: string // 请求结果提示语
}