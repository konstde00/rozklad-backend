/*
  Warnings:

  - Added the required column `code` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_active` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `code` VARCHAR(191) NOT NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL;
