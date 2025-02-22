/*
  Warnings:

  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `schedule_id` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `group_id` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `teacher_id` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `subject_id` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `Schedule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Schedule` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `semester_id` on the `Schedule` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `Semester` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Semester` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `StudentGroup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `StudentGroup` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `Subject` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Subject` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `Teacher` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Teacher` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `TeachingAssignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `TeachingAssignment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `teacher_id` on the `TeachingAssignment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `group_id` on the `TeachingAssignment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `subject_id` on the `TeachingAssignment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_schedule_id_fkey`;

-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_subject_id_fkey`;

-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_teacher_id_fkey`;

-- DropForeignKey
ALTER TABLE `Schedule` DROP FOREIGN KEY `Schedule_semester_id_fkey`;

-- DropForeignKey
ALTER TABLE `TeachingAssignment` DROP FOREIGN KEY `TeachingAssignment_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `TeachingAssignment` DROP FOREIGN KEY `TeachingAssignment_subject_id_fkey`;

-- DropForeignKey
ALTER TABLE `TeachingAssignment` DROP FOREIGN KEY `TeachingAssignment_teacher_id_fkey`;

-- AlterTable
ALTER TABLE `Event` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `schedule_id` INTEGER NOT NULL,
    MODIFY `group_id` INTEGER NOT NULL,
    MODIFY `teacher_id` INTEGER NOT NULL,
    MODIFY `subject_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Schedule` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `semester_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Semester` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `StudentGroup` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Subject` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Teacher` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `TeachingAssignment` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `teacher_id` INTEGER NOT NULL,
    MODIFY `group_id` INTEGER NULL,
    MODIFY `subject_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `StudentGroup`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TeachingAssignment` ADD CONSTRAINT `TeachingAssignment_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `Teacher`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TeachingAssignment` ADD CONSTRAINT `TeachingAssignment_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `StudentGroup`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TeachingAssignment` ADD CONSTRAINT `TeachingAssignment_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
