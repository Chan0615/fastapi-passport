import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  permission: string;
  children: ReactNode;
}

/**
 * 按钮级权限控制组件。
 * 超级管理员或拥有指定权限的用户才渲染子元素。
 */
export default function Auth({ permission, children }: AuthProps) {
  const { user, permissions } = useAuth();

  if (!user) return null;
  if (user.is_superuser) return <>{children}</>;
  if (permissions?.includes(permission) || permissions?.includes('*')) {
    return <>{children}</>;
  }
  return null;
}
