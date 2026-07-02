import { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, Space, Typography } from 'antd';
import { logApi } from '../../services/adminApi';

const { Text } = Typography;

const moduleOptions = [
  '认证管理', '项目管理', '用户管理', '角色管理', '菜单管理', '令牌管理',
];

export default function OperationLogList() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [module, setModule] = useState<string>('');

  const fetchLogs = async (p: number, ps: number, mod: string) => {
    setLoading(true);
    try {
      const res = await logApi.list({ page: p, page_size: ps, module: mod });
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, pageSize, module);
  }, [page, pageSize, module]);

  const columns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    { title: '用户', dataIndex: 'username', key: 'username', width: 100, render: (v: string) => v || '-' },
    { title: '模块', dataIndex: 'module', key: 'module', width: 100, render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: '操作', dataIndex: 'action', key: 'action', width: 90, render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
    { title: '方法', dataIndex: 'method', key: 'method', width: 70 },
    { title: '路径', dataIndex: 'path', key: 'path' },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130 },
    {
      title: '状态', dataIndex: 'status_code', key: 'status_code', width: 70,
      render: (v: number) => <Tag color={v < 400 ? 'green' : 'red'}>{v}</Tag>,
    },
    { title: '耗时', dataIndex: 'cost_ms', key: 'cost_ms', width: 70, render: (v: number) => `${v}ms` },
    {
      title: '错误', dataIndex: 'error_msg', key: 'error_msg',
      render: (v: string) => v ? <Text type="danger" style={{ fontSize: 12 }}>{v.slice(0, 80)}</Text> : '-',
    },
  ];

  return (
    <Card
      title="操作日志"
      extra={
        <Select
          placeholder="按模块筛选"
          allowClear
          style={{ width: 180 }}
          value={module || undefined}
          onChange={(v) => { setModule(v || ''); setPage(1); }}
          options={moduleOptions.map(m => ({ value: m, label: m }))}
        />
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        size="small"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </Card>
  );
}
