/*
  Warnings:

  - A unique constraint covering the columns `[google_uid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `google_uid` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_google_uid_key` ON `User`(`google_uid`);
