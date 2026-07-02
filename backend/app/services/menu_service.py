"""菜单管理服务。菜单按项目隔离，支持树形结构。"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.menu import Menu
from app.models.user import User


def get_menu_list(db: Session, project_id: Optional[int] = None) -> List[Menu]:
    q = db.query(Menu)
    if project_id:
        q = q.filter(Menu.project_id == project_id)
    return q.order_by(Menu.sort_order).all()


def get_menu_tree(db: Session, project_id: int) -> List[Menu]:
    return (
        db.query(Menu)
        .filter(Menu.project_id == project_id)
        .filter(Menu.parent_id.is_(None))
        .order_by(Menu.sort_order)
        .all()
    )


def get_menu_by_id(db: Session, pk: int) -> Optional[Menu]:
    return db.query(Menu).filter(Menu.id == pk).first()


def create_menu(db: Session, data: dict) -> Menu:
    obj = Menu(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_menu(db: Session, pk: int, data: dict) -> Optional[Menu]:
    obj = get_menu_by_id(db, pk)
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_menu(db: Session, pk: int) -> bool:
    obj = get_menu_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def get_user_menus(db: Session, user: User, project_id: int) -> List[dict]:
    """获取用户在指定项目下的菜单树（不含按钮）。"""
    if user.is_superuser:
        menus = (
            db.query(Menu)
            .filter(Menu.project_id == project_id)
            .filter(Menu.menu_type != "button")
            .filter(Menu.is_visible == True)
            .order_by(Menu.sort_order)
            .all()
        )
    else:
        menu_ids = set()
        for role in user.roles:
            if not role.is_active:
                continue
            if role.project_id != project_id:
                continue
            for menu in role.menus:
                menu_ids.add(menu.id)

        if not menu_ids:
            return []

        menus = (
            db.query(Menu)
            .filter(Menu.id.in_(menu_ids))
            .filter(Menu.project_id == project_id)
            .filter(Menu.menu_type != "button")
            .filter(Menu.is_visible == True)
            .order_by(Menu.sort_order)
            .all()
        )

    menu_map = {
        m.id: {
            "id": m.id,
            "name": m.name,
            "path": m.path,
            "icon": m.icon,
            "parent_id": m.parent_id,
            "sort_order": m.sort_order,
            "children": [],
        }
        for m in menus
    }

    tree = []
    for m in menus:
        node = menu_map[m.id]
        if m.parent_id and m.parent_id in menu_map:
            menu_map[m.parent_id]["children"].append(node)
        else:
            tree.append(node)

    return tree
