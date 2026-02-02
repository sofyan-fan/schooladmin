-- CreateTable
CREATE TABLE `finance_budget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default budget record
INSERT INTO `finance_budget` (`amount`, `updated_at`) VALUES (5000, NOW());
