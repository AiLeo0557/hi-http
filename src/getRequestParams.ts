import { getFieldValueByPath } from "hi-utils-pro";
import { isString, isEmptyObject, isStrictObject } from "hi-datatype-operation"
import { createObjTypeGuard, createTupleTypeGuard } from "hi-guardian"
import { createValidator } from "hi-validator"
interface ParamConfigOptions {
  res_key_name?: string; // 响应数据名称
  params_type?: 'json_str' | 'json' | 'formData'; // 请求参数类型
  params_str?: string; // 请求参数
  contentType?: string; // 请求头
  responseType?: string; // 响应类型
  method?: string; // 请求方法
  params_filter?: string; // 请求参数过滤
  param_not_null?: string; // 参数不为空时，添加到请求参数中
  param_not_null_key?: string; // 参数不为空时，添加到请求参数中
  res_data_name?: string; // 响应列表数据名称
  res_total_name?: string; // 响应列表数据总数名称
  param_exclude_keys?: string; // 请求参数中需要排除的key
  param_not_null_key_tip?: string; // 参数不为空时，提示语
  success_message?: string; // 成功提示语
  defualt_data?: any; // 默认数据
  fail_message?: string; // 失败提示语
  onFormat?: (data: any) => any; // 格式化参数
  onFormatParams?: (data: any) => any; // 格式化参数
  onPrompt?: (data: any) => void; // 提示语
  onSuccess?: (data: any) => void; // 成功回调
  // [key: string]: any;
}
export type HiRequestArgument<T> = [
  url: string, // 请求地址
  param?: Array<T> | T, // 请求参数
  param_config_options?: ParamConfigOptions
]
const isParamConfigOptions = createObjTypeGuard<ParamConfigOptions>({})
const checkUrl = createValidator<string>(isString, 'url 必须是字符串')
const checkParam = createValidator<Record<string, any> | Array<any>>(isStrictObject, 'param 必须是对象或数组')
const checkParamConfigOptions = createValidator<ParamConfigOptions>(isParamConfigOptions, 'param_config_options 必须是对象')
export const isHiRequestArgument = createTupleTypeGuard<HiRequestArgument<any>>([
  checkUrl,
  checkParam,
  checkParamConfigOptions
], [0]);

/**
 * author: 杜朝辉
 * date: 2025-02-17
 * description: 获取请求参数
 * @param {Object} param_obj - 输入的对象
 * @param {Object} param_options - 配置项
 * @param {Object} data_source - 数据源
 */
export function getRequestParams(param_obj: Record<string, any>, param_options: Record<string, any>, data_source: Record<string, any>) {
  let params = {};
  /**
   * 形式一:
   * param_obj 的样式 { param1: 'value1', param2: 'value2' }
   * param_obj 的格式为对象,返回的param 的格式也为对象;
   */
  if (
    isStrictObject(param_obj) && // 过滤掉非对象
    !isEmptyObject(param_obj) // 过滤掉空对象 {}
  ) {
    // 遍历param_obj的每一项
    Object.entries(param_obj).forEach(([key, value]) => {
      // 获取参数名
      const param_key_name = Reflect.get(param_options, `param_${key}_key`);
      // 如果没有设置参数名，则直接使用对象的key作为参数名
      if (!param_key_name) {
        Reflect.set(params, key, value);
        return;
      }
      let param_value: any; // 获取参数值
      // 如果参数名包含runcode_，则执行代码
      if (param_key_name.includes('runcode_')) {
        const run_code = param_key_name.replace('runcode_', 'return '); // 获取代码
        const getRunResult = new Function('param_obj', run_code); // 创建函数
        param_value = getRunResult(param_obj); // 执行代码
      }
      // 如果参数名是数组，则获取数组中的每一项的值
      else if (Array.isArray(param_key_name)) {
        param_value = param_key_name.map((key_name: string) => getFieldValueByPath(key_name, data_source));
      }
      // 否则，获取参数值
      else {
        param_value = getFieldValueByPath(param_key_name, data_source); // 获取参数值
        // 如果参数值是字符串，且数值是数组，则转换为数组
        // "[formData.plantIds]" => ["formData.plantIds"]
        // if (isString(value) && isArray(param_value))
        // if (isArray(value) && isString(param_value)) {
        //   param_value = [param_value];
        // }
      }
      // value 的格式是字符串, param_value 的格式是数组
      // if (typeof value === 'string' && isArray(param_value)) {
      //   param_value = param_value.join(','); // 将数组转换为字符串
      // }
      // 设置参数
      Reflect.set(params, key, param_value);
    })
  }
  /**
   * 形式二:
   * 使用范围最小，只支持一个参数
   */
  if (
    param_options && // 过滤掉空对象 null
    Reflect.has(param_options, 'param_key_name') && // 过滤掉没有设置参数的配置项
    Reflect.has(param_options, 'param_value_name') // 过滤掉没有设置参数的配置项
  ) {
    // 获取参数名和参数值
    const param_key_name = Reflect.get(param_options, 'param_key_name');
    const param_value_name = Reflect.get(param_options, 'param_value_name');
    const param_value = getFieldValueByPath(param_value_name, data_source); // 获取参数值
    // 设置参数
    Reflect.set(params, param_key_name, param_value);
  }
  /**
   * 形式三:
   * param_obj 的样式 [{reatUser: '', userName: ''}]
   * param_obj 的格式为数组,返回的param 的格式也为数组;
   * 其中 createrUser、userName 是指数组中的每一项要追加的参数;
   */
  if (
    Array.isArray(param_obj) &&
    param_options?.param_value_name // param_value_name 不能为空
  ) {
    const param_value_name = Reflect.get(param_options, 'param_value_name');
    let param_value = getFieldValueByPath(param_value_name, data_source); // 获取参数值
    if (param_obj[0] && typeof param_obj[0] === 'object') {
      const param_item_supplement = getRequestParams(param_obj[0], param_options, data_source);
      param_value = param_value.map((item: any) => Object.assign(item, param_item_supplement));
    }
    params = param_value
  }
  return params;
}
