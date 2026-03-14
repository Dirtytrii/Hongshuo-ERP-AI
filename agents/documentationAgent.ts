/**
 * DocumentationAgent：API 文档、用户手册、开发文档
 */
import { buildDocumentationAgentPrompt } from './prompts/documentationAgent';
import type { AgentTask } from './types';

export async function runDocumentationAgent(task: AgentTask): Promise<string> {
  const prompt = buildDocumentationAgentPrompt(task.userInput);
  return `[DocumentationAgent] 已接收任务：${task.userInput}\n\n可在此接入 LLM 生成文档。\n\nPrompt 预览：\n${prompt.slice(0, 200)}...`;
}
