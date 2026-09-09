import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { history } from 'umi';
import { InventoryProvider } from '@/hooks/useInventory';
import { loadSession } from '@/services/inventoryStore';

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
  const isLoggedIn = Boolean(loadSession()) || localStorage.getItem('isLoggedIn') === 'true';
  const isLoginPage = location.pathname === '/user/login';

  if (!isLoggedIn && !isLoginPage) {
    history.replace('/user/login');
  } else if (isLoggedIn && isLoginPage) {
    history.replace('/home');
  }
}
