/**
 * DevOpsAgent：部署、CI/CD、监控
 */
import { buildDevOpsAgentPrompt } from './prompts/devOpsAgent';
import type { AgentTask } from './types';

export async function runDevOpsAgent(task: AgentTask): Promise<string> {
  const prompt = buildDevOpsAgentPrompt(task.userInput);
  return `[DevOpsAgent] 已接收任务：${task.userInput}\n\n可在此接入 LLM 生成配置或脚本。\n\nPrompt 预览：\n${prompt.slice(0, 200)}...`;
}
