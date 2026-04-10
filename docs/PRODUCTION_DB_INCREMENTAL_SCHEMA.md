# 正式库安全补结构方案（校区维度增量兼容 · 最低条件）

本文档面向：**当前仍为「学校 + 摊位」旧表结构、尚无 `campuses` 等增量列**的正式 PostgreSQL（含 Supabase），在**不删表、不删列、不清空、不批量改写历史业务行**的前提下，补全与当前应用 `prisma/schema.prisma` 一致的**最小结构**，使已测试通过的「校区维度增量兼容版」代码可连接运行。

> **不修改业务代码**：仅需在库侧执行 DDL + 可选最小种子；应用逻辑保持仓库现状即可。

---

## 1. 正式库需要补的最小结构清单

| 对象 | 说明 |
|------|------|
| **表 `campuses`** | 校区主数据：`school_id`、`code`、`name`、`has_booth`、`sort_order`、`is_active`、`deleted_at`、`created_at`、`updated_at`；与 `schools` 外键。 |
| **`booths.campus_id`** | 可空 `INTEGER`，指向 `campuses.id`；**保留** `school_id`（需允许 NULL，以兼容未来仅挂校区等边界）。 |
| **`booths` 唯一约束** | `@@unique([campusId, name])` + `@@unique([schoolId, name])`（PostgreSQL 中用两个唯一索引实现；历史行可 `campus_id` 为空）。 |
| **`counter_scopes.campus_id`** | 可空；**保留** `school_id`（改为可空），旧「学校 × 信件类型」行可保留。 |
| **`counter_scopes` 唯一性** | 部分唯一索引：`(school_id, letter_type_id) WHERE campus_id IS NULL AND school_id IS NOT NULL`；`(campus_id, letter_type_id) WHERE campus_id IS NOT NULL`。 |
| **`submissions.activity_campus_id`** | 可空，FK → `campuses`。 |
| **`submissions.recipient_school_id`** | 可空，FK → `schools`。 |
| **`submissions.recipient_campus_id`** | 可空，FK → `campuses`。 |
| **索引** | 与仓库迁移一致：`submissions` 上 `activity_campus_id`、`recipient_school_id`、`recipient_campus_id` 等索引。 |
| **（强烈建议）校区级 `counter_scopes` 行** | 对每个 **`has_booth = true`** 的校区 × 每种活跃信件类型（`DX`/`BDX`）**仅 INSERT 新行**（`campus_id` 非空、`school_id` 为空），**不修改**旧学校级计数行。否则新用户提交可能报「未找到该活动校区的编号计数器」。 |

---

## 2. 可手工执行的 SQL 脚本

仓库内路径：

**`prisma/sql/production_incremental_schema.sql`**

内容要点：

- `CREATE TABLE` / `ALTER TABLE ADD COLUMN` / `CREATE INDEX` / `ADD FOREIGN KEY` 为主。
- **不**执行 `DROP COLUMN` / `DROP TABLE` / `TRUNCATE` / 批量 `UPDATE submissions`。
- 为各校插入 **MAIN**（若不存在）；对 **武汉大学（`schools.code = 'WHU'`）** 将 MAIN 展示名更新为 **校本部**，并插入 **MED（医学部，无摆点）**（若不存在）。
- 末尾 **G 段**为校区级计数器 **INSERT**（仅新增行，不改历史计数）。

执行方式：Supabase **SQL Editor** 粘贴执行，或 `psql` 连接正式库执行。建议先**全库备份**与**维护窗口**。

---

## 3. 建议执行顺序（含上线后应用侧）

### 库侧（DDL + 最小种子）

1. **备份**正式库（快照 / 逻辑备份）。
2. 在会话中执行 `prisma/sql/production_incremental_schema.sql`（脚本内含 `BEGIN`/`COMMIT`；若需先试跑可改为手动 `ROLLBACK`）。
3. 确认无报错后，在 Supabase 中按第 4 节做字段与数据抽查。

### Prisma 迁移表对齐（避免日后 `migrate deploy` 冲突）

手工补结构后，`_prisma_migrations` 中可能仍无对应记录。建议在**确认库结构与 `schema.prisma` 一致**后，由运维在部署环境执行（路径在项目根目录）：

