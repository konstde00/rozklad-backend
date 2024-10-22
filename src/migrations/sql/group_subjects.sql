-- =====================================
-- Table: group_subjects
-- Description: Junction table for many-to-many relationship between groups and subjects.
-- =====================================
CREATE TABLE group_subjects (
                                group_id BIGINT NOT NULL,
                                subject_id BIGINT NOT NULL,
                                PRIMARY KEY (group_id, subject_id),
                                FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
                                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;