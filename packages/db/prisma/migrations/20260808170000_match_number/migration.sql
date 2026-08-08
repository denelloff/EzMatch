-- Sequential human-facing match ids (#1, #2, …)
ALTER TABLE `matches` ADD COLUMN `number` INT NULL;

SET @n := 0;
UPDATE `matches`
SET `number` = (@n := @n + 1)
ORDER BY `createdAt` ASC, `id` ASC;

ALTER TABLE `matches`
  MODIFY COLUMN `number` INT NOT NULL AUTO_INCREMENT,
  ADD UNIQUE INDEX `matches_number_key`(`number`);
