import React from 'react';
import { Layout, Menu, Button, Tag, Space, Tooltip } from 'antd';
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
import { clearSession, resetInventoryStore } from '@/services/inventoryStore';
import styles from './index.less';

const { Header, Content, Sider } = Layout;

const statusMeta = {
  online: { color: 'success', text: '云端已同步' },
  local: { color: 'default', text: '仅本地' },
  error: { color: 'error', text: '同步异常' },
  idle: { color: 'processing', text: '同步中…' },
};

const BasicLayout = ({ children }) => {
  const location = useLocation();
  const { status, lastError, pullRemote } = useInventory();

  const handleLogout = () => {
    clearSession();
    resetInventoryStore();
    history.push('/user/login');
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
          <Tooltip title={lastError || '点击立即同步'}>
            <Tag
              icon={status === 'online' ? <CloudSyncOutlined /> : <CloudOutlined />}
              color={meta.color}
              style={{ cursor: 'pointer' }}
              onClick={() => pullRemote()}
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
    </Layout>
  );
};

export default BasicLayout;
