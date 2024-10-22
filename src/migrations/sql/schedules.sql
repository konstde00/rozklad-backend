-- =====================================
-- Table: schedules
-- Description: Stores schedules created by users.
-- =====================================
CREATE TABLE schedules (
                           id BIGINT PRIMARY KEY, -- UUID
                           name VARCHAR(100) NOT NULL,
                           owner_id BIGINT NOT NULL,
                           semester VARCHAR(50) NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
