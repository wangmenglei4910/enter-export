import React, { useMemo, useRef, useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Tag,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Spin,
  Divider,
  Select,
  Popconfirm,
} from 'antd';
import { Link, useLocation, history } from 'umi';
import {
  HomeOutlined,
  InboxOutlined,
  ExportOutlined,
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  AlertOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
  CloudSyncOutlined,
  CloudOutlined,
  DownloadOutlined,
  UploadOutlined,
  SaveOutlined,
  HistoryOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import {
  clearSession,
  resetInventoryStore,
  saveConfigOverride,
  isSyncReady,
  getInventoryStore,
  listLocalBackups,
} from '@/services/inventoryStore';
import { exportInventoryExcel } from '@/utils/exportExcel';
import styles from './index.less';

const { Header, Content, Sider } = Layout;

const statusMeta = {
  online: { color: 'success', text: '云端已同步' },
  local: { color: 'warning', text: '仅本地（点此配置）' },
  error: { color: 'error', text: '同步异常（点此重配）' },
  idle: { color: 'processing', text: '同步中…' },
};

function formatBackupTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

function dayFileStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}`;
}

const BasicLayout = ({ children }) => {
  const location = useLocation();
  const {
    status,
    lastError,
    pullRemote,
    config,
    writing,
    session,
    exportBackup,
    importBackup,
    restoreLocalBackup,
    restoreCloudLatest,
    createManualBackup,
    localBackups,
    data,
    stockMap,
  } = useInventory();
  const [cloudOpen, setCloudOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreId, setRestoreId] = useState(undefined);
  const [form] = Form.useForm();
  const fileRef = useRef(null);

  const backupOptions = useMemo(() => {
    const list = localBackups?.length ? localBackups : listLocalBackups();
    return list.map((item) => ({
      value: item.id,
      label: `${formatBackupTime(item.createdAt)} · ${item.recordCount} 条 · ${item.reason}`,
    }));
  }, [localBackups]);

  const handleLogout = () => {
    clearSession();
    resetInventoryStore();
    history.push('/user/login');
  };

  const openCloudConfig = () => {
    form.setFieldsValue({
      gistId:
        config?.gistId && !String(config.gistId).includes('YOUR_')
          ? config.gistId
          : '722cc08e3721147e0dd4b255ca77801d',
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
      window.dispatchEvent(new Event('inventory-store-reset'));
    } catch (err) {
      message.error(err.message || '云端连接失败');
    } finally {
      setBusy(false);
    }
  };

  const downloadBackup = () => {
    try {
      const blob = exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enter-export-backup-${dayFileStamp()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('已下载完整备份文件');
    } catch (err) {
      message.error(err.message || '导出失败');
    }
  };

  const downloadExcel = () => {
    try {
      const filename = exportInventoryExcel({
        data,
        stockMap,
        company: session?.company || '',
      });
      message.success(`已导出 Excel：${filename}`);
    } catch (err) {
      message.error(err.message || 'Excel 导出失败');
    }
  };

  const onPickImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBackupBusy(true);
    try {
      const text = await file.text();
      await importBackup(text, { merge: true });
      message.success('已合并导入备份到当前数据');
    } catch (err) {
      message.error(err.message || '导入失败');
    } finally {
      setBackupBusy(false);
    }
  };

  const onManualBackup = async () => {
    setBackupBusy(true);
    try {
      await createManualBackup();
      message.success('已生成本地 + 云端备份');
    } catch (err) {
      message.error(err.message || '备份失败');
    } finally {
      setBackupBusy(false);
    }
  };

  const onRestoreLocal = async () => {
    if (!restoreId) {
      message.warning('请选择一条本地历史备份');
      return;
    }
    setBackupBusy(true);
    try {
      await restoreLocalBackup(restoreId);
      message.success('已从本地备份恢复');
    } catch (err) {
      message.error(err.message || '恢复失败');
    } finally {
      setBackupBusy(false);
    }
  };

  const onRestoreCloud = async () => {
    setBackupBusy(true);
    try {
      await restoreCloudLatest();
      message.success('已从云端最新备份恢复');
    } catch (err) {
      message.error(err.message || '恢复失败');
    } finally {
      setBackupBusy(false);
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
          label: <Link to="/inventory/product">商品管理</Link>,
        },
        {
          key: '/inventory/inbound',
          icon: <ExportOutlined />,
          label: <Link to="/inventory/inbound">入库</Link>,
        },
        {
          key: '/inventory/outbound',
          label: <Link to="/inventory/outbound">出库</Link>,
        },
        {
          key: '/inventory/inbound-order',
          label: <Link to="/inventory/inbound-order">入库单</Link>,
        },
        {
          key: '/inventory/outbound-order',
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
      label: '往来单位',
      children: [
        {
          key: '/partner/customer',
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
        <div className={styles.logo}>
          {session?.company ? `${session.company}` : '仓库管理系统'}
          {session?.company ? <span className={styles.logoSub}>仓库管理系统</span> : null}
        </div>
        <Space>
          <Button type="link" icon={<FileExcelOutlined />} onClick={downloadExcel}>
            导出Excel
          </Button>
          <Button type="link" icon={<SaveOutlined />} onClick={openCloudConfig}>
            备份与同步
          </Button>
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
          <Content className={styles.main}>
            <Spin spinning={Boolean(writing)} tip="正在同步云端数据，请稍候…">
              {children}
            </Spin>
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="云端同步与数据备份"
        visible={cloudOpen}
        onCancel={() => setCloudOpen(false)}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="防丢数据三层保障"
          description="① 每次写入前自动做本地快照（最近 12 份）② 云端保留 backup-latest + 近 7 天按日备份 ③ 可随时导出 JSON 到电脑。删除采用软删除，避免多端把旧数据合并回来。"
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

        <Divider>数据备份 / 恢复</Divider>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Button icon={<FileExcelOutlined />} type="primary" ghost onClick={downloadExcel}>
              导出 Excel（多 Sheet）
            </Button>
            <Button icon={<DownloadOutlined />} onClick={downloadBackup} loading={backupBusy}>
              导出完整备份
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileRef.current?.click()}
              loading={backupBusy}
            >
              导入备份（合并）
            </Button>
            <Button icon={<SaveOutlined />} onClick={onManualBackup} loading={backupBusy}>
              立即备份
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={onPickImport}
            />
          </Space>

          <div>
            <div style={{ marginBottom: 8 }}>
              <HistoryOutlined /> 从本地历史恢复
            </div>
            <Space style={{ width: '100%' }} align="start">
              <Select
                style={{ minWidth: 320, flex: 1 }}
                placeholder="选择本地快照"
                value={restoreId}
                onChange={setRestoreId}
                options={backupOptions}
                allowClear
              />
              <Popconfirm
                title="将用所选快照覆盖当前业务数据，确定？"
                onConfirm={onRestoreLocal}
                okText="恢复"
                cancelText="取消"
              >
                <Button danger loading={backupBusy}>
                  恢复
                </Button>
              </Popconfirm>
            </Space>
          </div>

          <Popconfirm
            title="将用云端 backup-latest.json 覆盖当前数据，确定？"
            onConfirm={onRestoreCloud}
            okText="恢复"
            cancelText="取消"
          >
            <Button block loading={backupBusy}>
              从云端最新备份恢复
            </Button>
          </Popconfirm>
        </Space>
      </Modal>
    </Layout>
  );
};

export default BasicLayout;