```bash
npx prisma migrate resolve --applied "20260409133000_campus_dimension"
npx prisma migrate resolve --applied "20260409180000_submission_recipient_school"
```

> 若团队策略是「正式库永不跑 migrate、仅以手工 SQL 为源」，也可不 resolve，但需在内部文档中固定流程，避免 CI 对正式库误执行 `migrate deploy`。

### 应用与数据

4. 部署当前已通过测试的应用版本；配置 `DATABASE_URL` / `DIRECT_URL`。
5. **可选**：在后台为各校摆点校区**新建摊位**（新摊位会写 `campus_id` + `school_id`）；历史摊位可保留 `campus_id` 为空，由管理员逐步补全（与业务规则一致）。
6. **最小 smoke test**：见下。

### 最小 smoke test（建议）

- `/api/bootstrap` 返回 200，含 `activityCampuses` / `recipientSchools`。
- 管理端能打开校区/摊位/记录列表。
- 测试环境完成一条**定向**、一条**不定向**提交（不定向收信学校/校区应为 `null`）。

---

## 4. 执行完成后在 Supabase 中应检查的内容

### 表是否存在

- `campuses` 表存在，且至少有各校 `MAIN`；武汉大学另有 `MED`（若执行了脚本 C 段）。

### 列是否存在（Table Editor 或 SQL）

| 表 | 列名（蛇形） |
|----|----------------|
| `booths` | `campus_id`（可空），`school_id`（应为可空） |
| `counter_scopes` | `campus_id`（可空），`school_id`（应为可空） |
| `submissions` | `activity_campus_id`、`recipient_school_id`、`recipient_campus_id`（均可空） |

### 约束与索引（可选 SQL）

```sql
-- 外键示例
SELECT conname, conrelid::regclass AS tbl
FROM pg_constraint
WHERE conname LIKE '%campus%' OR conname LIKE '%recipient_school%';

-- campuses / booths / counter_scopes / submissions 相关索引
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('campuses', 'booths', 'counter_scopes', 'submissions')
ORDER BY tablename, indexname;
```

### 数据（抽样）

- `SELECT * FROM campuses WHERE school_id IN (SELECT id FROM schools WHERE code = 'WHU');`  
  应有 **MAIN（校本部，摆点）**、**MED（医学部，不摆点）**（若脚本执行成功）。
- `SELECT COUNT(*) FROM counter_scopes WHERE campus_id IS NOT NULL;`  
  应 **> 0**（若执行了脚本 G 段）。
- **历史** `submissions`：`activity_campus_id` / `recipient_school_id` / `recipient_campus_id` 允许全为 **NULL**（未回填属预期）。

---

## 5. 当前代码是否还需要改？

在**正式库已按上表与脚本补全结构**，且 **letter_types** 中存在 `DX` / `BDX`、**各校 MAIN（及 WHU 的 MED）** 已就绪、**校区级 counter_scopes** 已插入的前提下：

- **无需再为「能连上库」而改业务代码**；当前仓库中的学生端、校验、`/api/submissions`、后台列表/导出等已按增量兼容与定向/不定向规则实现。
- **仍需人工/运维完成的事项**（非代码）：
  - 正式环境变量与部署；
  - 后台配置摊位、校区属性（摆点/收信）；
  - 历史摊位按需补 `campus_id`（自愿，非脚本强制）；
  - 按第 3 节处理 `prisma migrate resolve` 或固定迁移策略。

若执行脚本时某表名/列名与贵司早期自建库不一致（例如非 Prisma 默认命名），应先对照 `\d 表名` 再局部调整 SQL，**仍不建议**为此改应用业务逻辑，除非确认是唯一办法。

---

## 附录：与仓库内 Prisma 迁移的关系

- `prisma/migrations/20260409133000_campus_dimension/migration.sql`  
- `prisma/migrations/20260409180000_submission_recipient_school/migration.sql`  

手工脚本 **`production_incremental_schema.sql`** 在语义上与上述增量迁移**对齐**，并额外包含：

- `CREATE TABLE IF NOT EXISTS`、`ADD COLUMN IF NOT EXISTS` 等，降低**重复执行**部分语句时的失败概率（仍建议在**干净理解**下只执行一次完整脚本）。
- 武汉大学 **MAIN/MED** 的显式说明与插入。
- 校区级 **counter_scopes** 的 **INSERT**（建议段）。
