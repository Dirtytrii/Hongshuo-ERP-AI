# 代码质量与规范

## ESLint

- 运行检查：`npm run lint`
- 自动修复：`npm run lint:fix`

## Prettier

- 格式化代码：`npm run format`

## Git Hooks（Pre-commit）

安装依赖后，若已初始化 Git，执行一次：

```bash
npx husky init
```

之后每次 `git commit` 会自动对暂存文件执行 Prettier 和 ESLint --fix。

## 后端（Java）

- **Checkstyle**：已在 `pom.xml` 中配置（`checkstyle.xml`），执行 `mvn checkstyle:check` 或 `mvn validate` 进行代码规范检查（当前 `failOnViolation` 为 false，仅报告不阻断构建）。
- **单元测试**：`mvn test`
