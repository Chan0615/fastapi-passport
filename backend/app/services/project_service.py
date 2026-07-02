"""项目（租户）管理服务。"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.project import Project


def get_project_list(db: Session, keyword: str = "") -> List[Project]:
    q = db.query(Project)
    if keyword:
        q = q.filter(
            (Project.name.contains(keyword))
            | (Project.project_code.contains(keyword))
        )
    return q.order_by(Project.id).all()


def get_project_by_id(db: Session, pk: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == pk).first()


def get_project_by_code(db: Session, code: str) -> Optional[Project]:
    return db.query(Project).filter(Project.project_code == code).first()


def create_project(db: Session, data: dict) -> Project:
    obj = Project(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_project(db: Session, pk: int, data: dict) -> Optional[Project]:
    obj = get_project_by_id(db, pk)
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_project(db: Session, pk: int) -> bool:
    obj = get_project_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
