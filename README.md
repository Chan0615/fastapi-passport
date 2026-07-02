# FastAPI Passport 认证中心

内网统一认证与授权中心，域名 `http://passport.ops.com/`。

将多个业务系统（`*.ops.com`）的登录认证、用户/角色/菜单管理统一收口，各系统通过调用 fastapi_passport 的 API 完成认证和权限获取。

## 核心能力

- **LDAP 统一认证**：所有系统共用一套 LDAP 登录，无需各自实现
- **JWT 签发**：passport 签发 JWT，业务系统使用共享 `secret_key` 本地验证，无需每次请求都调 passport
- **多项目隔离**：每个业务系统注册为 Project，角色/菜单/令牌按项目隔离
- **按钮级权限**：菜单支持目录/菜单/按钮三种类型，实现精细化权限控制
- **长期令牌**：为 CI/CD 等非交互场景签发长期 API 令牌
- **操作审计**：自动记录所有写操作日志

## 架构

```
业务系统 A (xxx.ops.com)  ──┐
业务系统 B (yyy.ops.com)  ──┼──▶ POST /api/v1/auth/login {username, password, project_code}
业务系统 C (zzz.ops.com)  ──┘         │
                                      ▼
                              ┌───────────────┐
                              │   FastAPI     │
                              │   Passport    │
                              │               │
                              │  LDAP 验证    │
                              │  JWT 签发     │
                              │  菜单/权限返回 │
                              └───────────────┘
                                      │
                          返回: token + user + menus + permissions
                                      │
                                      ▼
                    业务系统本地验证 JWT (共享 secret_key)
```

### 登录流程

1. 用户在业务系统 LoginPage 输入用户名、密码
2. 业务系统调用 `POST http://passport.ops.com/api/v1/auth/login`，传入 `{username, password, project_code}`
3. passport 通过 LDAP 验证身份，签发 JWT（含 `project_code`）
4. 返回 `{access_token, user, menus, permissions}`（菜单和权限仅限该 `project_code`）
5. 业务系统将 token 存入 localStorage，后续请求携带 `Authorization: Bearer <token>`
6. 业务系统使用与 passport 相同的 `secret_key` 本地验证 JWT，无需每次请求都调 passport

### 多项目隔离

| 实体 | 隔离方式 |
|------|---------|
| Project | 每个业务系统注册为一个 Project（`project_code` 唯一） |
| User | 全局用户，通过角色关联到不同项目 |
| Role | 按项目隔离（`project_id`） |
| Menu | 按项目隔离（`project_id`） |
| LongTermToken | 按项目隔离（`project_id`） |

## 数据模型

```
Project 1──N Role N──N Menu
              │
              │ N──N
              ▼
            User (全局)

Project 1──N LongTermToken
```

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登录（传入 username/password/project_code） |
| POST | `/api/v1/auth/logout` | 退出登录 |
| POST | `/api/v1/auth/verify` | 验证令牌（备用，通常业务系统本地验证） |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |
| GET | `/api/v1/auth/menus?project_code=xxx` | 获取用户在指定项目的菜单树 |
| GET | `/api/v1/auth/permissions?project_code=xxx` | 获取用户在指定项目的按钮权限 |

### 管理接口（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/api/v1/admin/projects` | 项目 CRUD（需超管） |
| GET/POST/PUT/DELETE | `/api/v1/admin/users` | 用户 CRUD |
| POST | `/api/v1/admin/users/{id}/roles` | 为用户分配角色 |
| GET/POST/PUT/DELETE | `/api/v1/admin/roles?project_id=x` | 角色 CRUD（按项目） |
| POST | `/api/v1/admin/roles/{id}/menus` | 为角色分配菜单 |
| GET/POST/PUT/DELETE | `/api/v1/admin/menus?project_id=x` | 菜单 CRUD（按项目） |
| GET/POST/PUT/DELETE | `/api/v1/admin/tokens` | 长期令牌管理 |
| GET | `/api/v1/admin/logs` | 操作日志查询 |

## 本地开发

### 后端

```bash
cd backend
pip install -r requirements.txt
# 编辑 config/config.yaml 配置数据库和 LDAP
python -m app.main
# 或
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev  # http://localhost:3000
```

### 首次登录

系统启动后自动创建种子数据：
- 项目：`fastapi_passport`（管理后台自身）
- 角色：超级管理员、游客
- 菜单：项目管理、用户管理、角色管理、菜单管理、令牌管理、操作日志

使用 LDAP 账号登录，`project_code` 填 `fastapi_passport`。首次登录的用户自动创建，需联系超管在用户管理中勾选「超级管理员」才能访问管理功能。

## Docker 部署

```bash
cd docker_deploy
cp ../config/config.yaml.example ../config/config.yaml
# 编辑 config.yaml 填入真实配置
bash deploy.sh up
```

前端映射端口 `8084`，通过 Nginx 反代 `/api/` 到后端。

## 业务系统接入

### 1. 注册项目

在 passport 管理后台「项目管理」中新增项目，记录 `project_code`。

### 2. 配置菜单与角色

为该项目创建菜单（目录/菜单/按钮）和角色，并为角色分配菜单权限。

### 3. 分配用户角色

在「用户管理」中为用户分配该项目的角色。

### 4. 业务系统调用登录

```python
import httpx

resp = httpx.post("http://passport.ops.com/api/v1/auth/login", json={
    "username": "zhangsan",
    "password": "xxx",
    "project_code": "your_project_code",
})
data = resp.json()
token = data["access_token"]
menus = data["menus"]       # 该项目的菜单树
perms = data["permissions"] # 该项目的按钮权限列表
```

### 5. 本地验证 JWT

业务系统使用与 passport 相同的 `secret_key` 本地验证 JWT：

```python
from jose import jwt

payload = jwt.decode(token, secret_key, algorithms=["HS256"])
user_id = payload["sub"]
username = payload["username"]
project_code = payload["project_code"]
```

## 技术栈

- 后端：FastAPI + SQLAlchemy + MySQL + python-jose
- 前端：React 18 + Ant Design 5 + Vite + TypeScript
- 认证：LDAP + JWT
- 部署：Docker + Nginx
