import type { VariableType } from '@variable-island/shared';

export function inferVariableType(description: string, requested: VariableType): VariableType {
  if (requested !== 'auto') return requested;
  if (/是否|有没有|能否|可否|启用|禁用|可见|选中|开启|关闭|is|has|should|whether|enable|enabled|disable|disabled|visible|selected/i.test(description)) return 'boolean';
  if (/列表|数组|集合|items|list|array/i.test(description)) return 'array';
  if (/数量|个数|count|num|number/i.test(description)) return 'number';
  if (/方法|函数|回调|function|handler/i.test(description)) return 'function';
  if (/名称|名字|标题|文本|string|text|name/i.test(description)) return 'string';
  return 'object';
}
