import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Switch, Tree, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import { roleApi, menuApi, projectApi, RoleInfo, MenuInfo, ProjectInfo } from '../../services/adminApi';

export default function RoleList() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<number[]>([]);
  const [filterProjectId, setFilterProjectId] = useState<number | undefined>(undefined);
  const [form] = Form.useForm();

  const fetchRoles = async (projectId?: number) => {
    setLoading(true);
    try {
      setRoles(await roleApi.list(projectId));
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async (projectId?: number) => {
    setMenus(await menuApi.list(projectId));
  };

  const fetchProjects = async () => {
    setProjects(await projectApi.list());
  };

  useEffect(() => {
    fetchRoles();
    fetchProjects();
  }, []);

  const buildMenuTree = (menuList: MenuInfo[]) => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    menuList.forEach(m => map.set(m.id, { key: m.id, title: m.name, children: [] }));
    menuList.forEach(m => {
      if (m.parent_id && map.has(m.parent_id)) {
        map.get(m.parent_id).children.push(map.get(m.id));
      } else {
        roots.push(map.get(m.id));
      }
    });
    return roots;
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, project_id: filterProjectId });
    setFormVisible(true);
  };

  const handleEdit = (record: RoleInfo) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      project_id: record.project_id,
      is_active: record.is_active,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingRole) {
        await roleApi.update(editingRole.id, { name: values.name, description: values.description, is_active: values.is_active });
        message.success('修改成功');
      } else {
        await roleApi.create(values);
        message.success('新增成功');
      }
      setFormVisible(false);
      fetchRoles(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roleApi.delete(id);
      message.success('删除成功');
      fetchRoles(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleAssignMenus = async (record: RoleInfo) => {
    setEditingRole(record);
    setCheckedMenuKeys(record.menus.map(m => m.id));
    await fetchMenus(record.project_id);
    setMenuVisible(true);
  };

  const handleSaveMenus = async () => {
    if (!editingRole) return;
    try {
      await roleApi.assignMenus(editingRole.id, checkedMenuKeys);
      message.success('菜单分配成功');
      setMenuVisible(false);
      fetchRoles(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '分配失败');
    }
  };

  const handleFilterProject = (projectId: number | undefined) => {
    setFilterProjectId(projectId);
    fetchRoles(projectId);
  };

  const projectNameMap = new Map(projects.map(p => [p.id, p.name]));

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '所属项目', dataIndex: 'project_id', key: 'project_id', render: (v: number) => projectNameMap.get(v) || v },
    { title: '描述', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    {
      title: '菜单', dataIndex: 'menus', key: 'menus',
      render: (ms: MenuInfo[]) => ms.length ? <Tag color="cyan">{ms.length} 个菜单</Tag> : <Tag>未分配</Tag>,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 240,
      render: (_: unknown, record: RoleInfo) => (
        <Space>
          <Button size="small" icon={<AppstoreOutlined />} onClick={() => handleAssignMenus(record)}>分配菜单</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该角色?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="角色管理"
      extra={
        <Space>
          <Select
            placeholder="按项目筛选"
            allowClear
            style={{ width: 180 }}
            value={filterProjectId}
            onChange={handleFilterProject}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增角色</Button>
        </Space>
      }
    >
      <Table rowKey="id" loading={loading} dataSource={roles} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              placeholder="选择项目"
              disabled={!!editingRole}
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分配菜单 - ${editingRole?.name}`}
        open={menuVisible}
        onOk={handleSaveMenus}
        onCancel={() => setMenuVisible(false)}
      >
        {menus.length === 0 ? (
          <span style={{ color: '#999' }}>暂无菜单，请先为该项目创建菜单</span>
        ) : (
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedMenuKeys}
            onCheck={(keys) => setCheckedMenuKeys(keys as number[])}
            treeData={buildMenuTree(menus)}
          />
        )}
      </Modal>
    </Card>
  );
}
