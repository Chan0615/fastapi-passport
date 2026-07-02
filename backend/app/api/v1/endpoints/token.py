"""长期令牌管理接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_current_user
from app.models.user import User
from app.schemas.token import TokenCreate, TokenCreateResponse, TokenOut, TokenUpdate
from app.services import token_service as svc

router = APIRouter(prefix="/admin/tokens", tags=["tokens"])


@router.get("", response_model=list[TokenOut])
def list_tokens(
    project_id: int = Query(None, description="按项目筛选"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_token_list(db, project_id)


@router.post("", response_model=TokenCreateResponse, status_code=201)
def create_token(
    payload: TokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj, raw_token = svc.create_token(db, payload.model_dump(), created_by=current_user.id)
    return TokenCreateResponse(
        id=obj.id,
        name=obj.name,
        project_id=obj.project_id,
        created_by=obj.created_by,
        is_active=obj.is_active,
        expires_at=obj.expires_at,
        last_used_at=obj.last_used_at,
        created_at=obj.created_at,
        token=raw_token,
    )


@router.put("/{pk}", response_model=TokenOut)
def update_token(pk: int, payload: TokenUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = svc.update_token(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="令牌不存在")
    return obj


@router.delete("/{pk}")
def delete_token(pk: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if not svc.delete_token(db, pk):
        raise HTTPException(status_code=404, detail="令牌不存在")
    return {"msg": "已删除"}
