/*
  Warnings:

  - You are about to drop the column `userId` on the `Teacher` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Teacher` DROP FOREIGN KEY `Teacher_userId_fkey`;

-- AlterTable
ALTER TABLE `Teacher` DROP COLUMN `userId`;
