"""角色管理接口。角色按项目隔离。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_current_user
from app.models.user import User
from app.schemas.role import RoleCreate, RoleMenuAssign, RoleOut, RoleUpdate
from app.services import role_service as svc

router = APIRouter(prefix="/admin/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut])
def list_roles(
    project_id: int = Query(None, description="按项目筛选"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_role_list(db, project_id)


@router.get("/{pk}", response_model=RoleOut)
def get_role(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.get_role_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


@router.post("", response_model=RoleOut, status_code=201)
def create_role(payload: RoleCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return svc.create_role(db, payload.model_dump())


@router.put("/{pk}", response_model=RoleOut)
def update_role(pk: int, payload: RoleUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.update_role(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


@router.delete("/{pk}")
def delete_role(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if not svc.delete_role(db, pk):
        raise HTTPException(status_code=404, detail="角色不存在")
    return {"msg": "已删除"}


@router.post("/{pk}/menus", response_model=RoleOut)
def assign_role_menus(
    pk: int,
    payload: RoleMenuAssign,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = svc.assign_menus_to_role(db, pk, payload.menu_ids)
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj
