-- =============================================================
-- 在 passport 数据库中注册 fastapi-ant-demo 项目及其菜单/角色
-- 菜单包含系统管理（用户/角色/菜单管理）+ 业务菜单
-- 用法：mysql -u root -p passport < seed_fastapi_ant_demo.sql
-- =============================================================

-- 1. 注册项目
INSERT IGNORE INTO project (name, project_code, description, status)
VALUES ('运维管理系统', 'fastapi-ant-demo', 'FastAPI + Ant Design 运维管理平台', 'active');

SET @project_id = (SELECT id FROM project WHERE project_code = 'fastapi-ant-demo');

-- 2. 创建角色
INSERT IGNORE INTO role (name, description, project_id, is_active)
VALUES
  ('guest', '游客（默认角色，仅浏览）', @project_id, 1),
  ('admin', '管理员', @project_id, 1),
  ('super_admin', '超级管理员（拥有全部权限）', @project_id, 1);

-- 3. 创建菜单（系统管理 + 业务菜单，通过 passport 接口操作）
INSERT IGNORE INTO menu (name, menu_type, path, icon, permission, parent_id, project_id, sort_order, is_visible)
SELECT m.name, m.menu_type, m.path, m.icon, m.permission, NULL, @project_id, m.sort_order, 1
FROM (
    SELECT '首页' AS name, 'menu' AS menu_type, '/' AS path, 'HomeOutlined' AS icon, '' AS permission, 1 AS sort_order
    UNION ALL SELECT '系统管理', 'directory', '', 'SettingOutlined', '', 2
    UNION ALL SELECT '用户管理', 'menu', '/admin/users', 'UserOutlined', '', 3
    UNION ALL SELECT '角色管理', 'menu', '/admin/roles', 'SafetyOutlined', '', 4
    UNION ALL SELECT '菜单管理', 'menu', '/admin/menus', 'AppstoreOutlined', '', 5
    UNION ALL SELECT '操作日志', 'menu', '/admin/logs', 'FileTextOutlined', '', 6
    UNION ALL SELECT '数据源管理', 'menu', '/admin/db-config', 'DatabaseOutlined', '', 7
    UNION ALL SELECT '客服攻防系统', 'menu', '/admin/kefu-attack-system', 'BugOutlined', '', 8
    UNION ALL SELECT '新增用户', 'button', '', '', 'user:add', 9
    UNION ALL SELECT '编辑用户', 'button', '', '', 'user:edit', 10
    UNION ALL SELECT '删除用户', 'button', '', '', 'user:delete', 11
    UNION ALL SELECT '分配角色', 'button', '', '', 'user:assign', 12
    UNION ALL SELECT '新增角色', 'button', '', '', 'role:add', 13
    UNION ALL SELECT '编辑角色', 'button', '', '', 'role:edit', 14
    UNION ALL SELECT '删除角色', 'button', '', '', 'role:delete', 15
    UNION ALL SELECT '分配菜单', 'button', '', '', 'role:assign', 16
    UNION ALL SELECT '新增菜单', 'button', '', '', 'menu:add', 17
    UNION ALL SELECT '编辑菜单', 'button', '', '', 'menu:edit', 18
    UNION ALL SELECT '删除菜单', 'button', '', '', 'menu:delete', 19
    UNION ALL SELECT '新增数据源', 'button', '', '', 'db:add', 20
    UNION ALL SELECT '编辑数据源', 'button', '', '', 'db:edit', 21
    UNION ALL SELECT '删除数据源', 'button', '', '', 'db:delete', 22
) m;

-- 4. 系统管理下的子菜单
UPDATE menu
SET parent_id = (
    SELECT sub.id FROM (SELECT id FROM menu WHERE name = '系统管理' AND project_id = @project_id) sub
)
WHERE name IN ('用户管理', '角色管理', '菜单管理', '操作日志', '数据源管理')
  AND parent_id IS NULL AND project_id = @project_id;

-- 5. 按钮的父菜单关联
UPDATE menu child
JOIN menu parent ON child.project_id = parent.project_id
SET child.parent_id = parent.id
WHERE child.parent_id IS NULL AND child.menu_type = 'button'
  AND child.project_id = @project_id
  AND (
    (child.permission LIKE 'user:%' AND parent.name = '用户管理')
    OR (child.permission LIKE 'role:%' AND parent.name = '角色管理')
    OR (child.permission LIKE 'menu:%' AND parent.name = '菜单管理')
    OR (child.permission LIKE 'db:%' AND parent.name = '数据源管理')
  );

-- 6. 角色-菜单关联
INSERT IGNORE INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r
JOIN menu m ON m.project_id = r.project_id
WHERE r.name = 'super_admin' AND r.project_id = @project_id;

INSERT IGNORE INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r
JOIN menu m ON m.project_id = r.project_id
WHERE r.name = 'admin' AND r.project_id = @project_id
  AND NOT EXISTS (SELECT 1 FROM role_menu rm WHERE rm.role_id = r.id AND rm.menu_id = m.id);

INSERT IGNORE INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r
JOIN menu m ON m.project_id = r.project_id
WHERE r.name = 'guest' AND r.project_id = @project_id AND m.name = '首页'
  AND NOT EXISTS (SELECT 1 FROM role_menu rm WHERE rm.role_id = r.id AND rm.menu_id = m.id);

SELECT 'Seed complete. Project fastapi-ant-demo registered with admin menus.' AS result;
