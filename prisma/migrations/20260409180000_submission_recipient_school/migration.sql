-- 收信学校显式字段；不强制从历史数据反填，避免误写 recipient_school_id。

ALTER TABLE "submissions" ADD COLUMN "recipient_school_id" INTEGER;

ALTER TABLE "submissions"
ADD CONSTRAINT "submissions_recipient_school_id_fkey"
FOREIGN KEY ("recipient_school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "submissions_recipient_school_id_idx" ON "submissions"("recipient_school_id");
