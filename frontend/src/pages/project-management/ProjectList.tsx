import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { projectApi, ProjectInfo } from '../../services/adminApi';

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectInfo | null>(null);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const fetchProjects = async (kw?: string) => {
    setLoading(true);
    try {
      setProjects(await projectApi.list(kw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setFormVisible(true);
  };

  const handleEdit = (record: ProjectInfo) => {
    setEditingProject(record);
    form.setFieldsValue({
      name: record.name,
      project_code: record.project_code,
      description: record.description,
      status: record.status,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingProject) {
        await projectApi.update(editingProject.id, values);
        message.success('修改成功');
      } else {
        await projectApi.create(values);
        message.success('新增成功');
      }
      setFormVisible(false);
      fetchProjects(keyword);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await projectApi.delete(id);
      message.success('删除成功');
      fetchProjects(keyword);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '项目标识', dataIndex: 'project_code', key: 'project_code', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: unknown, record: ProjectInfo) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="删除项目将同时删除其下所有角色、菜单和令牌，确定?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="项目管理"
      extra={
        <Space>
          <Input.Search
            placeholder="搜索名称/标识"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => fetchProjects(v)}
            allowClear
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增项目</Button>
        </Space>
      }
    >
      <Table rowKey="id" loading={loading} dataSource={projects} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="如：运维管理系统" />
          </Form.Item>
          <Form.Item name="project_code" label="项目标识" rules={[{ required: true, message: '请输入项目标识' }]}>
            <Input placeholder="如：ops_system（业务系统唯一编码）" disabled={!!editingProject} />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={2} placeholder="简要描述项目用途" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={[{ value: 'active', label: '启用' }, { value: 'disabled', label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
