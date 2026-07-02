"""长期令牌管理服务。"""
from __future__ import annotations

import secrets
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.token import LongTermToken


def get_token_list(db: Session, project_id: Optional[int] = None) -> List[LongTermToken]:
    q = db.query(LongTermToken)
    if project_id:
        q = q.filter(LongTermToken.project_id == project_id)
    return q.order_by(LongTermToken.id.desc()).all()


def get_token_by_id(db: Session, pk: int) -> Optional[LongTermToken]:
    return db.query(LongTermToken).filter(LongTermToken.id == pk).first()


def create_token(db: Session, data: dict, created_by: Optional[int] = None) -> tuple[LongTermToken, str]:
    """创建长期令牌，返回 (token对象, 明文令牌)。明文仅此一次返回。"""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_password(raw_token)
    obj = LongTermToken(
        name=data["name"],
        token_hash=token_hash,
        project_id=data["project_id"],
        created_by=created_by,
        is_active=True,
        expires_at=data.get("expires_at"),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj, raw_token


def update_token(db: Session, pk: int, data: dict) -> Optional[LongTermToken]:
    obj = get_token_by_id(db, pk)
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_token(db: Session, pk: int) -> bool:
    obj = get_token_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def verify_raw_token(db: Session, raw_token: str) -> Optional[LongTermToken]:
    """验证明文令牌，返回匹配且有效的 token 对象。"""
    from app.core.security import verify_password

    tokens = db.query(LongTermToken).filter(LongTermToken.is_active == True).all()
    for t in tokens:
        if verify_password(raw_token, t.token_hash):
            if t.expires_at and t.expires_at < datetime.utcnow():
                return None
            t.last_used_at = datetime.utcnow()
            db.commit()
            return t
    return None
