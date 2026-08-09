-- AlterTable
ALTER TABLE `matches` ADD COLUMN `freezetime` INTEGER NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE `app_settings` (
    `key` VARCHAR(64) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
