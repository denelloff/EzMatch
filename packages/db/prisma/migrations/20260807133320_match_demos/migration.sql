-- AlterTable
ALTER TABLE `matches` ADD COLUMN `demoName` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `match_demos` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `sizeBytes` BIGINT NOT NULL DEFAULT 0,
    `recordedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `match_demos_matchId_fileName_key`(`matchId`, `fileName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `match_demos` ADD CONSTRAINT `match_demos_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
