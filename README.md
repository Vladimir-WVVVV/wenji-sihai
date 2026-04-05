# 文寄四海活动管理系统

一个可直接部署上线的轻量网页系统，服务于高校校际信件活动的学生参与者与工作人员。

系统特点：

- 学生扫码即可填写问卷并即时获得唯一编号
- 学生支持按手机号、学号、姓名 + 手机号后四位查询自己的记录
- 工作人员可登录后台查看本校数据、筛选、搜索、导出 CSV
- 后台支持维护本校摊位、修改记录状态
- 编号按“学校 + 信件类型”独立递增，支持并发安全
- 可部署到 Vercel + Supabase，无需本地电脑持续开机

## 技术栈

- 前端：Next.js 16 + TypeScript
- 样式：Tailwind CSS
- 后端：Next.js App Router + Route Handlers
- 数据库：PostgreSQL
- ORM：Prisma
- 部署：Vercel + Supabase

## 核心业务说明

参与高校共 6 所：

1. 武汉大学
2. 上海交通大学
3. 厦门大学
4. 吉林大学
5. 天津大学
6. 东南大学

信件类型：

- 定向寄信
- 不定向寄信
- 中小学生回信（仅武汉大学支持）

编号格式：

- 中文展示：`武汉大学-定向寄信-001`
- 内部短码：`WHU-DX-001`

编号规则：

- 学校是大单位
- 信件类型是小单位
- 流水号在“学校 + 信件类型”组合下独立递增
- 使用事务保证并发安全，不重复编号

## 目录结构

```text
.
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ seed-demo.ts
├─ docs/
│  └─ DEPLOY_VERCEL_SUPABASE.md
├─ src/
│  ├─ app/
│  │  ├─ admin/
│  │  ├─ api/
│  │  ├─ apply/
│  │  ├─ query/
│  │  ├─ qrcode/
│  │  └─ success/
│  ├─ components/
│  │  ├─ admin/
│  │  └─ student/
│  ├─ config/
│  │  ├─ admins.ts
│  │  └─ constants.ts
│  └─ lib/
│     ├─ auth.ts
│     ├─ permissions.ts
│     ├─ db.ts
│     ├─ prisma.ts
│     └─ validators.ts
├─ .env.example
└─ README.md
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

需要配置：

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ADMIN_JWT_SECRET="please-change-this-secret-in-production"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

说明：

- `DATABASE_URL`：Prisma 主连接串
- `DIRECT_URL`：Prisma 直连串
- `ADMIN_JWT_SECRET`：后台登录态签名密钥
- `NEXT_PUBLIC_SITE_URL`：站点 URL，用于二维码等场景

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 生成 Prisma Client

```bash
npm run db:generate
```

### 3. 执行数据库迁移

```bash
npm run db:migrate
```

### 4. 初始化基础数据

```bash
npm run db:seed
```

可选：导入演示数据

```bash
npm run db:seed:demo
```

### 5. 启动开发环境

```bash
npm run dev
```

浏览器访问：

- 首页：`http://localhost:3000`
- 学生填写：`http://localhost:3000/apply`
- 学生查询：`http://localhost:3000/query`
- 后台登录：`http://localhost:3000/admin/login`
- 二维码页：`http://localhost:3000/qrcode`

## 数据库设计

本项目使用 Prisma 管理 PostgreSQL，核心表包括：

### `schools`

- `code`：学校短码，如 `WHU`
- `name`：学校中文名
- `is_active`

### `booths`

- 关联学校
- 支持启用 / 停用
- 普通管理员只能操作本校摊位

### `letter_types`

- `DX`：定向寄信
- `BDX`：不定向寄信
- `HX`：中小学生回信

### `counter_scopes`

- 维护 `school_id + letter_type_id` 组合下的当前计数
- 用于并发安全生成编号

### `submissions`

- 存储学生提交记录
- 包含寄件人、收件人、展示编号、内部短码、状态、时间等字段

