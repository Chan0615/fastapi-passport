"""首次启动时写入种子数据。

注册 fastapi_passport 自身为项目 admin_app，并创建管理员/游客角色及管理菜单。
"""
import logging

from sqlalchemy import text

from app.common.database import SessionLocal

logger = logging.getLogger(__name__)

# ────── fastapi_passport 自身项目 ──────
PROJECT_SQL = """
INSERT INTO project (name, project_code, description, status)
VALUES ('FastAPI Passport 管理后台', 'fastapi_passport', '认证中心管理界面', 'active')
"""

# ────── 角色（属于 fastapi_passport 项目）──────
ROLES_SQL = """
INSERT INTO role (name, description, project_id, is_active)
SELECT '超级管理员', '拥有全部权限', p.id, 1 FROM project p WHERE p.project_code = 'fastapi_passport'
UNION ALL
SELECT '游客', '仅浏览首页', p.id, 1 FROM project p WHERE p.project_code = 'fastapi_passport'
"""

# ────── 菜单（属于 fastapi_passport 项目）──────
MENUS_SQL = """
INSERT INTO menu (name, menu_type, path, icon, permission, parent_id, project_id, sort_order, is_visible)
SELECT m.name, m.menu_type, m.path, m.icon, m.permission, NULL, p.id, m.sort_order, 1
FROM project p
CROSS JOIN (
    SELECT '首页' AS name, 'menu' AS menu_type, '/' AS path, 'HomeOutlined' AS icon, '' AS permission, 1 AS sort_order
    UNION ALL SELECT '系统管理', 'directory', '', 'SettingOutlined', '', 2
    UNION ALL SELECT '项目管理', 'menu', '/admin/projects', 'ProjectOutlined', '', 3
    UNION ALL SELECT '用户管理', 'menu', '/admin/users', 'UserOutlined', '', 4
    UNION ALL SELECT '角色管理', 'menu', '/admin/roles', 'SafetyOutlined', '', 5
    UNION ALL SELECT '菜单管理', 'menu', '/admin/menus', 'AppstoreOutlined', '', 6
    UNION ALL SELECT '令牌管理', 'menu', '/admin/tokens', 'KeyOutlined', '', 7
    UNION ALL SELECT '操作日志', 'menu', '/admin/logs', 'FileTextOutlined', '', 8
    UNION ALL SELECT '新增项目', 'button', '', '', 'project:add', 9
    UNION ALL SELECT '编辑项目', 'button', '', '', 'project:edit', 10
    UNION ALL SELECT '删除项目', 'button', '', '', 'project:delete', 11
    UNION ALL SELECT '编辑用户', 'button', '', '', 'user:edit', 12
    UNION ALL SELECT '删除用户', 'button', '', '', 'user:delete', 13
    UNION ALL SELECT '分配角色', 'button', '', '', 'user:assign', 14
    UNION ALL SELECT '新增角色', 'button', '', '', 'role:add', 15
    UNION ALL SELECT '编辑角色', 'button', '', '', 'role:edit', 16
    UNION ALL SELECT '删除角色', 'button', '', '', 'role:delete', 17
    UNION ALL SELECT '分配菜单', 'button', '', '', 'role:assign', 18
    UNION ALL SELECT '新增菜单', 'button', '', '', 'menu:add', 19
    UNION ALL SELECT '编辑菜单', 'button', '', '', 'menu:edit', 20
    UNION ALL SELECT '删除菜单', 'button', '', '', 'menu:delete', 21
    UNION ALL SELECT '新增令牌', 'button', '', '', 'token:add', 22
    UNION ALL SELECT '编辑令牌', 'button', '', '', 'token:edit', 23
    UNION ALL SELECT '删除令牌', 'button', '', '', 'token:delete', 24
) m
WHERE p.project_code = 'fastapi_passport'
"""

# ────── 菜单层级：系统管理下的子菜单 ──────
UPDATE_MENU_PARENT_SQL = """
UPDATE menu
SET parent_id = (
    SELECT sub.id FROM (
        SELECT id FROM menu WHERE name = '系统管理' AND project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')
    ) sub
)
WHERE name IN ('项目管理', '用户管理', '角色管理', '菜单管理', '令牌管理', '操作日志')
  AND parent_id IS NULL
  AND project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')
"""

# ────── 按钮的父菜单 ──────
UPDATE_BUTTON_PARENT_SQL = """
UPDATE menu child
JOIN menu parent ON child.project_id = parent.project_id
SET child.parent_id = parent.id
WHERE child.parent_id IS NULL
  AND child.menu_type = 'button'
  AND (
    (child.permission LIKE 'project:%' AND parent.name = '项目管理')
    OR (child.permission LIKE 'user:%' AND parent.name = '用户管理')
    OR (child.permission LIKE 'role:%' AND parent.name = '角色管理')
    OR (child.permission LIKE 'menu:%' AND parent.name = '菜单管理')
    OR (child.permission LIKE 'token:%' AND parent.name = '令牌管理')
  )
  AND child.project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')
"""

# ────── 超级管理员角色拥有全部菜单 ──────
ROLE_MENU_SQL = """
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM role r
JOIN menu m ON m.project_id = r.project_id
WHERE r.name = '超级管理员'
  AND r.project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')
  AND NOT EXISTS (SELECT 1 FROM role_menu rm WHERE rm.role_id = r.id AND rm.menu_id = m.id)
"""

# ────── 游客角色仅拥有首页 ──────
GUEST_MENU_SQL = """
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM role r
JOIN menu m ON m.project_id = r.project_id
WHERE r.name = '游客'
  AND r.project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')
  AND m.name = '首页'
  AND NOT EXISTS (SELECT 1 FROM role_menu rm WHERE rm.role_id = r.id AND rm.menu_id = m.id)
"""


def seed_initial_data() -> None:
    db = SessionLocal()
    try:
        # 项目
        proj_count = db.execute(
            text("SELECT COUNT(*) FROM project WHERE project_code = 'fastapi_passport'")
        ).scalar() or 0
        if proj_count == 0:
            db.execute(text(PROJECT_SQL))
            db.commit()
            logger.info("初始化 fastapi_passport 项目完成")

        # 角色
        role_count = db.execute(
            text("SELECT COUNT(*) FROM role WHERE project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')")
        ).scalar() or 0
        if role_count == 0:
            db.execute(text(ROLES_SQL))
            db.commit()
            logger.info("初始化角色数据完成")

        # 菜单
        menu_count = db.execute(
            text("SELECT COUNT(*) FROM menu WHERE project_id = (SELECT id FROM project WHERE project_code = 'fastapi_passport')")
        ).scalar() or 0
        if menu_count == 0:
            db.execute(text(MENUS_SQL))
            db.commit()
            db.execute(text(UPDATE_MENU_PARENT_SQL))
            db.commit()
            db.execute(text(UPDATE_BUTTON_PARENT_SQL))
            db.commit()
            logger.info("初始化菜单数据完成")

        # 角色-菜单关联
        rm_count = db.execute(text("SELECT COUNT(*) FROM role_menu")).scalar() or 0
        if rm_count == 0:
            db.execute(text(ROLE_MENU_SQL))
            db.commit()
            db.execute(text(GUEST_MENU_SQL))
            db.commit()
            logger.info("初始化角色菜单关联完成")
    finally:
        db.close()
