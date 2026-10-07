-- Migration: Create attendance_edit_requests table
-- When a teacher edits past attendance, it routes to School Admin for approval
-- before the live attendance record is updated.

CREATE TABLE IF NOT EXISTS attendance_edit_requests (
    id                SERIAL PRIMARY KEY,
    teacher_id        INTEGER NOT NULL,
    student_id        INTEGER NOT NULL,
    division_id       INTEGER NOT NULL,
    class_id          INTEGER,
    school_id         INTEGER,
    attendance_date   DATE NOT NULL,
    current_status    VARCHAR(20),         -- existing attendance value (or NULL if not marked)
    requested_status  VARCHAR(20) NOT NULL, -- 'present' | 'absent'
    status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    teacher_note      TEXT,
    admin_note        TEXT,
    reviewed_by       INTEGER,             -- school admin id who reviewed
    reviewed_at       TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_edit_req_teacher   ON attendance_edit_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_att_edit_req_student   ON attendance_edit_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_att_edit_req_school    ON attendance_edit_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_att_edit_req_status    ON attendance_edit_requests(status);
CREATE INDEX IF NOT EXISTS idx_att_edit_req_date      ON attendance_edit_requests(attendance_date);

-- Unique constraint: only one PENDING request per student per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_att_edit_req_unique_pending
    ON attendance_edit_requests(student_id, attendance_date)
    WHERE status = 'pending';
