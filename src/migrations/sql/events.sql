-- =====================================
-- Table: events
-- Description: Stores events (classes) associated with schedules and groups.
-- =====================================
CREATE TABLE events (
                        id BIGINT PRIMARY KEY, -- UUID
                        title VARCHAR(100) NOT NULL,
                        description TEXT,
                        day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
                        start_time TIME NOT NULL,
                        end_time TIME NOT NULL,
                        schedule_id BIGINT NOT NULL,
                        group_id BIGINT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
                        FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
