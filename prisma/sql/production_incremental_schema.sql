-- =============================================================================
-- 正式库「增量补结构」手工执行脚本（PostgreSQL / Supabase）
-- 目标：在保留旧数据、不删列、不批量改写历史业务行的前提下，
--       使库结构满足当前「校区维度增量兼容版」应用（与 prisma/schema.prisma 对齐）。
--
-- 执行前请：备份数据库；在维护窗口执行；使用可回滚的备份。
-- 可整段在 Supabase SQL Editor 中执行（建议先 BEGIN 事务，确认后再 COMMIT）。
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A. 新建 campuses 表（若已存在则跳过整段需改为人工判断，本脚本假设尚无 campuses）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "campuses" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "has_booth" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "campuses"
  DROP CONSTRAINT IF EXISTS "campuses_school_id_fkey";

ALTER TABLE "campuses"
  ADD CONSTRAINT "campuses_school_id_fkey"
  FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "campuses_school_id_code_key" ON "campuses"("school_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "campuses_school_id_name_key" ON "campuses"("school_id", "name");
CREATE INDEX IF NOT EXISTS "campuses_school_id_has_booth_is_active_deleted_at_idx"
  ON "campuses"("school_id", "has_booth", "is_active", "deleted_at");

-- -----------------------------------------------------------------------------
-- B. 每校至少一条「MAIN」校区（仅当该校尚无 code=MAIN 时插入；不覆盖已有数据）
-- -----------------------------------------------------------------------------
INSERT INTO "campuses" ("school_id", "code", "name", "has_booth", "sort_order", "is_active", "updated_at")
SELECT s."id", 'MAIN', '主校区', true, 0, true, CURRENT_TIMESTAMP
FROM "schools" s
WHERE NOT EXISTS (
  SELECT 1 FROM "campuses" c WHERE c."school_id" = s."id" AND c."code" = 'MAIN'
);

-- -----------------------------------------------------------------------------
-- C. 武汉大学：MAIN 展示名改为「校本部」；并增加医学部（仅收信、不摆点）
--    若贵校正式库中 WHU 的 code 不是 'WHU'，请改为实际 schools.code 再执行。
-- -----------------------------------------------------------------------------
UPDATE "campuses" c
SET
  "name" = '校本部',
  "has_booth" = true,
  "sort_order" = 0,
  "updated_at" = CURRENT_TIMESTAMP
FROM "schools" s
WHERE c."school_id" = s."id"
  AND s."code" = 'WHU'
  AND c."code" = 'MAIN';

INSERT INTO "campuses" ("school_id", "code", "name", "has_booth", "sort_order", "is_active", "updated_at")
SELECT s."id", 'MED', '医学部', false, 1, true, CURRENT_TIMESTAMP
FROM "schools" s
WHERE s."code" = 'WHU'
  AND NOT EXISTS (
    SELECT 1 FROM "campuses" c2 WHERE c2."school_id" = s."id" AND c2."code" = 'MED'
  );

-- -----------------------------------------------------------------------------
-- D. booths：保留 school_id，新增可空 campus_id；调整唯一约束以兼容 Prisma
--    若 ALTER COLUMN school_id 报错，说明列已是可空，可忽略该句。
-- -----------------------------------------------------------------------------
ALTER TABLE "booths" ALTER COLUMN "school_id" DROP NOT NULL;

ALTER TABLE "booths" ADD COLUMN IF NOT EXISTS "campus_id" INTEGER;

ALTER TABLE "booths"
  DROP CONSTRAINT IF EXISTS "booths_campus_id_fkey";

ALTER TABLE "booths"
  ADD CONSTRAINT "booths_campus_id_fkey"
  FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 旧唯一 (school_id, name) 可能名称不同，按需删除后重建
ALTER TABLE "booths" DROP CONSTRAINT IF EXISTS "booths_school_id_name_key";
ALTER TABLE "booths" DROP CONSTRAINT IF EXISTS "Booth_schoolId_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "booths_campus_id_name_key" ON "booths" ("campus_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "booths_school_id_name_key" ON "booths" ("school_id", "name");

CREATE INDEX IF NOT EXISTS "booths_campus_id_is_active_idx" ON "booths"("campus_id", "is_active");
CREATE INDEX IF NOT EXISTS "booths_school_id_is_active_idx" ON "booths"("school_id", "is_active");

-- -----------------------------------------------------------------------------
-- E. counter_scopes：保留学校级历史行；新增 campus_id；school_id 改为可空；部分唯一索引
-- -----------------------------------------------------------------------------
ALTER TABLE "counter_scopes" ADD COLUMN IF NOT EXISTS "campus_id" INTEGER;

ALTER TABLE "counter_scopes"
  DROP CONSTRAINT IF EXISTS "counter_scopes_campus_id_fkey";

ALTER TABLE "counter_scopes"
  ADD CONSTRAINT "counter_scopes_campus_id_fkey"
  FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "counter_scopes" ALTER COLUMN "school_id" DROP NOT NULL;

ALTER TABLE "counter_scopes" DROP CONSTRAINT IF EXISTS "counter_scopes_school_id_letter_type_id_key";
ALTER TABLE "counter_scopes" DROP CONSTRAINT IF EXISTS "CounterScope_schoolId_letterTypeId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "counter_scopes_school_letter_partial"
  ON "counter_scopes" ("school_id", "letter_type_id")
  WHERE "campus_id" IS NULL AND "school_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "counter_scopes_campus_letter_partial"
  ON "counter_scopes" ("campus_id", "letter_type_id")
  WHERE "campus_id" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- F. submissions：新增活动/收信校区与收信学校（均可空；不反填历史）
-- -----------------------------------------------------------------------------
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "activity_campus_id" INTEGER;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "recipient_campus_id" INTEGER;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "recipient_school_id" INTEGER;

ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_activity_campus_id_fkey";
ALTER TABLE "submissions"
  ADD CONSTRAINT "submissions_activity_campus_id_fkey"
  FOREIGN KEY ("activity_campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_recipient_campus_id_fkey";
ALTER TABLE "submissions"
  ADD CONSTRAINT "submissions_recipient_campus_id_fkey"
  FOREIGN KEY ("recipient_campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_recipient_school_id_fkey";
ALTER TABLE "submissions"
  ADD CONSTRAINT "submissions_recipient_school_id_fkey"
  FOREIGN KEY ("recipient_school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "submissions_activity_campus_id_idx" ON "submissions"("activity_campus_id");
CREATE INDEX IF NOT EXISTS "submissions_recipient_campus_id_idx" ON "submissions"("recipient_campus_id");
CREATE INDEX IF NOT EXISTS "submissions_recipient_school_id_idx" ON "submissions"("recipient_school_id");

-- -----------------------------------------------------------------------------
-- G.（强烈建议）为每个「摆点校区」× 活跃信件类型新建校区级计数行（仅 INSERT，不改旧行）
--    否则新用户提交时可能报「未找到该活动校区的编号计数器」。
--    若 letter_types 表名/字段不同，请先核对后再执行。
-- -----------------------------------------------------------------------------
INSERT INTO "counter_scopes" ("campus_id", "letter_type_id", "current_value", "created_at", "updated_at")
SELECT c."id", lt."id", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "campuses" c
INNER JOIN "letter_types" lt ON lt."is_active" = true AND lt."code" IN ('DX', 'BDX')
WHERE c."deleted_at" IS NULL
  AND c."is_active" = true
  AND c."has_booth" = true
  AND NOT EXISTS (
    SELECT 1
    FROM "counter_scopes" cs
    WHERE cs."campus_id" = c."id"
      AND cs."letter_type_id" = lt."id"
      AND cs."campus_id" IS NOT NULL
  );

COMMIT;

-- =============================================================================
-- 执行完成后（应用部署侧）建议：
-- 1. npx prisma migrate resolve --applied "20260409133000_campus_dimension"
-- 2. npx prisma migrate resolve --applied "20260409180000_submission_recipient_school"
--    使 _prisma_migrations 与手工补结构一致，避免日后 migrate deploy 重复执行失败。
-- 3. 或在新环境仅用 prisma db pull / migrate diff 核对 drift，按团队规范处理。
-- =============================================================================
