"""项目管理接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_superuser
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services import project_service as svc

router = APIRouter(prefix="/admin/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    keyword: str = Query("", description="按名称/标识搜索"),
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    return svc.get_project_list(db, keyword)


@router.get("/{pk}", response_model=ProjectOut)
def get_project(pk: int, db: Session = Depends(get_db), _: User = Depends(get_superuser)):
    obj = svc.get_project_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="项目不存在")
    return obj


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), _: User = Depends(get_superuser)):
    existing = svc.get_project_by_code(db, payload.project_code)
    if existing:
        raise HTTPException(status_code=400, detail="项目标识已存在")
    return svc.create_project(db, payload.model_dump())


@router.put("/{pk}", response_model=ProjectOut)
def update_project(pk: int, payload: ProjectUpdate, db: Session = Depends(get_db), _: User = Depends(get_superuser)):
    obj = svc.update_project(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="项目不存在")
    return obj


@router.delete("/{pk}")
def delete_project(pk: int, db: Session = Depends(get_db), _: User = Depends(get_superuser)):
    if not svc.delete_project(db, pk):
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"msg": "已删除"}
