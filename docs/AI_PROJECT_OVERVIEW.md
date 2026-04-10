# 文寄四海活动管理系统 — AI 可读项目说明

本文档面向 **大模型 / 自动化工具**：阅读后即可理解项目业务、技术栈与主要文件职责。修改代码前请结合仓库内 `AGENTS.md`（Next.js 版本提示）与 `prisma/schema.prisma`（数据模型为准）。

---

## 1. 项目是做什么的

**文寄四海**是一套面向高校联合寄信活动的 **全栈 Web 系统**，核心能力包括：

| 能力 | 说明 |
|------|------|
| **学生问卷 / 登记** | 学生选择 **活动摆点校区**、摊位、**收信去向校区**，填写寄件人与信件类型（定向/不定向），提交后生成 **唯一信件编号**。 |
| **公开查询** | 学生用手机号、学号或「姓名+手机后四位」查询自己的登记与编号、处理状态。 |
| **后台管理** | 管理员登录后管理学校、**校区**、摊位、查看/筛选/导出提交记录、更新物流状态；分 **超级管理员** 与 **本校管理员**。 |
| **编号规则** | 编号按 **摆点校区 × 信件类型** 独立递增（数据库行级锁）；非摆点校区不参与计数。 |

**关键业务区分（必读）**

- **活动校区（摆点校区）**：现场登记单位，`hasBooth=true`，可挂摊位，出现在问卷「参与活动校区」中，参与编号。
- **收信校区**：信件寄达的学校+校区，可为无摆点校区（如武汉大学医学部），仅出现在「收信学校→收信校区」与后台/导出；不参与摆点选项与计数器。

---

## 2. 技术栈

- **框架**：Next.js（App Router），React 19，TypeScript  
- **数据库**：PostgreSQL，**Prisma** ORM（`DATABASE_URL` / `DIRECT_URL`）  
- **校验**：Zod（`src/lib/validators.ts`）  
- **鉴权**：Cookie + JWT（jose），`src/lib/auth.ts` / `auth-core.ts`  
- **样式**：Tailwind CSS 4，`src/app/globals.css`  

---

## 3. 仓库顶层文件

| 路径 | 作用 |
|------|------|
| `package.json` | 依赖与脚本：`dev` / `build` / `db:seed` / `db:migrate` 等。 |
| `next.config.ts` | Next.js 配置。 |
| `tsconfig.json` | TypeScript 配置（含 `@/` 路径别名 → `src/`）。 |
| `eslint.config.mjs` | ESLint 配置。 |
| `postcss.config.mjs` | PostCSS（Tailwind）。 |
| `AGENTS.md` / `CLAUDE.md` | 给 Agent 的规则；**Next 版本可能与通用文档不同，以官方为准**。 |
| `.env` / `.env.local`（不提交） | `DATABASE_URL`、`DIRECT_URL` 等机密。 |

---

## 4. 数据模型概要（`prisma/schema.prisma`）

| 模型 | 作用 |
|------|------|
| `School` | 学校（代码、名称、启用/归档）。 |
| `Campus` | 校区：代码、名称、`hasBooth`（是否摆点）、排序、启用/归档。 |
| `Booth` | 摊位，归属 **校区** `campusId`（不再直接挂学校）。 |
| `LetterType` | 信件类型（如定向 DX、不定向 BDX）。 |
| `CounterScope` | **摆点校区 + 信件类型** 的当前编号计数。 |
| `Submission` | 学生提交：`schoolId`（活动登记学校）、`activityCampusId`、`recipientCampusId`、`boothId`、`letterTypeId`、`displayCode`/`rawCode`、状态枚举等。 |

**迁移与种子**

- `prisma/migrations/`：数据库迁移 SQL（含校区维度升级等）。  
- `prisma/seed.ts`：基础学校、信件类型、校区（含武大校本部/医学部）、摊位、计数器。  
- `prisma/seed-demo.ts`：演示用提交记录（需先 seed）。  

---

## 5. 目录结构总览

```
src/app/           # Next App Router：页面与 Route Handlers（API）
src/components/    # React 组件（admin / student）
src/lib/           # 服务端逻辑：DB 访问、鉴权、校验、编号生成等
src/config/        # 常量与管理员账号配置（非密钥）
prisma/            # schema、迁移、seed
```

