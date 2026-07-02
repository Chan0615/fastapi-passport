import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Typography,
  theme,
  Space,
  Modal,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { MenuItem } from '../services/authApi';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const renderIcon = (iconName: string) => {
  if (!iconName) return null;
  const IconComp = (Icons as unknown as Record<string, React.ComponentType>)[iconName];
  return IconComp ? <IconComp /> : null;
};

const buildMenuItems = (menus: MenuItem[]): any[] => {
  return menus.map((m) => {
    if (m.children && m.children.length > 0) {
      return {
        key: m.path || `dir-${m.id}`,
        icon: renderIcon(m.icon),
        label: m.name,
        children: buildMenuItems(m.children),
      };
    }
    return {
      key: m.path,
      icon: renderIcon(m.icon),
      label: m.name,
    };
  });
};

export default function BasicLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, menus, logout } = useAuth();
  const navigate = useNavigate();
  const { token: themeToken } = theme.useToken();

  const menuItems = buildMenuItems(menus);

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await logout();
        navigate('/login');
      },
    });
  };

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar icon={<UserOutlined />} size={44} style={{ backgroundColor: '#fa8c16' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.username}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.is_superuser ? '超级管理员' : '普通用户'}
            </Text>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span style={{ display: 'block', textAlign: 'center' }}>退出登录</span>,
      danger: true,
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: '#fff',
          borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Text
            strong
            style={{
              fontSize: collapsed ? 14 : 18,
              color: '#fa8c16',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? 'FP' : 'FastAPI Passport'}
          </Text>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key);
          }}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout style={{ overflow: 'hidden' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />

          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') handleLogout();
              },
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#fa8c16' }}
              />
              <Text>{user?.username}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#f5f5f5',
            borderRadius: 8,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
