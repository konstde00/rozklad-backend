/*
  Warnings:

  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `semesters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_1`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_2`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_3`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_4`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_5`;

-- DropForeignKey
ALTER TABLE `group_subjects` DROP FOREIGN KEY `group_subjects_ibfk_1`;

-- DropForeignKey
ALTER TABLE `group_subjects` DROP FOREIGN KEY `group_subjects_ibfk_2`;

-- DropForeignKey
ALTER TABLE `schedules` DROP FOREIGN KEY `schedules_ibfk_2`;

-- DropForeignKey
ALTER TABLE `teacher_subjects` DROP FOREIGN KEY `teacher_subjects_ibfk_1`;

-- DropForeignKey
ALTER TABLE `teacher_subjects` DROP FOREIGN KEY `teacher_subjects_ibfk_2`;

-- DropForeignKey
ALTER TABLE `teachers` DROP FOREIGN KEY `teachers_ibfk_1`;

-- DropTable
DROP TABLE `events`;

-- DropTable
DROP TABLE `group_subjects`;

-- DropTable
DROP TABLE `schedules`;

-- DropTable
DROP TABLE `semesters`;

-- DropTable
DROP TABLE `student_groups`;

-- DropTable
DROP TABLE `subjects`;

-- DropTable
DROP TABLE `teacher_subjects`;

-- DropTable
DROP TABLE `teachers`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `Event` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
    `start_time` DATETIME(6) NOT NULL,
    `end_time` DATETIME(6) NOT NULL,
    `schedule_id` BIGINT NOT NULL,
    `group_id` BIGINT NOT NULL,
    `teacher_id` BIGINT NOT NULL,
    `classroom_id` INTEGER NOT NULL,
    `subject_id` BIGINT NOT NULL,
    `lesson_type` ENUM('lecture', 'practice', 'lab', 'seminar') NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Event_group_id_idx`(`group_id`),
    INDEX `Event_schedule_id_idx`(`schedule_id`),
    INDEX `Event_teacher_id_idx`(`teacher_id`),
    INDEX `Event_classroom_id_idx`(`classroom_id`),
    INDEX `Event_subject_id_idx`(`subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Schedule` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `semester_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Schedule_semester_id_idx`(`semester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Semester` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentGroup` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `study_year` INTEGER NOT NULL,
    `students_count` INTEGER NOT NULL,
    `course_number` INTEGER NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentGroup_course_number_idx`(`course_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subject` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teacher` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `max_hours_per_week` INTEGER NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'teacher', 'faculty_admin', 'system_admin') NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Speciality` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` INTEGER NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeachingAssignment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `teacher_id` BIGINT NOT NULL,
    `group_id` BIGINT NOT NULL,
    `course_number` INTEGER NOT NULL,
    `subject_id` BIGINT NOT NULL,
    `lecture_hours_per_semester` INTEGER NOT NULL,
    `practice_hours_per_semester` INTEGER NOT NULL,
    `lab_hours_per_semester` INTEGER NOT NULL,
    `seminar_hours_per_semester` INTEGER NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TeachingAssignment_teacher_id_idx`(`teacher_id`),
    INDEX `TeachingAssignment_group_id_idx`(`group_id`),
    INDEX `TeachingAssignment_course_number_idx`(`course_number`),
    INDEX `TeachingAssignment_subject_id_idx`(`subject_id`),
    UNIQUE INDEX `TeachingAssignment_teacher_id_group_id_course_number_subject_key`(`teacher_id`, `group_id`, `course_number`, `subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `StudentGroup`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Teacher` ADD CONSTRAINT `Teacher_id_fkey` FOREIGN KEY (`id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TeachingAssignment` ADD CONSTRAINT `TeachingAssignment_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TeachingAssignment` ADD CONSTRAINT `TeachingAssignment_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `StudentGroup`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TeachingAssignment` ADD CONSTRAINT `TeachingAssignment_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
