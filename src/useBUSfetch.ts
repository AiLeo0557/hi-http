import { defineService } from './defineService'
import { ElMessage } from 'element-plus'
import { HiResponseData } from './defineService'
import { getFormData, getOmitProperties } from 'hi-utils-pro'
import { type HiRequestArgument } from './getRequestParams'

const service = defineService('BUS')
const useBusGet = async <T>(...args: HiRequestArgument<T>) => {
  const [url, _params, options] = args
  let [_url, params, _options] = args
  if (options?.onFormatParams) {
    params = options?.onFormatParams(params)
  }
  if (options?.param_not_null_key && !Reflect.get(params as object, options?.param_not_null_key)) {
    if (options?.param_not_null_key_tip) {
      ElMessage.warning(options.param_not_null_key_tip)
    }
    options?.onSuccess?.({
      data: [],
      total: 0
    })
    return
  }
  const res = await service.get(url, { params })
  const { successful, success, message, resultValue, resultHint } = res.data
  if (successful === false || success === false) {
    return
  }
  if (options?.onPrompt || options?.success_message) {
    if (typeof options?.onPrompt === 'function') {
      options?.onPrompt(res.data)
    } else {
      ElMessage.success(message || resultHint || options?.success_message)
    }
  }
  options?.onSuccess?.(options?.onFormat !== undefined ? options?.onFormat(res.data) : res.data)
  if (options?.onFormat !== undefined) {
    return options?.onFormat(res.data)
  }
  return Promise.resolve(resultValue || res.data || res)
}
const useBusPost = async <T>(...args: HiRequestArgument<T>) => {
  const [url, _params, options]: any = args
  let [_url, params, _options]: any = args
  if (options?.default_data) {
    if (options?.onFormat !== undefined) {
      options?.onSuccess(options.default_data)
      return Promise.resolve(options?.onFormat(options.default_data))
    }
  }
  if (options?.onFormatParams) {
    params = options?.onFormatParams(params)
  }
  if (options?.param_not_null_key && !Reflect.get(params, options?.param_not_null_key)) {
    if (options?.param_not_null_key_tip) {
      ElMessage.warning(options.param_not_null_key_tip)
    }
    options?.onSuccess?.({
      data: [],
      total: 0
    })
    return
  }
  if (options?.params_type === 'formData') {
    params = getFormData(params)
  }
  if (options?.params_type === 'json_str') {
    const { page, pageSize, ...rest } = params
    params = options?.params_str.replace(/{{(.*?)}}/g, (_: any, str: string) => {
      if (str === 'form_data_str') {
        let res: any = options?.param_exclued_keys
          ? getOmitProperties(rest, options?.param_exclued_keys)
          : rest
        res = new URLSearchParams(getFormData(res) as any)
        res = res.toString()
        return res
      }
      return Reflect.get(params, str)
    })
  }
  if (options?.params_filter) {
    if (options?.params_filter.includes(',')) {
      const saved_keys = options?.params_filter.split(',')
      Object.keys(params).forEach((key: string) => {
        if (!saved_keys.includes(key)) {
          Reflect.deleteProperty(params, key)
        }
      })
    } else {
      Object.keys(params).forEach((key: string) => {
        if (key === 'file_selected_option') {
          Object.assign(params, { ...params.file_selected_option })
          Reflect.deleteProperty(params, 'file_selected_option')
        }
        if (options.params_filter !== key) {
          Reflect.deleteProperty(params, key)
        }
      })
    }
  }

  let post_options: any = {
    responseType: options?.responseType || 'json'
  }
  // if (options?.contentType) {
  //   post_options.transformRequest = [
  //     (data: any, headers?: any) => {
  //       if (options?.contentType) {
  //         headers['Content-Type'] = options?.contentType
  //       }
  //       return JSON.stringify(data)
  //     }
  //   ]
  // }
  if (options?.contentType) {
    post_options.transformRequest = (data: any, headers?: any) => {
      headers['Content-Type'] = options?.contentType
      return data
    }
  }
  const res: {
    res: { successful: true; message: string }
    statusText: string
    status: number
    data: HiResponseData<T>
  } = await service.post(url, params, post_options)
  if (!res) {
    return
  }
  if (res.data === null && res.status === 200 && res.statusText === 'OK') {
    ; (res.data as any) = {
      successful: true,
      message: ''
    }
  }
  const { successful, success, message, resultValue, resultHint } = res.data
  if (successful === false || success === false) {
    return
  }
  if (options?.onPrompt || options?.success_message) {
    if (typeof options?.onPrompt === 'function') {
      options?.onPrompt(res.data)
    } else {
      ElMessage.success(message || resultHint || options?.success_message)
    }
  }
  options?.onSuccess?.(options?.onFormat !== undefined ? options?.onFormat(res.data) : res.data)
  if (options?.onFormat !== undefined) {
    return Promise.resolve(options?.onFormat(res.data))
  }
  let res_value = resultValue || res.data || res
  return Promise.resolve(res_value)
}
const useBusDownload = async (fileid: string, filename: string, file_suffix?: string) => {
  const res = await useBusPost(
    `${Reflect.get((import.meta as any).env, `VITE_FILE_DOWNLOAD_API_URL`)}/${fileid}`,
    {},
    { responseType: 'blob' }
  )
  const blob = new Blob([res])
  const a = document.createElement('a')
  const parentTag = document.getElementById('app')
  a.href = window.URL.createObjectURL(blob)
  a.download = file_suffix ? filename + file_suffix : filename
  parentTag!.insertBefore(a, null)
  a.click()
  parentTag!.removeChild(a)
}
export { useBusGet, useBusPost, useBusDownload }
