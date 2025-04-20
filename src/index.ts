// import { defineService } from './defineService';
// import {
//   getFormData,
//   getFiltedObjByFields,
//   type HiRequestArgument,
// } from 'hi-utils-pro';
// import { ElMessage } from 'element-plus';

// import { isFunction, isString } from 'hi-datatype-operation';
// /**
//  * author: 杜朝辉
//  * date: 2025-02-21
//  * description: 处理 post 请求
//  */
// const service = defineService('BUS')

// export async function useGet(...args: HiRequestArgument<any>) {
//   const [url, , options] = args
//   let [, params] = args
//   const {
//     res_data_name,
//     params_type,
//     param_not_null_key,
//     param_not_null_key_tip,
//     params_str,
//     contentType,
//     res_total_name,
//     param_exclude_keys,
//     success_message,
//     onFormat,
//     onFormatParams,
//     onPrompt,
//     onSuccess,
//   } = options
//   if (onFormatParams) {
//     params = onFormatParams(params)
//   }
//   if (param_not_null_key && !params[param_not_null_key]) {
//     if (param_not_null_key_tip) {
//       ElMessage.warning(param_not_null_key_tip);
//     }
//     return
//   }
//   const res = await service.get(url, params)
//   const { successful, success, message, resultValue, resultHint } = res.data
//   if (successful === false || success === false) {
//     return
//   }
//   if (onPrompt || success_message) {
//     if (isFunction(onPrompt)) {
//       onPrompt(resultHint)
//     } else {
//       ElMessage.success(message || resultHint || success_message)
//     }
//   }
//   onSuccess?.call(null, isFunction(onFormat) ? onFormat(res.data) : res.data)
//   if (isFunction(onFormat)) {
//     return onFormat(res.data)
//   }
//   return Promise.resolve(res.data)
// }
// export async function usePost(...args: HiRequestArgument<any>) {
//   const [url, , options] = args
//   let [, params] = args
//   const {
//     res_data_name,
//     params_type,
//     param_not_null_key,
//     param_not_null_key_tip,
//     params_str,
//     params_filter,
//     contentType,
//     res_total_name,
//     param_exclude_keys,
//     onFormat,
//     onSuccess,
//     onFormatParams,
//     onPrompt,
//     success_message,
//     defualt_data,
//     responseType,
//   } = options
//   if (defualt_data) {
//     if (isFunction(onSuccess)) {
//       onSuccess(defualt_data)
//     }
//     if (isFunction(onFormat)) {
//       return Promise.resolve(onFormat(defualt_data))
//     }
//   }
//   if (onFormatParams) {
//     params = onFormatParams(params)
//   }
//   if (param_not_null_key && !params[param_not_null_key]) {
//     if (param_not_null_key_tip) {
//       ElMessage.warning(param_not_null_key_tip);
//     }
//     return
//   }
//   if (params_type === 'formData') {
//     params = getFormData(params)
//   }
//   if (params_type === 'json_str' && isString(params_str)) {
//     const { page, pageSize, ...rest } = params
//     params = params_str?.replace(/{{(.*?)}}/g, (_: any, key: string): string => {
//       if (key === 'form_data_str') {
//         let res: any = param_exclude_keys ? getFiltedObjByFields(rest, param_exclude_keys) : rest
//         res = getFormData(res)
//         res = new URLSearchParams(res).toString()
//         return res
//       }
//       return params[key] || ''
//     })
//   }
//   if (params_filter) {
//     Object.keys(params).forEach(key => {
//       if (key === 'file_selected_option') {
//         Object.assign(params, { ...params.file_selected_option })
//         Reflect.deleteProperty(params, 'file_selected_option')
//       }
//     })
//     params = getFiltedObjByFields(params, params_filter)
//   }
//   let post_options: any = {
//     responseType: responseType || 'json',
//   }
//   if (contentType) {
//     post_options.transformRequest = (data: any, headers?: any) => {
//       headers['Content-Type'] = contentType
//       return data
//     }
//   }
//   let res = await service.post(url, params, post_options)
//   if (!res) {
//     return
//   }
//   // 处理接口请求成功,数据为空的情况;
//   if (res.data === null && res.status === 200 && res.statusText === 'OK') {
//     ; (res.data as any) = {
//       successful: true,
//       message: ''
//     }
//   }
//   const { successful, success, message, resultValue, resultHint } = res.data
//   if (successful === false || success === false) {
//     return
//   }
//   if (onPrompt || success_message) {
//     if (isFunction(onPrompt)) {
//       onPrompt(resultHint)
//     } else {
//       ElMessage.success(message || resultHint || success_message)
//     }
//   }
//   onSuccess?.call(null, isFunction(onFormat) ? onFormat(res.data) : res.data)
//   if (isFunction(onFormat)) {
//     return Promise.resolve(onFormat(res.data))
//   }
//   let res_value = resultValue || res.data || res
//   return Promise.resolve(res_value)
// }
// /**
//  * author: 杜朝辉
//  * date: 2025-02-22
//  * description: 下载处理
//  */

// export async function useDownload(fileid: string, filename: string, file_suffix?: string) {
//   const res = await usePost(
//     `${Reflect.get((import.meta as any).env, 'VITE_DOWNLOAD_API')}${fileid}`,
//     {},
//     { responseType: 'blob' }
//   )
//   const blob = new Blob([res])
//   const a = document.createElement('a')
//   const parentTag = document.getElementById('app')
//   a.href = window.URL.createObjectURL(blob)
//   a.download = file_suffix ? filename + file_suffix : filename
//   parentTag!.insertBefore(a, null)
//   a.click()
//   parentTag!.removeChild(a)
// }
// // "@hi-block/validator": "workspace:*",
// // "axios": "^0.21.1",
// // "fastify": "^3.15.0",
// // "fastify-cors": "^5.0.2",
// // "fastify-formbody": "^3.0.0",
// // "fastify-socket.io": "^5.0.0",
// // "fastify-swagger": "^7.0.0",
// // "fastify-swagger-ui": "^2.0.0",
export * from './useBUSfetch'
export * from './useSYSfetch'
export * from './getRequestParams'