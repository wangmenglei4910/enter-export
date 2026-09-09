import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, CloudOutlined, CopyOutlined } from '@ant-design/icons';
import { history } from 'umi';
import {
  isSyncReady,
  saveConfigOverride,
  saveSession,
  resetInventoryStore,
  getInventoryStore,
} from '@/services/inventoryStore';
import styles from './index.less';

const { TabPane } = Tabs;
const { Paragraph, Text, Link } = Typography;

const LoginPage = () => {
  const [syncForm] = Form.useForm();
  const [busy, setBusy] = useState(false);
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
      message.success('云端配置已保存，可以登录');
    } catch (err) {
      message.error(err.message || '云端连接失败');
    } finally {
      setBusy(false);
    }
  };

  const onFinish = async (values) => {
    if (!isSyncReady()) {
      message.warning('请先配置云端同步（Gist + Token）');
      return;
    }
    if (values.username === 'wangmenglei' && values.password === '111111') {
      saveSession(values.username);
      resetInventoryStore();
      const store = getInventoryStore();
      setBusy(true);
      try {
        await store.init();
        message.success('登录成功，已开启多端同步');
        history.replace('/home');
      } catch (err) {
        message.error(err.message || '同步失败');
      } finally {
        setBusy(false);
      }
    } else {
      message.error('用户名或密码错误');
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
            description="与打卡小程序相同：Pages 打开网页，Gist 存 JSON 数据。"
          />
        )}
        <Tabs defaultActiveKey={cloudReady ? 'login' : 'cloud'}>
          <TabPane
            tab={
              <span>
                <CloudOutlined /> 云端配置
              </span>
            }
            key="cloud"
          >
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              1. 新建 Gist，文件名 <Text code>inventory.json</Text>，内容先写{' '}
              <Text code>{'{}'}</Text>
              <br />
              2. 复制 Gist ID（网址最后一段）
              <br />
              3. 创建 Token，仅勾选 <Text code>gist</Text>
              <br />
              参考：
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
                <Input placeholder="例如 28cec0bd06549afc96073735cb97243d" />
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
                <UserOutlined /> 登录
              </span>
            }
            key="login"
          >
            <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
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
                  云端已就绪，手机/电脑打开同一 Pages 地址即可同步
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
