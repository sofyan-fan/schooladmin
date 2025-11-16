-- AlterTable
ALTER TABLE `assessment` ADD COLUMN `school_year_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `class_layout` ADD COLUMN `school_year_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `financial_log` ADD COLUMN `school_year_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `roster` ADD COLUMN `school_year_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `schedule` ADD COLUMN `school_year_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `tuition_payment` ADD COLUMN `school_year_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `school_year` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,

    INDEX `school_year_is_active_idx`(`is_active`),
    INDEX `school_year_is_archived_idx`(`is_archived`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `assessment_school_year_id_idx` ON `assessment`(`school_year_id`);

-- CreateIndex
CREATE INDEX `class_layout_school_year_id_idx` ON `class_layout`(`school_year_id`);

-- CreateIndex
CREATE UNIQUE INDEX `class_layout_name_school_year_id_key` ON `class_layout`(`name`, `school_year_id`);

-- CreateIndex
CREATE INDEX `financial_log_school_year_id_idx` ON `financial_log`(`school_year_id`);

-- CreateIndex
CREATE INDEX `roster_school_year_id_idx` ON `roster`(`school_year_id`);

-- CreateIndex
CREATE INDEX `schedule_school_year_id_idx` ON `schedule`(`school_year_id`);

-- CreateIndex
CREATE INDEX `tuition_payment_school_year_id_idx` ON `tuition_payment`(`school_year_id`);

-- AddForeignKey
ALTER TABLE `class_layout` ADD CONSTRAINT `class_layout_school_year_id_fkey` FOREIGN KEY (`school_year_id`) REFERENCES `school_year`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment` ADD CONSTRAINT `assessment_school_year_id_fkey` FOREIGN KEY (`school_year_id`) REFERENCES `school_year`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_school_year_id_fkey` FOREIGN KEY (`school_year_id`) REFERENCES `school_year`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roster` ADD CONSTRAINT `roster_school_year_id_fkey` FOREIGN KEY (`school_year_id`) REFERENCES `school_year`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tuition_payment` ADD CONSTRAINT `tuition_payment_school_year_id_fkey` FOREIGN KEY (`school_year_id`) REFERENCES `school_year`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_log` ADD CONSTRAINT `financial_log_school_year_id_fkey` FOREIGN KEY (`school_year_id`) REFERENCES `school_year`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

