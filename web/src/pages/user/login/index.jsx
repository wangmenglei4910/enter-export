import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Alert, Typography } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CloudOutlined,
  CopyOutlined,
  BankOutlined,
  MobileOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { history } from 'umi';
import {
  isSyncReady,
  saveConfigOverride,
  resetInventoryStore,
  getInventoryStore,
  isValidPhone,
} from '@/services/inventoryStore';
import styles from './index.less';

const { TabPane } = Tabs;
const { Paragraph, Text, Link } = Typography;

const LoginPage = () => {
  const [syncForm] = Form.useForm();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState(isSyncReady() ? 'login' : 'cloud');
  const cloudReady = isSyncReady();

  const onSaveCloud = async (values) => {
    saveConfigOverride({
      gistId: String(values.gistId || '').trim(),
      githubToken: String(values.githubToken || '').trim(),
    });
    resetInventoryStore();
    const store = getInventoryStore();
    setBusy(true);
    try {
      const result = await store.init();
      if (result.mode === 'error') {
        message.error(result.message || '云端连接失败');
        return;
      }
      message.success('云端配置已保存，可以注册或登录');
      setActiveTab('register');
    } catch (err) {
      message.error(err.message || '云端连接失败');
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async (values) => {
    if (!isSyncReady()) {
      message.warning('请先配置云端同步（Gist + Token）');
      setActiveTab('cloud');
      return;
    }
    setBusy(true);
    try {
      resetInventoryStore();
      const store = getInventoryStore();
      await store.init();
      await store.login(values.phone, values.password);
      message.success('登录成功');
      history.replace('/home');
    } catch (err) {
      message.error(err.message || '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (values) => {
    if (!isSyncReady()) {
      message.warning('请先配置云端同步（Gist + Token）');
      setActiveTab('cloud');
      return;
    }
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setBusy(true);
    try {
      resetInventoryStore();
      const store = getInventoryStore();
      await store.init();
      await store.register({
        phone: values.phone,
        password: values.password,
        company: values.company,
        name: values.name,
      });
      message.success('注册成功，已自动登录');
      history.replace('/home');
    } catch (err) {
      message.error(err.message || '注册失败');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const link = getInventoryStore().getConfigLink();
    if (!link) {
      message.warning('请先保存有效云端配置');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      message.success('配置链接已复制，可在其他设备打开');
    } catch {
      message.info(link);
    }
  };

  return (
    <div className={styles.container}>
      <Card title="仓库管理系统" className={styles.loginCard}>
        {!cloudReady && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="需先配置 GitHub Gist 才能多端实时同步"
            description="注册账号会写入 accounts.json，并绑定公司名称。"
          />
        )}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <CloudOutlined /> 云端配置
              </span>
            }
            key="cloud"
          >
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              Token 仅勾选 <Text code>gist</Text>：
              <Link href="https://github.com/settings/tokens" target="_blank">
                创建 Token
              </Link>
            </Paragraph>
            <Form
              form={syncForm}
              layout="vertical"
              onFinish={onSaveCloud}
              initialValues={{
                gistId: '722cc08e3721147e0dd4b255ca77801d',
                githubToken: '',
              }}
            >
              <Form.Item
                name="gistId"
                label="Gist ID"
                rules={[{ required: true, message: '请输入 gistId' }]}
              >
                <Input placeholder="Gist ID" />
              </Form.Item>
              <Form.Item
                name="githubToken"
                label="GitHub Token"
                rules={[{ required: true, message: '请输入 Token' }]}
              >
                <Input.Password placeholder="ghp_... 或 github_pat_..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={busy}>
                保存并连接云端
              </Button>
              {cloudReady && (
                <Button
                  style={{ marginTop: 8 }}
                  icon={<CopyOutlined />}
                  block
                  onClick={copyLink}
                >
                  复制多端配置链接
                </Button>
              )}
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserAddOutlined /> 注册
              </span>
            }
            key="register"
          >
            <Form form={registerForm} name="register" onFinish={onRegister} layout="vertical">
              <Form.Item
                name="company"
                label="公司名称"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input prefix={<BankOutlined />} placeholder="公司名称" size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  {
                    validator: (_, value) =>
                      !value || isValidPhone(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('请输入11位手机号')),
                  },
                ]}
              >
                <Input prefix={<MobileOutlined />} placeholder="11位手机号" size="large" maxLength={11} />
              </Form.Item>
              <Form.Item name="name" label="姓名（可选）">
                <Input prefix={<UserOutlined />} placeholder="联系人姓名" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 4, message: '密码至少4位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="设置密码" size="large" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请再次输入密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={busy}>
                  注册并登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined /> 登录
              </span>
            }
            key="login"
          >
            <Form form={loginForm} name="login" onFinish={onLogin} layout="vertical">
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  {
                    validator: (_, value) =>
                      !value || isValidPhone(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('请输入11位手机号')),
                  },
                ]}
              >
                <Input prefix={<MobileOutlined />} placeholder="注册时的手机号" size="large" maxLength={11} />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={busy}>
                  登录
                </Button>
              </Form.Item>
              {cloudReady ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  使用注册手机号和密码登录；左上角将显示公司名称
                </Text>
              ) : null}
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
