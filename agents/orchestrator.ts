/**
 * 协调器：分析用户请求并路由到对应 Agent，汇总结果
 * CodeAgent 已移除，代码类请求返回提示。
 */
import type { AgentType, AgentTask, TaskStatus } from './types';
import { runTestAgent } from './testAgent';
import { runBusinessAnalystAgent } from './businessAnalystAgent';
import { runDevOpsAgent } from './devOpsAgent';
import { runDocumentationAgent } from './documentationAgent';

const AGENT_ROUTE_KEYWORDS: Record<AgentType, string[]> = {
  code: ['代码', 'bug', '修复', '重构', '实现', '写一个', '函数', '组件', 'api'],
  test: ['测试', '单测', '覆盖率', 'vitest', 'junit', '用例'],
  business: ['分析', '报表', '数据', '库存', '财务', '项目', '业务', '统计'],
  devops: ['部署', 'docker', 'ci', 'cd', 'nginx', '监控', '性能'],
  documentation: ['文档', '说明', 'api 文档', '手册', 'readme'],
};

function routeUserInput(userInput: string): AgentType {
  const lower = userInput.toLowerCase().trim();
  for (const [agent, keywords] of Object.entries(AGENT_ROUTE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return agent as AgentType;
  }
  return 'business';
}

function createTask(userInput: string, route: AgentType): AgentTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: route,
    userInput,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  };
}

/**
 * 同步执行：路由 -> 调用对应 Agent -> 返回结果
 */
export async function runOrchestrator(
  userInput: string,
  options?: { dataSummary?: string }
): Promise<{ route: AgentType; taskId: string; status: TaskStatus; result: string }> {
  const route = routeUserInput(userInput);
  const task = createTask(userInput, route);

  let result: string;
  try {
    switch (route) {
      case 'code':
        result = '代码类 Agent 已移除，请使用 AI 决策室进行业务分析与查询。';
        break;
      case 'test':
        result = await runTestAgent(task);
        break;
      case 'business':
        result = await runBusinessAnalystAgent(task, options?.dataSummary);
        break;
      case 'devops':
        result = await runDevOpsAgent(task);
        break;
      case 'documentation':
        result = await runDocumentationAgent(task);
        break;
      default:
        result = await runBusinessAnalystAgent(task, options?.dataSummary);
    }
  } catch (e) {
    result = `Agent 执行失败：${e instanceof Error ? e.message : String(e)}`;
    task.status = 'failed';
    task.error = result;
    return { route, taskId: task.id, status: 'failed', result };
  }

  task.status = 'completed';
  task.result = result;
  return { route, taskId: task.id, status: 'completed', result };
}
