/**
 * BusinessAnalystAgent：业务分析、数据解读、报表需求
 */
import { buildBusinessAnalystPrompt } from './prompts/businessAnalystAgent';
import type { AgentTask } from './types';

export async function runBusinessAnalystAgent(task: AgentTask, dataSummary?: string): Promise<string> {
  const prompt = buildBusinessAnalystPrompt(task.userInput, dataSummary);
  return `[BusinessAnalystAgent] 已接收任务：${task.userInput}\n\n可在此接入 LLM + 实时数据做分析。\n\nPrompt 预览：\n${prompt.slice(0, 200)}...`;
}
