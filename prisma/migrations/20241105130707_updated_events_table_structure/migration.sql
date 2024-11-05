/*
  Warnings:

  - You are about to drop the column `description` on the `events` table. All the data in the column will be lost.
  - The values [Saturday,Sunday] on the enum `events_day_of_week` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `start_time` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Time(0)` to `DateTime(6)`.
  - You are about to alter the column `end_time` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Time(0)` to `DateTime(6)`.
  - You are about to drop the column `hours_per_semester` on the `subjects` table. All the data in the column will be lost.
  - The primary key for the `teacher_subjects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `classroom_id` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_type` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_id` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lecture_hours_per_semester` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `practice_hours_per_semester` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_type` to the `teacher_subjects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `description`,
    ADD COLUMN `classroom_id` INTEGER NOT NULL,
    ADD COLUMN `lesson_type` ENUM('lecture', 'practice') NOT NULL,
    ADD COLUMN `subject_id` BIGINT NOT NULL,
    ADD COLUMN `teacher_id` BIGINT NOT NULL,
    MODIFY `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
    MODIFY `start_time` DATETIME(6) NOT NULL,
    MODIFY `end_time` DATETIME(6) NOT NULL;

-- AlterTable
ALTER TABLE `subjects` DROP COLUMN `hours_per_semester`,
    ADD COLUMN `lecture_hours_per_semester` INTEGER NOT NULL,
    ADD COLUMN `practice_hours_per_semester` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `teacher_subjects` DROP PRIMARY KEY,
    ADD COLUMN `lesson_type` ENUM('lecture', 'practice') NOT NULL,
    ADD PRIMARY KEY (`teacher_id`, `subject_id`, `lesson_type`);

-- CreateIndex
CREATE INDEX `teacher_id` ON `events`(`teacher_id`);

-- CreateIndex
CREATE INDEX `classroom_id` ON `events`(`classroom_id`);

-- CreateIndex
CREATE INDEX `subject_id` ON `events`(`subject_id`);

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_ibfk_4` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_ibfk_5` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
