/*
  Link notifications to user via required user_id.
  For existing databases with legacy notifications, we clear the table first.
*/

-- Clear legacy notifications so we can safely add a required user_id
DELETE FROM `notification`;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `user_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

 