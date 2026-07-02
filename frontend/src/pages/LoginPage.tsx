import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  CloudServerOutlined,
  AuditOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const DEFAULT_PROJECT_CODE = 'fastapi_passport';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login({ ...values, project_code: DEFAULT_PROJECT_CODE });
      message.success('登录成功');
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <SafetyCertificateOutlined />, title: 'LDAP 统一认证', desc: '企业账号一键登录，无需重复注册' },
    { icon: <KeyOutlined />, title: 'JWT 令牌签发', desc: '业务系统本地验证，无需回调认证' },
    { icon: <CloudServerOutlined />, title: '多项目隔离', desc: '角色、菜单、令牌按项目独立管理' },
    { icon: <AuditOutlined />, title: '操作审计', desc: '全链路日志记录，安全可追溯' },
  ];

  const stats = [
    { value: '99.9%', label: '服务可用性' },
    { value: '<50ms', label: '验证响应' },
    { value: 'SSO', label: '单点登录' },
  ];

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        background: 'linear-gradient(90deg, #fff7e6 0%, #fffaf5 50%, #fff 100%)',
      }}
    >
      {/* ── 左侧 2/3：系统介绍 ── */}
      <div
        style={{
          flex: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 56px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #fff7e6 0%, #ffefe0 40%, #ffe7cc 100%)',
        }}
      >
        {/* 背景装饰 */}
        <div
          style={{
            position: 'absolute',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,140,22,0.15) 0%, transparent 65%)',
            top: -160,
            right: -100,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,192,105,0.18) 0%, transparent 65%)',
            bottom: -140,
            left: -80,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(250,140,22,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(250,140,22,0.035) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
          }}
        />

        {/* 居中内容 */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, textAlign: 'center' }}>
          {/* 顶部 LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 40 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(250,140,22,0.35)',
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#1c1c1c', fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>认证中心</div>
              <div style={{ color: '#fa8c16', fontSize: 11, marginTop: 3, letterSpacing: 2, fontWeight: 500 }}>
                AUTHENTICATION SERVICE
              </div>
            </div>
          </div>

          {/* 标语标签 */}
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '5px 16px',
                borderRadius: 20,
                background: 'rgba(250,140,22,0.12)',
                border: '1px solid rgba(250,140,22,0.25)',
                color: '#d46b08',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              企业级统一身份认证平台
            </span>
          </div>

          {/* 主标题 */}
          <div style={{ color: '#1c1c1c', fontSize: 34, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>
            统一认证 · 集中授权<br />多项目权限隔离
          </div>

          {/* 描述 */}
          <div style={{ color: '#8c5a1a', fontSize: 14, lineHeight: 1.8, marginBottom: 36 }}>
            为业务系统提供 LDAP 登录、JWT 签发、按钮级权限管控与操作审计，<br />
            一套账号体系打通所有内部系统。
          </div>

          {/* 功能列表 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 36 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '16px 18px',
                  borderRadius: 14,
                  background: '#fff',
                  border: '1px solid #ffe7ba',
                  boxShadow: '0 2px 8px rgba(250,140,22,0.06)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #fff2e8 0%, #ffe7ba 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#fa8c16', fontSize: 18 }}>{f.icon}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#1c1c1c', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ color: '#a8682a', fontSize: 11, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 统计数据 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 56 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fa8c16', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#a8682a', fontSize: 12, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部版权 */}
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center', color: '#d4a574', fontSize: 11 }}>
          © {new Date().getFullYear()} FastAPI Passport · All Rights Reserved
        </div>
      </div>

      {/* ── 右侧 1/3：登录表单 ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 44px',
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #fff7e6 0%, #fffaf5 50%, #fff 100%)',
          position: 'relative',
        }}
      >
        {/* 顶部装饰条 */}
        <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #fa8c16, #ffc069, #fff0e0)',
        }}
        />

        <div style={{ width: '100%', maxWidth: 300 }}>
          {/* 标题 */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <div style={{ color: '#1c1c1c', fontSize: 26, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              欢迎登录
              <ArrowRightOutlined style={{ fontSize: 16, color: '#fa8c16' }} />
            </div>
            <div style={{ color: '#b7791f', fontSize: 12 }}>
              请使用企业 LDAP 账号登录认证中心
            </div>
          </div>

          <Form size="large" onFinish={handleLogin} autoComplete="off">
            <div style={{ marginBottom: 6, color: '#8c5a1a', fontSize: 12, fontWeight: 500 }}>用户名</div>
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#ffa940' }} />}
                placeholder="请输入用户名"
                style={{
                  borderRadius: 10,
                  height: 46,
                  borderColor: '#ffe7ba',
                  background: '#fffbe6',
                  fontSize: 14,
                }}
              />
            </Form.Item>

            <div style={{ marginBottom: 6, color: '#8c5a1a', fontSize: 12, fontWeight: 500 }}>密码</div>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#ffa940' }} />}
                placeholder="请输入密码"
                style={{
                  borderRadius: 10,
                  height: 46,
                  borderColor: '#ffe7ba',
                  background: '#fffbe6',
                  fontSize: 14,
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 20 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                  border: 'none',
                  boxShadow: '0 6px 16px rgba(250,140,22,0.3)',
                }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          {/* 提示 */}
          <div
            style={{
              marginTop: 28,
              padding: '12px 14px',
              background: '#fff7e6',
              borderRadius: 10,
              border: '1px solid #ffd591',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fa8c16',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              i
            </div>
            <div style={{ color: '#ad6800', fontSize: 11, lineHeight: 1.6 }}>
              首个登录的用户自动成为超级管理员
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
