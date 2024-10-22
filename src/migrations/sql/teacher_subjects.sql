-- =====================================
-- Table: teacher_subjects
-- Description: Junction table for many-to-many relationship between teachers and subjects.
-- =====================================
CREATE TABLE teacher_subjects (
                                  teacher_id BIGINT NOT NULL,
                                  subject_id BIGINT NOT NULL,
                                  PRIMARY KEY (teacher_id, subject_id),
                                  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
                                  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
