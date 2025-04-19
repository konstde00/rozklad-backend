-- CreateTable
CREATE TABLE `TeacherPreference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacher_id` INTEGER NOT NULL,
    `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
    `time_slot_index` INTEGER NOT NULL,
    `preference` ENUM('REQUIRED_FREE', 'PREFERRED_FREE', 'PREFERRED_BUSY', 'NEUTRAL') NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TeacherPreference_teacher_id_idx`(`teacher_id`),
    UNIQUE INDEX `TeacherPreference_teacher_id_day_of_week_time_slot_index_key`(`teacher_id`, `day_of_week`, `time_slot_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TeacherPreference` ADD CONSTRAINT `TeacherPreference_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
