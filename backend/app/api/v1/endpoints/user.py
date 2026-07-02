"""用户管理接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserRoleAssign, UserUpdate
from app.services import user_service as svc

router = APIRouter(prefix="/admin/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(
    keyword: str = Query("", description="按用户名搜索"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_user_list(db, keyword)


@router.get("/{pk}", response_model=UserOut)
def get_user(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.get_user_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    existing = svc.get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    return svc.create_user(db, payload.model_dump())


@router.put("/{pk}", response_model=UserOut)
def update_user(pk: int, payload: UserUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.update_user(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


@router.delete("/{pk}")
def delete_user(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if not svc.delete_user(db, pk):
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"msg": "已删除"}


@router.post("/{pk}/roles", response_model=UserOut)
def assign_user_roles(
    pk: int,
    payload: UserRoleAssign,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = svc.assign_roles_to_user(db, pk, payload.role_ids)
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj
