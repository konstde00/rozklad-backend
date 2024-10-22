-- =====================================
-- Table: subjects
-- Description: Stores information about subjects taught in the university.
-- =====================================
CREATE TABLE subjects (
                          id BIGINT PRIMARY KEY,
                          name VARCHAR(100) NOT NULL,
                          hours_per_week INT NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;