import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Space, Avatar } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { projectApi, userApi, roleApi, menuApi, tokenApi, ProjectInfo, UserInfo, RoleInfo, MenuInfo, TokenInfo } from '../services/adminApi';

const { Title, Text } = Typography;

export default function Home() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  useEffect(() => {
    Promise.all([projectApi.list(), userApi.list(), roleApi.list(), menuApi.list(), tokenApi.list()])
      .then(([p, u, r, m, t]) => {
        setProjects(p);
        setUsers(u);
        setRoles(r);
        setMenus(m);
        setTokens(t);
      })
      .catch(() => {});
  }, []);

  const activeUsers = users.filter((u) => u.is_active).length;
  const superUsers = users.filter((u) => u.is_superuser).length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const activeTokens = tokens.filter((t) => t.is_active).length;

  const recentUsers = [...users]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5);

  const recentColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (v: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#fa8c16' }} />
          {v}
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string | null) => v || '-' },
    {
      title: '角色', dataIndex: 'roles', key: 'roles',
      render: (roleItems: { name: string }[]) =>
        roleItems.length ? roleItems.map((r) => <Tag color="blue" key={r.name}>{r.name}</Tag>) : <Tag>无</Tag>,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
  ];

  const now = new Date();
  const hour = now.getHours();
  let greeting = '晚上好';
  if (hour < 6) greeting = '凌晨好';
  else if (hour < 12) greeting = '早上好';
  else if (hour < 14) greeting = '中午好';
  else if (hour < 18) greeting = '下午好';

  const statCards = [
    {
      title: '项目总数', value: projects.length, icon: <ProjectOutlined />,
      color: '#fa8c16', bg: '#fff7e6',
      sub: <><CheckCircleOutlined style={{ color: '#52c41a' }} /> 启用 {activeProjects}<span style={{ margin: '0 6px' }} /><ClockCircleOutlined style={{ color: '#8c8c8c' }} /> 停用 {projects.length - activeProjects}</>,
    },
    {
      title: '用户总数', value: users.length, icon: <UserOutlined />,
      color: '#52c41a', bg: '#f6ffed',
      sub: <><CheckCircleOutlined style={{ color: '#52c41a' }} /> 活跃 {activeUsers}<span style={{ margin: '0 6px' }} /><TeamOutlined style={{ color: '#faad14' }} /> 超管 {superUsers}</>,
    },
    {
      title: '角色总数', value: roles.length, icon: <TeamOutlined />,
      color: '#722ed1', bg: '#f9f0ff',
      sub: <><CheckCircleOutlined style={{ color: '#52c41a' }} /> 启用 {roles.filter(r => r.is_active).length}</>,
    },
    {
      title: '菜单总数', value: menus.length, icon: <AppstoreOutlined />,
      color: '#fa8c16', bg: '#fff7e6',
      sub: <><KeyOutlined /> 令牌 {tokens.length}（活跃 {activeTokens}）</>,
    },
  ];

  return (
    <div>
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fff7e6 0%, #fff2e8 40%, #fa8c16 80%, #ffc069 100%)',
          border: 'none',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,140,22,0.15) 0%, transparent 70%)',
            top: -100,
            right: -50,
          }}
        />
        <Row align="middle" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(250,140,22,0.35)',
                }}
              >
                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                {greeting}，{user?.username}
              </Title>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              欢迎使用 FastAPI Passport 认证中心，统一管理项目、用户、角色与权限。
            </Text>
          </Col>
          <Col>
            <div
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 20px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 20, marginBottom: 4 }} />
              <div style={{ fontSize: 13 }}>
                {now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <Col span={6} key={i}>
            <Card
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1c1c1c' }}>{s.value}</div>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: s.bg,
                    color: s.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {s.icon}
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.sub}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title={<span style={{ fontWeight: 600 }}>最近注册用户</span>}
            extra={<Text type="secondary">共 {users.length} 人</Text>}
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Table
              rowKey="id"
              dataSource={recentUsers}
              columns={recentColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={<span style={{ fontWeight: 600 }}>项目列表</span>}
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {projects.length === 0 ? (
              <Text type="secondary">暂无项目数据</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontWeight: 500 }}>{proj.name}</Text>
                      <Tag color={proj.status === 'active' ? 'green' : 'default'}>
                        {proj.status === 'active' ? '启用' : '停用'}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{proj.project_code}</Text>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
