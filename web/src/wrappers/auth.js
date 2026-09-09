import { Redirect } from 'umi';
import { loadSession, isSyncReady } from '@/services/inventoryStore';

export default (props) => {
  const isLoggedIn = Boolean(loadSession()) || localStorage.getItem('isLoggedIn') === 'true';
  // 旧本地登录态：未配云端时强制回登录页去填 Token
  if (!isSyncReady()) {
    return <Redirect to="/user/login" />;
  }
  if (!isLoggedIn) {
    return <Redirect to="/user/login" />;
  }
  return <>{props.children}</>;
};
