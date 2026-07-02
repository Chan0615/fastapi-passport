import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, Switch, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons';
import { tokenApi, projectApi, TokenInfo, TokenCreateResponse, ProjectInfo } from '../../services/adminApi';

const { Text } = Typography;

export default function TokenList() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [createdToken, setCreatedToken] = useState<TokenCreateResponse | null>(null);
  const [editingToken, setEditingToken] = useState<TokenInfo | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<number | undefined>(undefined);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchTokens = async (projectId?: number) => {
    setLoading(true);
    try {
      setTokens(await tokenApi.list(projectId));
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setProjects(await projectApi.list());
  };

  useEffect(() => {
    fetchTokens();
    fetchProjects();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      const data: any = { name: values.name, project_id: values.project_id };
      if (values.expires_at) {
        data.expires_at = values.expires_at.toISOString();
      }
      const res = await tokenApi.create(data);
      setCreatedToken(res);
      setFormVisible(false);
      fetchTokens(filterProjectId);
      message.success('令牌创建成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleEdit = (record: TokenInfo) => {
    setEditingToken(record);
    editForm.setFieldsValue({ name: record.name, is_active: record.is_active });
    setEditVisible(true);
  };

  const handleEditSubmit = async () => {
    const values = await editForm.validateFields();
    if (!editingToken) return;
    try {
      await tokenApi.update(editingToken.id, values);
      message.success('修改成功');
      setEditVisible(false);
      fetchTokens(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tokenApi.delete(id);
      message.success('删除成功');
      fetchTokens(filterProjectId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('已复制到剪贴板'));
  };

  const projectNameMap = new Map(projects.map(p => [p.id, p.name]));

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '所属项目', dataIndex: 'project_id', key: 'project_id', render: (v: number) => projectNameMap.get(v) || v },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '过期时间', dataIndex: 'expires_at', key: 'expires_at',
      render: (v: string | null) => v ? new Date(v).toLocaleString() : '永不过期',
    },
    {
      title: '最后使用', dataIndex: 'last_used_at', key: 'last_used_at',
      render: (v: string | null) => v ? new Date(v).toLocaleString() : '从未使用',
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: unknown, record: TokenInfo) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该令牌?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="令牌管理"
        extra={
          <Space>
            <Select
              placeholder="按项目筛选"
              allowClear
              style={{ width: 180 }}
              value={filterProjectId}
              onChange={(v) => { setFilterProjectId(v); fetchTokens(v); }}
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增令牌</Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={loading} dataSource={tokens} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="新增令牌"
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="令牌名称" rules={[{ required: true, message: '请输入令牌名称' }]}>
            <Input placeholder="如：CI/CD 部署令牌" />
          </Form.Item>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="选择项目" options={projects.map(p => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item name="expires_at" label="过期时间（留空表示永不过期）">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑令牌"
        open={editVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditVisible(false)}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="令牌名称" rules={[{ required: true, message: '请输入令牌名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="令牌创建成功"
        open={!!createdToken}
        onCancel={() => setCreatedToken(null)}
        footer={<Button type="primary" onClick={() => setCreatedToken(null)}>我已保存</Button>}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="warning">⚠️ 请立即复制保存此令牌，关闭后将无法再次查看！</Text>
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            style={{ width: 'calc(100% - 80px)' }}
            value={createdToken?.token}
            readOnly
          />
          <Button
            style={{ width: 80 }}
            icon={<CopyOutlined />}
            onClick={() => createdToken && handleCopy(createdToken.token)}
          >
            复制
          </Button>
        </Space.Compact>
      </Modal>
    </>
  );
}
