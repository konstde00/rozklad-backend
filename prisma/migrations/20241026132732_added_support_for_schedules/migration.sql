/*
  Warnings:

  - You are about to drop the column `owner_id` on the `schedules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `schedules` DROP FOREIGN KEY `schedules_ibfk_1`;

-- AlterTable
ALTER TABLE `schedules` DROP COLUMN `owner_id`;
