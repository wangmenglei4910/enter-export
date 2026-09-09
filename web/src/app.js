import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { history } from 'umi';
import { InventoryProvider } from '@/hooks/useInventory';
import { loadSession, isSyncReady } from '@/services/inventoryStore';

moment.locale('zh-cn');

export function rootContainer(container) {
  return (
    <ConfigProvider locale={zhCN}>
      <InventoryProvider>{container}</InventoryProvider>
    </ConfigProvider>
  );
}

export async function getInitialState() {
  return {
    name: '仓库管理系统',
  };
}

export function onRouteChange({ location }) {
  const syncReady = isSyncReady();
  const isLoggedIn = Boolean(loadSession()) || localStorage.getItem('isLoggedIn') === 'true';
  const isLoginPage = location.pathname === '/user/login';

  // 未配云端：只留在登录页，避免与「已登录」互相 redirect 造成白屏
  if (!syncReady) {
    if (!isLoginPage) history.replace('/user/login');
    return;
  }

  if (!isLoggedIn && !isLoginPage) {
    history.replace('/user/login');
  } else if (isLoggedIn && isLoginPage) {
    history.replace('/home');
  }
}
