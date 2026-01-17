-- CreateTable
CREATE TABLE `teacher_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacher_id` INTEGER NOT NULL,
    `total_hours` DOUBLE NOT NULL,
    `hourly_rate` DOUBLE NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `confirmed_by` INTEGER NOT NULL,
    `financial_log_id` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `teacher_payment_financial_log_id_key`(`financial_log_id`),
    INDEX `teacher_payment_teacher_id_idx`(`teacher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `time_registration` ADD COLUMN `paid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `payment_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `time_registration_payment_id_idx` ON `time_registration`(`payment_id`);

-- AddForeignKey
ALTER TABLE `time_registration` ADD CONSTRAINT `time_registration_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `teacher_payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_payment` ADD CONSTRAINT `teacher_payment_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_payment` ADD CONSTRAINT `teacher_payment_financial_log_id_fkey` FOREIGN KEY (`financial_log_id`) REFERENCES `financial_log`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
