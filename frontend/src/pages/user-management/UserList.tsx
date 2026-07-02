import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Switch, message, Popconfirm, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, TeamOutlined, SearchOutlined } from '@ant-design/icons';
import { userApi, roleApi, projectApi, UserInfo, RoleBrief, ProjectInfo } from '../../services/adminApi';

export default function UserList() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<RoleBrief[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [roleVisible, setRoleVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const fetchUsers = async (kw?: string) => {
    setLoading(true);
    try {
      setUsers(await userApi.list(kw));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRoles(await roleApi.list());
  };

  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    projectApi.list().then(setProjects).catch(() => {});
  }, []);

  const handleEdit = (record: UserInfo) => {
    setEditingUser(record);
    form.setFieldsValue({
      email: record.email,
      display_name: record.display_name,
      is_active: record.is_active,
      is_superuser: record.is_superuser,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!editingUser) return;
    try {
      await userApi.update(editingUser.id, values);
      message.success('修改成功');
      setFormVisible(false);
      fetchUsers(keyword);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      fetchUsers(keyword);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleAssignRoles = (record: UserInfo) => {
    setEditingUser(record);
    setSelectedRoleIds(record.roles.map(r => r.id));
    setRoleVisible(true);
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    try {
      await userApi.assignRoles(editingUser.id, selectedRoleIds);
      message.success('角色分配成功');
      setRoleVisible(false);
      fetchUsers(keyword);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '分配失败');
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string | null) => v || '-' },
    {
      title: '角色', dataIndex: 'roles', key: 'roles',
      render: (roleItems: RoleBrief[]) =>
        roleItems.length ? (
          <Space size={[0, 4]} wrap>
            {roleItems.map(r => (
              <Tag color="orange" key={r.id}>
                [{projectMap.get(r.project_id) || r.project_id}] {r.name}
              </Tag>
            ))}
          </Space>
        ) : <Tag>无</Tag>,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '超管', dataIndex: 'is_superuser', key: 'is_superuser', width: 80,
      render: (v: boolean) => (v ? <Tag color="gold">是</Tag> : '否'),
    },
    {
      title: '操作', key: 'action', width: 240,
      render: (_: unknown, record: UserInfo) => (
        <Space>
          <Button size="small" icon={<TeamOutlined />} onClick={() => handleAssignRoles(record)}>分配角色</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该用户?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Input.Search
          placeholder="搜索用户名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(v) => fetchUsers(v)}
          allowClear
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
      }
    >
      <Table rowKey="id" loading={loading} dataSource={users} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title="编辑用户"
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户名">
            <Input value={editingUser?.username} disabled />
          </Form.Item>
          <Form.Item name="display_name" label="显示名称">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="is_superuser" label="超级管理员" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分配角色 - ${editingUser?.username}`}
        open={roleVisible}
        onOk={handleSaveRoles}
        onCancel={() => setRoleVisible(false)}
        width={480}
      >
        {roles.length === 0 && <span style={{ color: '#999' }}>暂无角色，请先创建角色</span>}
        {/* 按项目分组展示角色 */}
        {Array.from(new Set(roles.map(r => r.project_id))).map((projId, idx, arr) => {
          const projectRoles = roles.filter(r => r.project_id === projId);
          const projectName = projectMap.get(projId) || `项目 #${projId}`;
          return (
            <div key={projId}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#fa8c16', marginBottom: 6 }}>
                {projectName}
              </div>
              {projectRoles.map(role => (
                <label
                  key={role.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 8px', marginBottom: 2, borderRadius: 6,
                    cursor: 'pointer',
                    background: selectedRoleIds.includes(role.id) ? '#fff7e6' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoleIds([...selectedRoleIds, role.id]);
                      } else {
                        setSelectedRoleIds(selectedRoleIds.filter(id => id !== role.id));
                      }
                    }}
                  />
                  <span>{role.name}</span>
                  {role.description && <span style={{ color: '#bfbfbf', fontSize: 11 }}>({role.description})</span>}
                </label>
              ))}
              {idx < arr.length - 1 && <Divider style={{ margin: '10px 0' }} />}
            </div>
          );
        })}
      </Modal>
    </Card>
  );
}
