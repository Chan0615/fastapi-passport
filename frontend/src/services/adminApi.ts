import request from '../utils/request';

// ────── 类型定义 ──────

export interface ProjectInfo {
  id: number;
  name: string;
  project_code: string;
  description: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoleBrief {
  id: number;
  name: string;
  description: string;
  project_id: number;
}

export interface MenuInfo {
  id: number;
  name: string;
  menu_type: string;
  path: string;
  icon: string;
  permission: string;
  parent_id: number | null;
  project_id: number;
  sort_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleInfo {
  id: number;
  name: string;
  description: string;
  project_id: number;
  is_active: boolean;
  menus: MenuInfo[];
  created_at?: string;
  updated_at?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string | null;
  display_name: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: RoleBrief[];
  created_at?: string;
  updated_at?: string;
}

export interface TokenInfo {
  id: number;
  name: string;
  project_id: number;
  created_by: number | null;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at?: string;
}

export interface TokenCreateResponse extends TokenInfo {
  token: string;
}

// ────── 项目管理 ──────

export const projectApi = {
  list: (keyword?: string) =>
    request.get<ProjectInfo[]>('/admin/projects', { params: keyword ? { keyword } : {} }),
  get: (id: number) => request.get<ProjectInfo>(`/admin/projects/${id}`),
  create: (data: { name: string; project_code: string; description?: string; status?: string }) =>
    request.post<ProjectInfo>('/admin/projects', data),
  update: (id: number, data: Partial<{ name: string; project_code: string; description: string; status: string }>) =>
    request.put<ProjectInfo>(`/admin/projects/${id}`, data),
  delete: (id: number) => request.delete(`/admin/projects/${id}`),
};

// ────── 用户管理 ──────

export const userApi = {
  list: (keyword?: string) =>
    request.get<UserInfo[]>('/admin/users', { params: keyword ? { keyword } : {} }),
  get: (id: number) => request.get<UserInfo>(`/admin/users/${id}`),
  create: (data: { username: string; email?: string; display_name?: string; password?: string; is_active?: boolean; is_superuser?: boolean }) =>
    request.post<UserInfo>('/admin/users', data),
  update: (id: number, data: Partial<{ email: string; display_name: string; password: string; is_active: boolean; is_superuser: boolean }>) =>
    request.put<UserInfo>(`/admin/users/${id}`, data),
  delete: (id: number) => request.delete(`/admin/users/${id}`),
  assignRoles: (id: number, role_ids: number[]) =>
    request.post<UserInfo>(`/admin/users/${id}/roles`, { role_ids }),
};

// ────── 角色管理 ──────

export const roleApi = {
  list: (projectId?: number) =>
    request.get<RoleInfo[]>('/admin/roles', { params: projectId ? { project_id: projectId } : {} }),
  get: (id: number) => request.get<RoleInfo>(`/admin/roles/${id}`),
  create: (data: { name: string; description?: string; project_id: number; is_active?: boolean }) =>
    request.post<RoleInfo>('/admin/roles', data),
  update: (id: number, data: Partial<{ name: string; description: string; is_active: boolean }>) =>
    request.put<RoleInfo>(`/admin/roles/${id}`, data),
  delete: (id: number) => request.delete(`/admin/roles/${id}`),
  assignMenus: (id: number, menu_ids: number[]) =>
    request.post<RoleInfo>(`/admin/roles/${id}/menus`, { menu_ids }),
};

// ────── 菜单管理 ──────

export const menuApi = {
  list: (projectId?: number) =>
    request.get<MenuInfo[]>('/admin/menus', { params: projectId ? { project_id: projectId } : {} }),
  tree: (projectId: number) =>
    request.get<MenuInfo[]>('/admin/menus/tree', { params: { project_id: projectId } }),
  get: (id: number) => request.get<MenuInfo>(`/admin/menus/${id}`),
  create: (data: { name: string; menu_type?: string; path?: string; icon?: string; permission?: string; parent_id?: number | null; project_id: number; sort_order?: number; is_visible?: boolean }) =>
    request.post<MenuInfo>('/admin/menus', data),
  update: (id: number, data: Partial<{ name: string; menu_type: string; path: string; icon: string; permission: string; parent_id: number | null; sort_order: number; is_visible: boolean }>) =>
    request.put<MenuInfo>(`/admin/menus/${id}`, data),
  delete: (id: number) => request.delete(`/admin/menus/${id}`),
};

// ────── 令牌管理 ──────

export const tokenApi = {
  list: (projectId?: number) =>
    request.get<TokenInfo[]>('/admin/tokens', { params: projectId ? { project_id: projectId } : {} }),
  create: (data: { name: string; project_id: number; expires_at?: string }) =>
    request.post<TokenCreateResponse>('/admin/tokens', data),
  update: (id: number, data: Partial<{ name: string; is_active: boolean; expires_at: string }>) =>
    request.put<TokenInfo>(`/admin/tokens/${id}`, data),
  delete: (id: number) => request.delete(`/admin/tokens/${id}`),
};

// ────── 操作日志 ──────

export const logApi = {
  list: (params: { page?: number; page_size?: number; module?: string }) =>
    request.get<{ items: any[]; total: number; page: number; page_size: number }>('/admin/logs', { params }),
};
