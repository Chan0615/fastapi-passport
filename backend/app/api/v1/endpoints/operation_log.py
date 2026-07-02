"""操作日志查询接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/admin/logs", tags=["operation-logs"])


@router.get("")
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    module: str = Query("", description="按模块筛选"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    sql = "SELECT * FROM operation_log"
    count_sql = "SELECT COUNT(*) FROM operation_log"
    params = {}
    if module:
        sql += " WHERE module = :module"
        count_sql += " WHERE module = :module"
        params["module"] = module

    sql += " ORDER BY id DESC LIMIT :limit OFFSET :offset"
    params["limit"] = page_size
    params["offset"] = offset

    rows = db.execute(text(sql), params).mappings().all()
    total = db.execute(text(count_sql), {k: v for k, v in params.items() if k != "limit" and k != "offset"}).scalar()

    return {
        "items": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