---

## 6. `src/app` — 页面与 API

### 6.1 学生/公开页面（`src/app/*.tsx`）

| 文件 | 作用 |
|------|------|
| `page.tsx` | 站点首页。 |
| `layout.tsx` | 根布局、全局样式与元数据。 |
| `globals.css` | 全局 CSS / Tailwind 与组件类名（如 `card`、`input`）。 |
| `apply/page.tsx` | **填写活动信息** 入口页，内嵌 `ApplyFormShell`。 |
| `query/page.tsx` | **查询我的编号** 页。 |
| `success/page.tsx` | 提交成功页（展示编号等 query 参数）。 |
| `qrcode/page.tsx` | 问卷二维码相关展示（若存在）。 |

### 6.2 后台页面（`src/app/admin/`）

| 路径 | 作用 |
|------|------|
| `login/page.tsx` | 管理员登录表单页。 |
| `(protected)/layout.tsx` | 已登录后台的布局（侧栏等）。 |
| `(protected)/page.tsx` | 后台首页（统计卡片、快捷入口）。 |
| `(protected)/records/page.tsx` | 记录列表 + 筛选 + 表格。 |
| `(protected)/records/[id]/page.tsx` | 单条记录详情、改状态、删除。 |
| `(protected)/campuses/page.tsx` | **校区管理**（超级管理员/本校管理员权限不同）。 |
| `(protected)/booths/page.tsx` | **摊位管理**（按校区挂摊位）。 |
| `(protected)/schools/page.tsx` | **学校管理**（仅超级管理员）。 |

### 6.3 API Routes（`src/app/api/`）

| 路径 | 作用 |
|------|------|
| `bootstrap/route.ts` | **GET**：问卷所需字典数据（摆点校区+摊位、收信学校+校区）。无登录。 |
| `submissions/route.ts` | **POST**：学生提交登记，事务内生成编号并写库。 |
| `query/route.ts` | **POST**：学生按手机/学号/姓名+尾号查询。 |
| `admin/login/route.ts` | 管理员登录，写 Cookie。 |
| `admin/logout/route.ts` | 登出。 |
| `admin/dashboard/route.ts` | 后台首页统计数据 JSON。 |
| `admin/records/route.ts` | **GET**：列表数据（带筛选 query）。 |
| `admin/records/[id]/route.ts` | **GET/PATCH/DELETE**：单条记录读、改状态、删。 |
| `admin/export/route.ts` | **GET**：按当前筛选条件导出 CSV。 |
| `admin/schools/route.ts` | **GET/POST**：学校列表、新建学校（含默认主校区与计数器）。 |
| `admin/schools/[id]/route.ts` | **DELETE**：删校或归档学校及关联校区/摊位。 |
| `admin/campuses/route.ts` | **GET/POST**：校区列表、新建校区（摆点则建计数器）。 |
| `admin/campuses/[id]/route.ts` | **PATCH/DELETE**：改校区、归档/删除（删校区多限超管）。 |
| `admin/booths/route.ts` | **GET/POST**：摊位列表、新建（须摆点校区）。 |
| `admin/booths/[id]/route.ts` | **PATCH/DELETE**：改摊位、删/归档摊位。 |

**说明**：管理端写操作常调用 `revalidateTag("bootstrap-data")`，用于让问卷侧缓存失效（若项目某处对 bootstrap 做了缓存标签关联）。

---

## 7. `src/components` — 组件

### 7.1 学生端 `components/student/`

| 文件 | 作用 |
|------|------|
| `ApplyFormShell.tsx` | 客户端拉取 `/api/bootstrap`，加载中/失败重试，成功后渲染 `SubmissionForm`。 |
| `SubmissionForm.tsx` | 完整问卷表单：活动校区+摊位、收信学校+校区、寄件人、信件类型、收信人信息等；**POST** `/api/submissions`。 |
| `QueryForm.tsx` | 查询表单与结果列表展示。 |
| `QuestionnaireQrCard.tsx` | 问卷二维码卡片（若首页/活动页使用）。 |

### 7.2 管理端 `components/admin/`

