/*
  Warnings:

  - You are about to drop the column `user_id` on the `absence` table. All the data in the column will be lost.
  - You are about to drop the `_absenceTostudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_absenceToteacher` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_absenceTostudent` DROP FOREIGN KEY `_absenceTostudent_A_fkey`;

-- DropForeignKey
ALTER TABLE `_absenceTostudent` DROP FOREIGN KEY `_absenceTostudent_B_fkey`;

-- DropForeignKey
ALTER TABLE `_absenceToteacher` DROP FOREIGN KEY `_absenceToteacher_A_fkey`;

-- DropForeignKey
ALTER TABLE `_absenceToteacher` DROP FOREIGN KEY `_absenceToteacher_B_fkey`;

-- DropForeignKey
ALTER TABLE `absence` DROP FOREIGN KEY `absence_user_id_fkey`;

-- AlterTable
ALTER TABLE `absence` DROP COLUMN `user_id`,
    ADD COLUMN `student_id` INTEGER NULL,
    ADD COLUMN `teacher_id` INTEGER NULL;

-- DropTable
DROP TABLE `_absenceTostudent`;

-- DropTable
DROP TABLE `_absenceToteacher`;

-- AddForeignKey
ALTER TABLE `absence` ADD CONSTRAINT `absence_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absence` ADD CONSTRAINT `absence_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
