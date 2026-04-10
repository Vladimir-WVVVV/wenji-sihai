-- 增量兼容：引入校区、摊位与计数器双字段；不删除 booths/counter_scopes 的 school_id，不强制回填历史 submissions/booths。
-- 适用前提：已存在 schools、booths(school_id)、counter_scopes(school_id, letter_type_id)、submissions。

CREATE TABLE "campuses" (
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

INSERT INTO "campuses" ("school_id", "code", "name", "has_booth", "sort_order", "is_active", "updated_at")
SELECT "id", 'MAIN', '主校区', true, 0, true, CURRENT_TIMESTAMP FROM "schools";

ALTER TABLE "campuses" ADD CONSTRAINT "campuses_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "campuses_school_id_code_key" ON "campuses"("school_id", "code");
CREATE UNIQUE INDEX "campuses_school_id_name_key" ON "campuses"("school_id", "name");
CREATE INDEX "campuses_school_id_has_booth_is_active_deleted_at_idx" ON "campuses"("school_id", "has_booth", "is_active", "deleted_at");

-- 摊位：保留 school_id（改为可空以兼容仅挂校区的记录），新增可空 campus_id（不在此批量写入 campus_id）
ALTER TABLE "booths" ALTER COLUMN "school_id" DROP NOT NULL;

ALTER TABLE "booths" ADD COLUMN "campus_id" INTEGER;

ALTER TABLE "booths" ADD CONSTRAINT "booths_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booths" DROP CONSTRAINT IF EXISTS "booths_school_id_name_key";
ALTER TABLE "booths" DROP CONSTRAINT IF EXISTS "Booth_schoolId_name_key";

CREATE UNIQUE INDEX "booths_campus_id_name_key" ON "booths" ("campus_id", "name");
CREATE UNIQUE INDEX "booths_school_id_name_key" ON "booths" ("school_id", "name");

CREATE INDEX "booths_campus_id_is_active_idx" ON "booths"("campus_id", "is_active");
CREATE INDEX "booths_school_id_is_active_idx" ON "booths"("school_id", "is_active");

-- 计数器：保留学校级历史行；新增可空 campus_id；新编号仅使用 campus_id 非空行
ALTER TABLE "counter_scopes" ADD COLUMN "campus_id" INTEGER;

ALTER TABLE "counter_scopes" ADD CONSTRAINT "counter_scopes_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "counter_scopes" ALTER COLUMN "school_id" DROP NOT NULL;

ALTER TABLE "counter_scopes" DROP CONSTRAINT IF EXISTS "counter_scopes_school_id_letter_type_id_key";
ALTER TABLE "counter_scopes" DROP CONSTRAINT IF EXISTS "CounterScope_schoolId_letterTypeId_key";

CREATE UNIQUE INDEX "counter_scopes_school_letter_partial" ON "counter_scopes" ("school_id", "letter_type_id")
WHERE "campus_id" IS NULL AND "school_id" IS NOT NULL;

CREATE UNIQUE INDEX "counter_scopes_campus_letter_partial" ON "counter_scopes" ("campus_id", "letter_type_id")
WHERE "campus_id" IS NOT NULL;

ALTER TABLE "submissions" ADD COLUMN "activity_campus_id" INTEGER;
ALTER TABLE "submissions" ADD COLUMN "recipient_campus_id" INTEGER;

ALTER TABLE "submissions" ADD CONSTRAINT "submissions_activity_campus_id_fkey" FOREIGN KEY ("activity_campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_recipient_campus_id_fkey" FOREIGN KEY ("recipient_campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "submissions_activity_campus_id_idx" ON "submissions"("activity_campus_id");
CREATE INDEX "submissions_recipient_campus_id_idx" ON "submissions"("recipient_campus_id");
