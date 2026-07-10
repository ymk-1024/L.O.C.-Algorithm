-- ユーザー設定カラムを追加
ALTER TABLE users
  ADD COLUMN reminder_interval_minutes INT          NOT NULL DEFAULT 60,
  ADD COLUMN daily_stand_goal          INT          NOT NULL DEFAULT 8,
  ADD COLUMN sensor_sensitivity        VARCHAR(10)  NOT NULL DEFAULT 'Medium';

