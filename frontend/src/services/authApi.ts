import request from '../utils/request';

export interface LoginRequest {
  username: string;
  password: string;
  project_code: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string | null;
  display_name: string;
  is_superuser: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
  project_code: string;
  menus: MenuItem[];
  permissions: string[];
}

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string;
  parent_id: number | null;
  sort_order: number;
  children: MenuItem[];
}

export const authApi = {
  login: (data: LoginRequest) =>
    request.post<LoginResponse>('/auth/login', data),

  me: () => request.get<UserInfo>('/auth/me'),

  menus: (projectCode: string) =>
    request.get<MenuItem[]>('/auth/menus', { params: { project_code: projectCode } }),

  logout: () => request.post('/auth/logout'),
};
