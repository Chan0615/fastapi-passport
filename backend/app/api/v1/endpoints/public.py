"""公开接口：无需认证的项目查询（供业务系统代理端点使用）"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.services.project_service import get_project_by_code

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/project-code/{code}")
def get_project_id_by_code(code: str, db: Session = Depends(get_db)):
    """根据 project_code 查询项目基本信息（无需认证）。"""
    project = get_project_by_code(db, code)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {
        "id": project.id,
        "name": project.name,
        "project_code": project.project_code,
    }
