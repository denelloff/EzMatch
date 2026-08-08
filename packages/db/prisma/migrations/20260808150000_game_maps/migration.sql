-- CreateTable
CREATE TABLE `game_maps` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `pool` ENUM('ACTIVE_DUTY', 'COMPETITIVE', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `game_maps_name_key`(`name`),
    INDEX `game_maps_enabled_sortOrder_idx`(`enabled`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Active Duty (Premier Season 5, Jul 2026) + common competitive maps
INSERT INTO `game_maps` (`id`, `name`, `label`, `pool`, `enabled`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('map_ad_ancient', 'de_ancient', 'Ancient', 'ACTIVE_DUTY', true, 10, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_ad_anubis', 'de_anubis', 'Anubis', 'ACTIVE_DUTY', true, 20, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_ad_cache', 'de_cache', 'Cache', 'ACTIVE_DUTY', true, 30, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_ad_dust2', 'de_dust2', 'Dust II', 'ACTIVE_DUTY', true, 40, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_ad_inferno', 'de_inferno', 'Inferno', 'ACTIVE_DUTY', true, 50, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_ad_mirage', 'de_mirage', 'Mirage', 'ACTIVE_DUTY', true, 60, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_ad_nuke', 'de_nuke', 'Nuke', 'ACTIVE_DUTY', true, 70, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_comp_overpass', 'de_overpass', 'Overpass', 'COMPETITIVE', true, 110, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_comp_train', 'de_train', 'Train', 'COMPETITIVE', true, 120, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('map_comp_vertigo', 'de_vertigo', 'Vertigo', 'COMPETITIVE', true, 130, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
