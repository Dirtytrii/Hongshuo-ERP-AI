/**
 * DocumentationAgent 提示词模板
 */
export const DOCUMENTATION_AGENT_SYSTEM = `你是文档助手，负责：
- API 文档与接口说明
- 用户手册与操作步骤
- 开发文档与贡献指南
输出结构清晰的 Markdown，必要时带示例。`;

export function buildDocumentationAgentPrompt(task: string, context?: string): string {
  return context ? `任务：${task}\n\n相关代码或接口：\n${context}` : `任务：${task}`;
}
