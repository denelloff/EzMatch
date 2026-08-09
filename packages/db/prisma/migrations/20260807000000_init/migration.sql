-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `passwordHash` TEXT NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    `disabledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `userAgent` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sessions_userId_idx`(`userId`),
    INDEX `sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `host` VARCHAR(191) NOT NULL,
    `sshPort` INTEGER NOT NULL DEFAULT 22,
    `publicIp` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ONLINE', 'OFFLINE', 'ERROR') NOT NULL DEFAULT 'PENDING',
    `agentVersion` VARCHAR(191) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `hostInfo` JSON NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `tokenPrefix` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NULL,

    UNIQUE INDEX `agent_tokens_serverId_key`(`serverId`),
    UNIQUE INDEX `agent_tokens_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_instances` (
    `id` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `containerName` VARCHAR(191) NOT NULL,
    `volumeName` VARCHAR(191) NOT NULL,
    `gamePort` INTEGER NOT NULL,
    `tvPort` INTEGER NOT NULL,
    `state` ENUM('CREATING', 'INSTALLING', 'STOPPED', 'STARTING', 'RUNNING', 'STOPPING', 'UPDATING', 'ERROR', 'REMOVED') NOT NULL DEFAULT 'CREATING',
    `containerId` VARCHAR(191) NULL,
    `buildId` VARCHAR(191) NULL,
    `pluginsOkBuildId` VARCHAR(191) NULL,
    `autoRestart` BOOLEAN NOT NULL DEFAULT true,
    `gsltTokenEnc` TEXT NOT NULL,
    `rconPasswordEnc` TEXT NOT NULL,
    `joinPasswordEnc` TEXT NOT NULL,
    `serverTitle` VARCHAR(191) NOT NULL,
    `maxPlayers` INTEGER NOT NULL DEFAULT 10,
    `gameType` INTEGER NOT NULL DEFAULT 0,
    `gameMode` INTEGER NOT NULL DEFAULT 1,
    `startMap` VARCHAR(191) NOT NULL DEFAULT 'de_dust2',
    `lan` BOOLEAN NOT NULL DEFAULT false,
    `hibernate` BOOLEAN NOT NULL DEFAULT false,
    `extraArgs` TEXT NOT NULL DEFAULT '',
    `logDetail` INTEGER NOT NULL DEFAULT 3,
    `logItems` BOOLEAN NOT NULL DEFAULT false,
    `lastError` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `game_instances_serverId_idx`(`serverId`),
    UNIQUE INDEX `game_instances_serverId_gamePort_key`(`serverId`, `gamePort`),
    UNIQUE INDEX `game_instances_serverId_containerName_key`(`serverId`, `containerName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plugin_installs` (
    `id` VARCHAR(191) NOT NULL,
    `instanceId` VARCHAR(191) NOT NULL,
    `pluginId` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'INSTALLED', 'FAILED', 'REMOVED', 'NEEDS_RECHECK') NOT NULL DEFAULT 'PENDING',
    `lastError` TEXT NULL,
    `installedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plugin_installs_instanceId_pluginId_key`(`instanceId`, `pluginId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `instanceId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `state` ENUM('DRAFT', 'WARMUP', 'KNIFE', 'KNIFE_DECISION', 'LIVE', 'PAUSED', 'HALFTIME', 'OVERTIME', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `map` VARCHAR(191) NOT NULL,
    `team1Name` VARCHAR(191) NOT NULL,
    `team2Name` VARCHAR(191) NOT NULL,
    `team1Score` INTEGER NOT NULL DEFAULT 0,
    `team2Score` INTEGER NOT NULL DEFAULT 0,
    `team1Side` VARCHAR(191) NOT NULL DEFAULT 'CT',
    `maxRounds` INTEGER NOT NULL DEFAULT 24,
    `overtimeEnabled` BOOLEAN NOT NULL DEFAULT true,
    `overtimeRounds` INTEGER NOT NULL DEFAULT 6,
    `knifeRound` BOOLEAN NOT NULL DEFAULT true,
    `knifeWinner` INTEGER NULL,
    `backupPrefix` VARCHAR(191) NOT NULL,
    `lastError` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `matches_instanceId_state_idx`(`instanceId`, `state`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_transitions` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `fromState` ENUM('DRAFT', 'WARMUP', 'KNIFE', 'KNIFE_DECISION', 'LIVE', 'PAUSED', 'HALFTIME', 'OVERTIME', 'FINISHED', 'CANCELLED') NOT NULL,
    `toState` ENUM('DRAFT', 'WARMUP', 'KNIFE', 'KNIFE_DECISION', 'LIVE', 'PAUSED', 'HALFTIME', 'OVERTIME', 'FINISHED', 'CANCELLED') NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_transitions_matchId_createdAt_idx`(`matchId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_players` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `steamId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `team` INTEGER NOT NULL,
    `kills` INTEGER NOT NULL DEFAULT 0,
    `deaths` INTEGER NOT NULL DEFAULT 0,
    `assists` INTEGER NOT NULL DEFAULT 0,
    `damage` INTEGER NOT NULL DEFAULT 0,
    `connected` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `match_players_matchId_steamId_key`(`matchId`, `steamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `instanceId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NULL,
    `ts` DATETIME(3) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `round` INTEGER NULL,
    `actorName` VARCHAR(191) NULL,
    `actorSteamId` VARCHAR(191) NULL,
    `actorSide` VARCHAR(191) NULL,
    `targetName` VARCHAR(191) NULL,
    `targetSteamId` VARCHAR(191) NULL,
    `targetSide` VARCHAR(191) NULL,
    `data` JSON NOT NULL,
    `raw` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `game_events_instanceId_ts_idx`(`instanceId`, `ts`),
    INDEX `game_events_matchId_ts_idx`(`matchId`, `ts`),
    INDEX `game_events_instanceId_category_ts_idx`(`instanceId`, `category`, `ts`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `console_lines` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `instanceId` VARCHAR(191) NOT NULL,
    `ts` DATETIME(3) NOT NULL,
    `line` TEXT NOT NULL,

    INDEX `console_lines_instanceId_id_idx`(`instanceId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `instanceId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT') NOT NULL DEFAULT 'QUEUED',
    `phase` VARCHAR(191) NOT NULL DEFAULT 'queued',
    `percent` INTEGER NULL,
    `message` TEXT NOT NULL,
    `error` TEXT NULL,
    `result` JSON NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,

    INDEX `tasks_serverId_createdAt_idx`(`serverId`, `createdAt`),
    INDEX `tasks_instanceId_createdAt_idx`(`instanceId`, `createdAt`),
    INDEX `tasks_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_tokens` ADD CONSTRAINT `agent_tokens_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_instances` ADD CONSTRAINT `game_instances_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plugin_installs` ADD CONSTRAINT `plugin_installs_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `game_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `game_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_transitions` ADD CONSTRAINT `match_transitions_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_players` ADD CONSTRAINT `match_players_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_events` ADD CONSTRAINT `game_events_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `game_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_events` ADD CONSTRAINT `game_events_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `console_lines` ADD CONSTRAINT `console_lines_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `game_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `game_instances`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
