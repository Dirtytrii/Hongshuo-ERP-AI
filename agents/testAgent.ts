/**
 * TestAgent：测试用例设计、自动化测试、覆盖率
 */
import { buildTestAgentPrompt } from './prompts/testAgent';
import type { AgentTask } from './types';

export async function runTestAgent(task: AgentTask): Promise<string> {
  const prompt = buildTestAgentPrompt(task.userInput);
  return `[TestAgent] 已接收任务：${task.userInput}\n\n可在此接入 LLM 生成测试代码或步骤。\n\nPrompt 预览：\n${prompt.slice(0, 200)}...`;
}
