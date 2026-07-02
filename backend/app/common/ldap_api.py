"""LDAP 认证 API 客户端。

从 config.yaml system_root.ldap 读取 LDAP 服务基地址，
调用 login-new / search-new 等接口完成 LDAP 操作。
"""
import logging
from typing import Optional

import httpx

from app.config import bootstrap_config

logger = logging.getLogger(__name__)


def _get_ldap_base_url() -> str:
    return bootstrap_config.system_root.ldap.rstrip("/")


async def ldap_verify(username: str, password: str) -> Optional[dict]:
    """调用 LDAP login-new 接口验证用户身份。

    Returns:
        验证成功返回用户信息 dict，失败返回包含 success=False 的 dict，异常返回 None。
    """
    url = f"{_get_ldap_base_url()}/login-new"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json={
                    "username": username,
                    "password": password,
                    "ouname": "dobest",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    logger.info(f"LDAP 验证成功: {username}")
                    return data
                else:
                    logger.warning(f"LDAP 验证失败: {username}, msg={data.get('msg')}")
                    return data
            logger.warning(f"LDAP 请求异常状态: {resp.status_code}")
            return None
    except httpx.RequestError as e:
        logger.error(f"LDAP 请求异常: {e}")
        return None


async def ldap_search(username: str) -> Optional[dict]:
    """调用 LDAP search-new 接口查询用户信息。"""
    url = f"{_get_ldap_base_url()}/search-new"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json={"username": username, "ouname": "dobest"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return data if data.get("exist") else None
            return None
    except httpx.RequestError as e:
        logger.error(f"LDAP 查询异常: {e}")
        return None
