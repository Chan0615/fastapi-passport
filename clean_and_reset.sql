USE fastapi_passport;
SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Clean passport database
DELETE FROM role_menu;
DELETE FROM user_role;
DELETE FROM menu;
DELETE FROM role;
DELETE FROM project;
DELETE FROM user;
DELETE FROM operation_log;

ALTER TABLE project AUTO_INCREMENT = 1;
ALTER TABLE role AUTO_INCREMENT = 1;
ALTER TABLE menu AUTO_INCREMENT = 1;
ALTER TABLE user AUTO_INCREMENT = 1;

-- Step 2: Drop old auth tables from fastapi-ant-demo
DROP TABLE IF EXISTS kefu_fastapi_ant_demo.user_role;
DROP TABLE IF EXISTS kefu_fastapi_ant_demo.role_menu;
DROP TABLE IF EXISTS kefu_fastapi_ant_demo.user;
DROP TABLE IF EXISTS kefu_fastapi_ant_demo.role;
DROP TABLE IF EXISTS kefu_fastapi_ant_demo.menu;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'OK' AS result;
