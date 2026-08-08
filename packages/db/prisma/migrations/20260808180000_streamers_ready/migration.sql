-- AlterTable
ALTER TABLE `matches` ADD COLUMN `streamersReady` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `match_players` ADD COLUMN `ready` BOOLEAN NOT NULL DEFAULT false;
