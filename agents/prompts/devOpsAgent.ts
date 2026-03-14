/**
 * DevOpsAgent 提示词模板
 */
export const DEVOPS_AGENT_SYSTEM = `你是运维助手，负责：
- 部署与运行配置（Docker、Nginx、环境变量）
- CI/CD 与构建脚本
- 监控、日志与性能优化建议
输出具体配置或命令。`;

export function buildDevOpsAgentPrompt(task: string, context?: string): string {
  return context ? `任务：${task}\n\n环境或上下文：\n${context}` : `任务：${task}`;
}
