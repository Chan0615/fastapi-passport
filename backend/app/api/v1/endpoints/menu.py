"""菜单管理接口。菜单按项目隔离。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_current_user
from app.models.user import User
from app.schemas.menu import MenuCreate, MenuOut, MenuUpdate
from app.services import menu_service as svc

router = APIRouter(prefix="/admin/menus", tags=["menus"])


@router.get("", response_model=list[MenuOut])
def list_menus(
    project_id: int = Query(None, description="按项目筛选"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_menu_list(db, project_id)


@router.get("/tree", response_model=list[MenuOut])
def get_menu_tree(
    project_id: int = Query(..., description="项目 ID"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_menu_tree(db, project_id)


@router.get("/{pk}", response_model=MenuOut)
def get_menu(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.get_menu_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="菜单不存在")
    return obj


@router.post("", response_model=MenuOut, status_code=201)
def create_menu(payload: MenuCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return svc.create_menu(db, payload.model_dump())


@router.put("/{pk}", response_model=MenuOut)
def update_menu(pk: int, payload: MenuUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.update_menu(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="菜单不存在")
    return obj


@router.delete("/{pk}")
def delete_menu(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if not svc.delete_menu(db, pk):
        raise HTTPException(status_code=404, detail="菜单不存在")
    return {"msg": "已删除"}
