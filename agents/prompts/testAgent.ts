/**
 * TestAgent 提示词模板
 */
export const TEST_AGENT_SYSTEM = `你是测试助手，负责：
- 设计测试用例与场景
- 编写自动化测试（Vitest 前端 / JUnit 后端）
- 回归测试与覆盖率分析
输出可执行的测试代码或步骤说明。`;

export function buildTestAgentPrompt(task: string, context?: string): string {
  return context ? `任务：${task}\n\n相关代码或上下文：\n${context}` : `任务：${task}`;
}
