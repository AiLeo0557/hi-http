import { defineService, HiResponseData, type HiRequestOptions } from './defineService'
import { ElMessage } from 'element-plus'
// import type { HiRequestOptions, HiResponseData } from '@types/global'

const service = defineService('SYS')
// const store = useUserStore()
// const { appId } = storeToRefs(store)
export const useSysGet = async (url: string) => {
  try {
    const res = await service.get(url)
    const { statusCode, message, result } = res.data
    if (statusCode !== '200') {
      throw new Error(message)
    }
    return Promise.resolve(result)
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
export async function useSysPost<T>(url: string, params: any = {}, options?: HiRequestOptions<T>) {
  try {
    // params.appId = appId.value
    const res: { data: HiResponseData<T> } = await service.post(url, params)
    const { statusCode, message, result, logLevel } = res.data
    if (statusCode !== '200') {
      options?.onFail?.(res.data)
      throw new Error(message)
    }
    options?.onSuccess?.(res.data)
    if (options?.onFormat !== undefined) {
      return options?.onFormat(res.data)
    }
    return Promise.resolve(result)
  } catch (error: any) {
    ElMessage.error(`${url}:${error.message}`)
  }
}
// export { useSysGet, useSysPost }
