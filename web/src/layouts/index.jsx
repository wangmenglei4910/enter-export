import React, { useState } from 'react';
import { Layout, Menu, Button, Tag, Space, Tooltip, Modal, Form, Input, message, Alert } from 'antd';
import { Link, useLocation, history } from 'umi';
import {
  HomeOutlined,
  InboxOutlined,
  ExportOutlined,
  FileTextOutlined,
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  AlertOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
  CloudSyncOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import {
  clearSession,
  resetInventoryStore,
  saveConfigOverride,
  isSyncReady,
  getInventoryStore,
} from '@/services/inventoryStore';
import styles from './index.less';

const { Header, Content, Sider } = Layout;

const statusMeta = {
  online: { color: 'success', text: '云端已同步' },
  local: { color: 'warning', text: '仅本地（点此配置）' },
  error: { color: 'error', text: '同步异常（点此重配）' },
  idle: { color: 'processing', text: '同步中…' },
};

const BasicLayout = ({ children }) => {
  const location = useLocation();
  const { status, lastError, pullRemote, config } = useInventory();
  const [cloudOpen, setCloudOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  const handleLogout = () => {
    clearSession();
    resetInventoryStore();
    history.push('/user/login');
  };

  const openCloudConfig = () => {
    form.setFieldsValue({
      gistId: config?.gistId && !String(config.gistId).includes('YOUR_') ? config.gistId : '722cc08e3721147e0dd4b255ca77801d',
      githubToken: '',
    });
    setCloudOpen(true);
  };

  const handleStatusClick = () => {
    if (status === 'online') {
      pullRemote();
      return;
    }
    openCloudConfig();
  };

  const onSaveCloud = async (values) => {
    saveConfigOverride({
      gistId: String(values.gistId || '').trim(),
      githubToken: String(values.githubToken || '').trim(),
    });
    resetInventoryStore();
    setBusy(true);
    try {
      const store = getInventoryStore();
      const result = await store.init();
      if (!isSyncReady() || result.mode === 'error') {
        message.error(result.message || '云端连接失败，请检查 Token');
        return;
      }
      message.success('已连接云端，多端将实时同步');
      setCloudOpen(false);
      // 触发页面刷新快照
      window.dispatchEvent(new Event('inventory-store-reset'));
    } catch (err) {
      message.error(err.message || '云端连接失败');
    } finally {
      setBusy(false);
    }
  };

  const meta = statusMeta[status] || statusMeta.idle;

  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: <Link to="/home">首页</Link>,
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: '库存管理',
      children: [
        {
          key: '/inventory/product',
          icon: <InboxOutlined />,
          label: <Link to="/inventory/product">商品管理</Link>,
        },
        {
          key: '/inventory/inbound',
          icon: <InboxOutlined />,
          label: <Link to="/inventory/inbound">入库</Link>,
        },
        {
          key: '/inventory/outbound',
          icon: <ExportOutlined />,
          label: <Link to="/inventory/outbound">出库</Link>,
        },
        {
          key: '/inventory/inbound-order',
          icon: <FileTextOutlined />,
          label: <Link to="/inventory/inbound-order">入库单</Link>,
        },
        {
          key: '/inventory/outbound-order',
          icon: <FileTextOutlined />,
          label: <Link to="/inventory/outbound-order">出库单</Link>,
        },
        {
          key: '/inventory/check',
          icon: <CheckSquareOutlined />,
          label: <Link to="/inventory/check">库存盘点</Link>,
        },
        {
          key: '/inventory/alert',
          icon: <AlertOutlined />,
          label: <Link to="/inventory/alert">库存预警</Link>,
        },
      ],
    },
    {
      key: 'partner',
      icon: <TeamOutlined />,
      label: '合作伙伴',
      children: [
        {
          key: '/partner/customer',
          icon: <TeamOutlined />,
          label: <Link to="/partner/customer">客户管理</Link>,
        },
        {
          key: '/partner/supplier',
          icon: <ShopOutlined />,
          label: <Link to="/partner/supplier">供应商管理</Link>,
        },
      ],
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">统计报表</Link>,
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>仓库管理系统</div>
        <Space>
          <Tooltip title={lastError || (status === 'online' ? '点击立即同步' : '点击配置云端同步')}>
            <Tag
              icon={status === 'online' ? <CloudSyncOutlined /> : <CloudOutlined />}
              color={meta.color}
              style={{ cursor: 'pointer' }}
              onClick={handleStatusClick}
            >
              {meta.text}
            </Tag>
          </Tooltip>
          <Button
            type="link"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className={styles.logout}
          >
            退出登录
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} className={styles.sider}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['inventory', 'partner']}
            className={styles.menu}
            items={menuItems}
          />
        </Sider>
        <Layout className={styles.content}>
          <Content className={styles.main}>{children}</Content>
        </Layout>
      </Layout>

      <Modal
        title="配置云端同步"
        visible={cloudOpen}
        onCancel={() => setCloudOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="与打卡小程序相同：用 GitHub Gist 存 JSON，多端实时同步"
          description={
            <span>
              请到{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
                GitHub Token
              </a>{' '}
              新建 Personal Access Token，<b>只勾选 gist</b>，然后粘贴到下方。
            </span>
          }
        />
        <Form form={form} layout="vertical" onFinish={onSaveCloud}>
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
        </Form>
      </Modal>
    </Layout>
  );
};

export default BasicLayout;
