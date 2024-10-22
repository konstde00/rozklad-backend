-- =====================================
-- Table: teachers
-- Description: Stores additional information for users with the 'teacher' role.
-- =====================================
CREATE TABLE teachers (
                          id BIGINT PRIMARY KEY,
                          max_hours_per_week INT NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;