| 文件 | 作用 |
|------|------|
| `AdminSidebar.tsx` | 后台导航（记录、校区、摊位、学校等）。 |
| `AdminLoginForm.tsx` | 登录表单。 |
| `AdminLogoutButton.tsx` | 登出按钮。 |
| `AdminRecordsFilters.tsx` | 记录列表筛选表单（含活动/收信校区、摊位、导出链接）。 |
| `AdminRecordsTable.tsx` | 记录表格与跳转详情、删除按钮。 |
| `AdminRecordDetail`（无独立文件） | 详情在 `records/[id]/page.tsx` 中组合 `AdminStatusForm` 等。 |
| `AdminStatusForm.tsx` | 修改提交状态。 |
| `AdminDeleteSubmissionButton.tsx` | 删除单条提交。 |
| `CampusManager.tsx` | 校区增删改 UI，调用 `/api/admin/campuses`。 |
| `BoothManager.tsx` | 摊位增删改 UI，调用 `/api/admin/booths`。 |
| `SchoolManager.tsx` | 学校列表与删除/归档 UI（超管）。 |

---

## 8. `src/lib` — 核心业务逻辑

| 文件 | 作用 |
|------|------|
| `db.ts` | **集中数据访问**：`getBootstrapData`、`getAdminRecords`、`getAdminRecordById`、`getStudentQueryResults`、`getAdminDashboardStats`、`getBoothsForAdmin`、`mapRecordToCsvRow`；含本校管理员「活动或收信在本校」可见规则。 |
| `codes.ts` | `generateSubmissionCodes`：按 **摆点校区** + 信件类型锁 `counter_scopes` 行并递增，生成 `displayCode` / `rawCode`。 |
| `validators.ts` | Zod：学生提交、查询、管理员登录、摊位/学校/校区、状态更新等 schema。 |
| `permissions.ts` | `isSuperAdmin`、`canAccessSchool`、`canAccessSubmissionRecord`、`normalizeSchoolFilter`。 |
| `prisma.ts` | 单例 `PrismaClient`，开发环境挂 global。 |
| `auth.ts` | Next 服务端：`requireAdminSession`（页面）、与 API 用 session 读取配合。 |
| `auth-core.ts` | JWT 签发/校验、Cookie 名等底层逻辑。 |
| `response.ts` | 统一 API JSON：`ok` / `fail`。 |
| `utils.ts` | 通用工具（如 CSV、时间格式化、`cn` 等）。 |

---

## 9. `src/config`

| 文件 | 作用 |
|------|------|
| `constants.ts` | 学校列表、信件类型、状态文案、武大默认摊位、武大校区种子、`ADMIN_ROLES`、Cookie 名等。**业务枚举优先与此处及数据库对齐。** |
| `admins.ts` | 管理员账号、角色、绑定学校（具体格式以文件为准；勿把生产密钥写入仓库）。 |

---

## 10. 其他

| 文件 | 作用 |
|------|------|
| `src/middleware.ts` | 路由保护（如 `/admin` 下除 login 外需登录），具体规则以代码为准。 |

---

## 11. 给 AI 的修改指引（快速定位）

| 需求 | 优先查看 |
|------|----------|
| 改问卷字段或校验 | `validators.ts` → `SubmissionForm.tsx` → `api/submissions/route.ts` |
| 改编号规则 | `codes.ts`、`CounterScope` / `prisma/schema.prisma` |
| 改问卷下拉数据源 | `db.ts` 中 `getBootstrapData`、`api/bootstrap/route.ts` |
| 改后台列表/筛选/导出 | `db.ts`（`getAdminRecords`、`mapRecordToCsvRow`）、`AdminRecordsFilters.tsx`、`records/page.tsx`、`export/route.ts` |
| 改校区/摊位业务规则 | `api/admin/campuses/*`、`api/admin/booths/*`、`CampusManager.tsx`、`BoothManager.tsx` |
| 改权限范围 | `permissions.ts`、`middleware.ts`、`auth.ts` |
| 改种子数据 | `prisma/seed.ts`、`prisma/seed-demo.ts`、`config/constants.ts` |

---

## 12. 常用命令

```bash
npm run dev          # 开发
npm run build        # prisma generate + next build
npm run db:migrate   # 开发迁移
npm run db:seed      # 种子数据
npx prisma studio    # 可视化数据库
```

---

*文档版本与仓库代码同步维护；若与运行行为不一致，以 `prisma/schema.prisma` 与 `src/lib/db.ts` 为准。*
