-- Phase 1 schema: users, classes, students, attendance, audit logs
-- UUID primary keys so records created offline never collide.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','teacher','bursar','parent','student')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,            -- e.g. 'S.2'
  stream     TEXT,                     -- e.g. 'East'
  year       INT  NOT NULL,
  UNIQUE (name, stream, year)
);

CREATE TABLE IF NOT EXISTS students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no TEXT UNIQUE NOT NULL,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  dob          DATE,
  gender       TEXT CHECK (gender IN ('M','F')),
  class_id     UUID REFERENCES classes(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','transferred','graduated','suspended')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
  recorded_by UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, date)            -- prevents duplicate attendance per day
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id  TEXT,
  old_value  JSONB,
  new_value  JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
