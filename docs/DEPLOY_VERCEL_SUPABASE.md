# Vercel + Supabase 云端部署指南

本文档说明如何将“文寄四海”活动管理系统部署到云端，使学生和管理员都能通过公网直接访问，且**不依赖开发者本地电脑持续开机**。

## 1. 部署架构

- 前端页面：Vercel
- API Routes：Vercel
- 数据库：Supabase PostgreSQL
- 二维码入口：使用公网地址 `/qrcode` 或 `/apply`

上线后：

- 学生端通过 `https://你的域名/apply` 填写
- 学生端通过 `https://你的域名/query` 查询
- 工作人员通过 `https://你的域名/admin/login` 登录后台
- 活动现场可使用 `https://你的域名/qrcode` 生成二维码供扫码填写

## 2. 创建 Supabase 数据库

1. 注册并登录 [Supabase](https://supabase.com/)
2. 创建新项目
3. 进入 `Project Settings -> Database`
4. 获取以下连接串：
   - `DATABASE_URL`
   - `DIRECT_URL`

建议使用 `Transaction pooler` 连接作为 `DATABASE_URL`，直连作为 `DIRECT_URL`。

## 3. 配置本地环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填写以下变量：

```env
DATABASE_URL="你的 Supabase Prisma 连接串"
DIRECT_URL="你的 Supabase 直连串"
ADMIN_JWT_SECRET="一段足够长的随机密钥"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## 4. 初始化数据库

本地执行：

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

如需演示数据：

```bash
npm run db:seed:demo
```

## 5. 部署到 Vercel

1. 将项目推送到 GitHub
2. 登录 [Vercel](https://vercel.com/)
3. 导入该仓库
4. Framework 选择 `Next.js`
5. 在 Vercel 项目设置中配置环境变量：

| 变量名 | 说明 |
|---|---|
| `DATABASE_URL` | Supabase Prisma 连接串 |
| `DIRECT_URL` | Supabase 直连串 |
| `ADMIN_JWT_SECRET` | 管理员登录态签名密钥 |
| `NEXT_PUBLIC_SITE_URL` | 线上站点 URL，例如 `https://wenji.example.com` |

6. 点击 Deploy

## 6. 执行生产数据库迁移

推荐方式：

```bash
npx prisma migrate deploy
npm run db:seed
```

可在本地执行并连接线上 Supabase，也可在 GitHub Actions / Vercel 外部 CI 中执行。

## 7. 域名与二维码

部署完成后：

- 首页：`https://你的域名/`
- 填写页：`https://你的域名/apply`
- 查询页：`https://你的域名/query`
- 后台：`https://你的域名/admin/login`
- 二维码页：`https://你的域名/qrcode`

二维码使用系统线上 URL 自动生成，因此：

- 无需本地开机
- 无需内网穿透
- 学生和管理员都直接通过公网访问

## 8. 注意事项

1. `ADMIN_JWT_SECRET` 上线后务必更换为强随机字符串
2. Supabase 数据库建议开启自动备份
3. 如活动数据量增大，可在后台按筛选条件导出 CSV 存档
4. 普通管理员账号是硬编码的，仅管理本校数据；未来可平滑替换为数据库管理员体系
