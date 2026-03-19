# 家庭愿景工坊模拟运行手册

这个文档用于**不手动一题一题输入**地跑模拟验证。

## 1) 启动服务

在项目根目录执行：

```bash
npm run dev
```

你会看到：

- 前端：`http://localhost:8081/`
- 后端：`http://localhost:3001/`

---

## 2) 一键跑全流程模拟（推荐）

在新终端执行：

```bash
node --env-file=.env test-flow.js
```

这个脚本会自动模拟四模块 `S/N/W/E` 的对话流程（API 层），不用你手填。

---

## 3) 只跑单模块模拟

```bash
node --env-file=.env test-flow.js --module S
node --env-file=.env test-flow.js --module N
node --env-file=.env test-flow.js --module W
node --env-file=.env test-flow.js --module E
```

---

## 4) 跑重点稳定性脚本（W 模块相关）

### W-01 门控验证

```bash
node --env-file=.env test-w01-gate.js
```

### W-02 -> W-03 过渡验证

```bash
node --env-file=.env test-w02-gate.js
```

### W-03 英雄特质输出验证

```bash
node --env-file=.env test-w03-hero.js
```

---

## 5) 报告生成模拟（无需前端手填）

```bash
node --env-file=.env test-report.mjs
```

这个脚本会调用 `/api/report`，用内置样本数据验证报告输出质量和稳定性。

---

## 6) 可选：先清理当前账号历史数据（重新跑干净样本）

在 Supabase SQL Editor 执行：

```sql
delete from conversations
where user_id = auth.uid();
```

说明：`messages/compass_data` 会因外键 `cascade` 自动删除。

---

## 7) 结果判定标准

- 终端显示 `✅` 为通过，`❌` 为失败。
- 全流程脚本最终 `失败: 0` 才算通过。
- 如果失败，优先看失败场景编号和对应 `nodeId`，再定位到对应模块修复。

---

## 8) 常见问题

### Q1. 报 `API 服务未启动`

确认 `npm run dev` 已启动，并且后端日志里有：

`API server running on http://localhost:3001`

### Q2. 脚本通过，但前端页面偶发卡片不出现

这通常是 UI 恢复层问题，不是 API 层问题。建议再做一次浏览器回归：

1. 打开 `http://localhost:8081/`
2. 走到模块中间刷新
3. 验证是否回到正确卡片并可继续
4. 验证右侧“重开模块”是否生效

---

## 9) 建议的最短回归组合

每次改动后跑这三条即可：

```bash
node --env-file=.env test-flow.js --module W
node --env-file=.env test-w01-gate.js
node --env-file=.env test-report.mjs
```

这组可以覆盖：流程推进、W 模块门控、报告输出。
