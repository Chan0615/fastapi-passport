import { useState } from 'react';
import { Input, Popover, Empty } from 'antd';
import * as Icons from '@ant-design/icons';

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

const commonIconNames = [
  'HomeOutlined', 'AppstoreOutlined', 'SettingOutlined', 'UserOutlined',
  'TeamOutlined', 'SafetyOutlined', 'DatabaseOutlined', 'DashboardOutlined',
  'FileOutlined', 'FileTextOutlined', 'FolderOutlined', 'FolderOpenOutlined',
  'SearchOutlined', 'EditOutlined', 'DeleteOutlined', 'PlusOutlined',
  'CheckOutlined', 'CloseOutlined', 'ReloadOutlined', 'DownloadOutlined',
  'UploadOutlined', 'CloudOutlined', 'CloudServerOutlined', 'ApiOutlined',
  'ToolOutlined', 'BugOutlined', 'CodeOutlined', 'GitlabOutlined',
  'ContainerOutlined', 'HddOutlined', 'DesktopOutlined',
  'ServerOutlined', 'GlobalOutlined', 'ThunderboltOutlined',
  'BellOutlined', 'MailOutlined', 'MessageOutlined', 'NotificationOutlined',
  'CalendarOutlined', 'ClockCircleOutlined', 'HistoryOutlined', 'EyeOutlined',
  'StarOutlined', 'LockOutlined', 'UnlockOutlined', 'KeyOutlined',
  'SafetyCertificateOutlined', 'AlertOutlined', 'WarningOutlined',
  'InfoCircleOutlined', 'CheckCircleOutlined', 'CloseCircleOutlined',
  'SyncOutlined', 'LoginOutlined', 'LogoutOutlined',
  'ProjectOutlined', 'ClusterOutlined', 'BranchesOutlined',
  'DeploymentUnitOutlined', 'ShareAltOutlined',
];

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const iconNames = commonIconNames.filter(name =>
    name.toLowerCase().includes(keyword.toLowerCase())
  );

  const getIconComp = (name: string) => {
    return (Icons as unknown as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[name];
  };

  const CurrentIcon = value ? getIconComp(value) : null;

  const content = (
    <div style={{ width: 320 }}>
      <Input.Search
        placeholder="搜索图标名称"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {iconNames.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          iconNames.map((name) => {
            const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[name];
            return (
              <div
                key={name}
                title={name}
                onClick={() => {
                  onChange?.(name);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 40,
                  cursor: 'pointer',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0',
                  background: value === name ? '#fff7e6' : '#fff',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff7e6';
                  e.currentTarget.style.borderColor = '#fa8c16';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = value === name ? '#fff7e6' : '#fff';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                {IconComp && <IconComp style={{ fontSize: 18, color: value === name ? '#fa8c16' : '#595959' }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="点击选择图标"
        prefix={CurrentIcon ? <CurrentIcon style={{ color: '#fa8c16' }} /> : undefined}
        readOnly
        style={{ cursor: 'pointer' }}
      />
    </Popover>
  );
};

export default IconPicker;
