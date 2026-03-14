/**
 * 多 Agent 协作类型定义
 */
export type AgentType = 'code' | 'test' | 'business' | 'devops' | 'documentation';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface AgentTask {
  id: string;
  type: AgentType;
  userInput: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  createdAt: string;
}

export interface OrchestratorResult {
  route: AgentType;
  taskId: string;
  message: string;
}
