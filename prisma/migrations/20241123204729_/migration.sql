/*
  Warnings:

  - Added the required column `speciality` to the `StudentGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speciality` to the `TeachingAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `StudentGroup` ADD COLUMN `speciality` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `TeachingAssignment` ADD COLUMN `speciality` INTEGER NOT NULL;
