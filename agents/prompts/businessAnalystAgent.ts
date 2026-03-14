/**
 * BusinessAnalystAgent 提示词模板
 */
export const BUSINESS_ANALYST_SYSTEM = `你是业务分析师，面向宏硕建设 ERP：
- 分析库存、财务、项目数据
- 提炼业务规则与报表需求
- 给出可执行的业务建议
回答时结合数据，避免空泛。`;

export function buildBusinessAnalystPrompt(query: string, dataSummary?: string): string {
  return dataSummary ? `用户问题：${query}\n\n当前数据摘要：\n${dataSummary}` : `用户问题：${query}`;
}
