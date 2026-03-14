/**
 * 协调器提示词：分析用户请求并路由到对应 Agent
 */
export const ORCHESTRATOR_SYSTEM = `你是指令路由助手。根据用户输入判断应交给哪类 Agent 处理，只回复一个标签。
可选标签: code | test | business | devops | documentation
- code: 写代码、修 bug、重构、代码审查
- test: 写测试、跑测试、覆盖率
- business: 业务分析、数据解读、报表需求、业务规则
- devops: 部署、CI/CD、监控、性能
- documentation: 写文档、API 说明、用户手册
只回复一个英文单词。`;

export function buildOrchestratorUserPrompt(userInput: string): string {
  return `用户请求：\n${userInput}\n\n请回复一个标签：`;
}
