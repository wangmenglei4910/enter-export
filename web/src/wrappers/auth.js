import { Redirect } from 'umi';
import { loadSession } from '@/services/inventoryStore';

export default (props) => {
  const isLoggedIn = Boolean(loadSession()) || localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Redirect to="/user/login" />;
  }
  return <>{props.children}</>;
};
