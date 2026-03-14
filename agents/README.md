# 多 Agent 协作架构

本目录实现宏硕 ERP 的多 Agent 协作骨架，便于后续接入 LLM（如 Gemini）与工具调用。

## 结构

- **orchestrator.ts**：协调器，根据用户输入路由到对应 Agent，并汇总结果。
- **codeAgent.ts**：代码助手（代码生成、重构、Bug 修复）。
- **testAgent.ts**：测试助手（用例设计、自动化测试）。
- **businessAnalystAgent.ts**：业务分析师（数据分析、报表需求）。
- **devOpsAgent.ts**：运维助手（部署、CI/CD、监控）。
- **documentationAgent.ts**：文档助手（API 文档、用户手册）。
- **prompts/**：各 Agent 的提示词模板。
- **tools/**：工具占位（lint、测试、文件读写等）。
- **types.ts**：任务与状态类型。

## 使用方式

```ts
import { runOrchestrator } from './agents/orchestrator';

const { route, result } = await runOrchestrator('分析一下当前库存周转情况', {
  dataSummary: '...', // 可选，业务分析时传入数据摘要
});
```

## 扩展

- 在各 Agent 内调用 Gemini（或其它 LLM），使用 `prompts/` 中的系统提示与用户提示。
- 在 `agents/tools/` 中实现真实工具（执行 lint、测试、读文件等），供 Agent 通过 Function Calling 调用。