详细结构见 `prisma/schema.prisma`。

## 种子数据

基础 seed 会初始化：

- 六所学校
- 三种信件类型
- 武汉大学默认五个摊位
- 所有学校对应可用信件类型的计数器

其中：

- 非武汉大学只初始化 `定向寄信` 和 `不定向寄信`
- 武汉大学初始化三种类型

## 管理员账号

所有管理员账号集中配置在：

- `src/config/admins.ts`

权限模型：

- `school_admin`：只能查看和管理自己学校的数据
- `super_admin`：测试用，可查看全部学校数据

默认硬编码账号：

| 学校 | 用户名 | 密码 |
|---|---|---|
| 武汉大学 | `admin_whu` | `Wenji2026WHU` |
| 上海交通大学 | `admin_sjtu` | `Wenji2026SJTU` |
| 厦门大学 | `admin_xmu` | `Wenji2026XMU` |
| 吉林大学 | `admin_jlu` | `Wenji2026JLU` |
| 天津大学 | `admin_tju` | `Wenji2026TJU` |
| 东南大学 | `admin_seu` | `Wenji2026SEU` |
| 测试超级管理员 | `admin_super` | `Wenji2026SUPER` |

## 学生端功能

- 首页活动说明
- 填写页面
  - 学校联动摊位
  - 武汉大学额外显示“中小学生回信”
  - 定向寄信 / 中小学生回信显示收信人信息
  - 不定向寄信显示主题关键词
- 提交成功页
  - 提示提交成功
  - 放大展示唯一编号
  - 引导截图保存
- 查询页
  - 支持 3 种方式查询
  - 同条件多条记录列表展示

## 后台功能

- 管理员登录
- 后台首页统计卡片
- 记录列表
  - 学校筛选
  - 摊位筛选
  - 信件类型筛选
  - 状态筛选
  - 姓名搜索
  - 学号搜索
  - 编号搜索
  - 日期范围筛选
  - CSV 导出
- 记录详情
- 状态修改
- 摊位管理
  - 新增
  - 编辑名称
  - 启用 / 停用

## API 说明

主要接口：

- `POST /api/submissions`：学生提交
- `POST /api/query`：学生查询
- `GET /api/bootstrap`：前端初始化学校 / 摊位 / 信件类型
- `POST /api/admin/login`：管理员登录
- `POST /api/admin/logout`：管理员退出
- `GET /api/admin/dashboard`：后台统计
- `GET /api/admin/records`：后台记录列表
- `GET /api/admin/records/[id]`：后台记录详情
- `PATCH /api/admin/records/[id]`：更新状态
- `GET /api/admin/export`：导出 CSV
- `GET /api/admin/booths`：摊位列表
- `POST /api/admin/booths`：新增摊位
- `PATCH /api/admin/booths/[id]`：编辑 / 启停摊位

## 云端部署

推荐方案：

- Vercel：部署 Next.js 页面与 API
- Supabase：提供 PostgreSQL 数据库

这意味着：

- 前端、接口、数据库都运行在云端
- 学生和管理员通过公网直接访问
- **上线后不需要开发者本地电脑持续开机**

详细说明见：

- `docs/DEPLOY_VERCEL_SUPABASE.md`

## 二维码使用

系统内置二维码页：

- `/qrcode`

该页面会基于线上域名生成学生填写入口二维码，可直接用于线下扫码活动。

## 可维护性说明

按你的要求，以下内容都已集中管理，便于后续维护：

- 管理员账号密码：`src/config/admins.ts`
- 学校 / 信件类型 / 状态枚举 / 短码映射：`src/config/constants.ts`
- 权限判断：`src/lib/permissions.ts`
- 登录态逻辑：`src/lib/auth.ts`、`src/lib/auth-core.ts`
- 编号生成逻辑：`src/lib/codes.ts`

未来如果你要把管理员改为数据库账号体系、接入短信验证或增加超级管理员功能，改动范围会比较小。
