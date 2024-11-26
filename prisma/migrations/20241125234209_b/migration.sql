/*
  Warnings:

  - You are about to drop the column `group_id` on the `teachingassignment` table. All the data in the column will be lost.
  - Added the required column `specialy_id` to the `TeachingAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `teachingassignment` DROP FOREIGN KEY `TeachingAssignment_group_id_fkey`;

-- DropIndex
DROP INDEX `TeachingAssignment_teacher_id_group_id_course_number_subject_key` ON `teachingassignment`;

-- AlterTable
ALTER TABLE `teachingassignment` DROP COLUMN `group_id`,
    ADD COLUMN `specialy_id` INTEGER NOT NULL;
