import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  TreeSelect,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import IconPicker from '../../components/IconPicker';
import { menuApi, projectApi, MenuInfo, ProjectInfo } from '../../services/adminApi';

type MenuTreeNode = MenuInfo & { children?: MenuTreeNode[]; level: number };

const menuTypeTag: Record<string, { color: string; label: string; order: number }> = {
  directory: { color: 'blue', label: '目录', order: 1 },
  menu: { color: 'green', label: '菜单', order: 2 },
  button: { color: 'orange', label: '按钮', order: 3 },
};

const getTypeOrder = (type: string) => menuTypeTag[type]?.order ?? 99;

const renderIcon = (iconName: string) => {
  if (!iconName) return '-';
  const IconComp = (Icons as unknown as Record<string, React.ComponentType>)[iconName];
  return IconComp ? <IconComp /> : iconName;
};

function sortMenus(list: MenuInfo[]) {
  return [...list].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    if (getTypeOrder(a.menu_type) !== getTypeOrder(b.menu_type)) return getTypeOrder(a.menu_type) - getTypeOrder(b.menu_type);
    return a.id - b.id;
  });
}

function buildMenuTree(list: MenuInfo[]): MenuTreeNode[] {
  const sorted = sortMenus(list);
  const map = new Map<number, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];
  sorted.forEach((m) => map.set(m.id, { ...m, children: [], level: 1 }));
  sorted.forEach((m) => {
    const node = map.get(m.id)!;
    if (m.parent_id && map.has(m.parent_id)) {
      const parent = map.get(m.parent_id)!;
      node.level = parent.level + 1;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  const trim = (nodes: MenuTreeNode[]): MenuTreeNode[] =>
    nodes.map((n) => ({ ...n, children: n.children && n.children.length ? trim(n.children) : undefined }));
  return trim(roots);
}

function collectIds(nodes: MenuTreeNode[]): number[] {
  const ids: number[] = [];
  const walk = (items: MenuTreeNode[]) => items.forEach((item) => { ids.push(item.id); if (item.children?.length) walk(item.children); });
  walk(nodes);
  return ids;
}

export default function MenuList() {
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuInfo | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [filterProjectId, setFilterProjectId] = useState<number | undefined>(undefined);
  const [form] = Form.useForm();

  const fetchMenus = async (projectId?: number) => {
    setLoading(true);
    try {
      setMenus(await menuApi.list(projectId));
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const data = await projectApi.list();
    setProjects(data);
    if (data.length > 0 && !filterProjectId) {
      setFilterProjectId(data[0].id);
      fetchMenus(data[0].id);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const treeMenus = useMemo(() => buildMenuTree(menus), [menus]);
  const allRowKeys = useMemo(() => collectIds(treeMenus), [treeMenus]);

  const createTreeSelectData = (excludeIds: Set<number>) => {
    const filtered = menus.filter((m) => m.menu_type !== 'button' && !excludeIds.has(m.id));
    const sorted = sortMenus(filtered);
    const map = new Map<number, { value: number; title: string; children: any[] }>();
    const roots: any[] = [];
    sorted.forEach((m) => map.set(m.id, { value: m.id, title: m.name, children: [] }));
    sorted.forEach((m) => {
      const node = map.get(m.id)!;
      if (m.parent_id && map.has(m.parent_id)) { map.get(m.parent_id)!.children.push(node); } else { roots.push(node); }
    });
    return roots;
  };

  const getExcludedIds = () => {
    if (!editingMenu) return new Set<number>();
    const excluded = new Set<number>([editingMenu.id]);
    const childMap = new Map<number, number[]>();
    menus.forEach((m) => { if (m.parent_id) { const children = childMap.get(m.parent_id) || []; children.push(m.id); childMap.set(m.parent_id, children); } });
    const stack = [editingMenu.id];
    while (stack.length) { const current = stack.pop()!; const children = childMap.get(current) || []; children.forEach((id) => { if (!excluded.has(id)) { excluded.add(id); stack.push(id); } }); }
    return excluded;
  };

  const handleAdd = () => {
    if (!filterProjectId) { message.warning('请先选择项目'); return; }
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ menu_type: 'menu', sort_order: 0, is_visible: true, parent_id: null, path: '', icon: '', permission: '', project_id: filterProjectId });
    setFormVisible(true);
  };

  const handleEdit = (record: MenuInfo) => {
    setEditingMenu(record);
    form.setFieldsValue({
      name: record.name, menu_type: record.menu_type, path: record.path, icon: record.icon,
      permission: record.permission, parent_id: record.parent_id, sort_order: record.sort_order, is_visible: record.is_visible, project_id: record.project_id,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.menu_type === 'button') { values.path = ''; values.icon = ''; }
    try {
      if (editingMenu) {
        await menuApi.update(editingMenu.id, values);
        message.success('修改成功');
      } else {
        await menuApi.create(values);
        message.success('新增成功');
      }
      setFormVisible(false);
      fetchMenus(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await menuApi.delete(id);
      message.success('删除成功');
      fetchMenus(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleFilterProject = (projectId: number | undefined) => {
    setFilterProjectId(projectId);
    fetchMenus(projectId);
  };

  const columns = [
    {
      title: '菜单结构', dataIndex: 'name', key: 'name',
      render: (_: string, record: MenuTreeNode) => {
        const cfg = menuTypeTag[record.menu_type] || menuTypeTag.menu;
        return (<Space><Tag color={cfg.color}>{cfg.label}</Tag><span>{record.name}</span></Space>);
      },
    },
    { title: '路径', dataIndex: 'path', key: 'path', render: (v: string) => v || '-' },
    { title: '权限标识', dataIndex: 'permission', key: 'permission', render: (v: string) => (v ? <Tag color="purple">{v}</Tag> : '-') },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 80, render: (v: string) => renderIcon(v) },
    { title: '可见', dataIndex: 'is_visible', key: 'is_visible', width: 80, render: (v: boolean) => (v ? <Tag color="green">显示</Tag> : <Tag>隐藏</Tag>) },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 70 },
    {
      title: '操作', key: 'action', width: 170, fixed: 'right' as const,
      render: (_: unknown, record: MenuInfo) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const treeSelectData = useMemo(() => createTreeSelectData(getExcludedIds()), [menus, editingMenu]);

  return (
    <Card
      title="菜单管理"
      extra={
        <Space>
          <Select
            placeholder="选择项目"
            style={{ width: 180 }}
            value={filterProjectId}
            onChange={handleFilterProject}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
          />
          <Button onClick={() => setExpandedRowKeys(allRowKeys)}>展开全部</Button>
          <Button onClick={() => setExpandedRowKeys([])}>收起全部</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
        </Space>
      }
    >
      <Table<MenuTreeNode>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={treeMenus}
        pagination={false}
        expandable={{ defaultExpandAllRows: true, expandedRowKeys, onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]) }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="project_id" hidden><Input /></Form.Item>
          <Form.Item name="menu_type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={[{ value: 'directory', label: '目录' }, { value: 'menu', label: '菜单' }, { value: 'button', label: '按钮' }]} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="菜单/按钮名称" />
          </Form.Item>
          <Form.Item name="permission" label="权限标识">
            <Input placeholder="如 user:add（按钮通常需要）" />
          </Form.Item>
          <Form.Item name="path" label="路由路径">
            <Input placeholder="如 /admin/users（按钮可留空）" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <IconPicker />
          </Form.Item>
          <Form.Item name="parent_id" label="父级菜单">
            <TreeSelect allowClear treeData={treeSelectData} placeholder="留空表示顶级菜单" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_visible" label="是否可见" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
