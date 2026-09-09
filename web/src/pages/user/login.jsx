import React from 'react';
import { Form, Input, Button, Card ,message} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styles from './login.less';
import { history } from 'umi';

export default function LoginPage() {
  const onFinish = (values) => {
    // debugger
    message.success('登录成功');
    // 存储登录状态
    localStorage.setItem('isLoggedIn', 'true');
    // 跳转到首页
    console.log('准备跳转到首页');
    setTimeout(() => {
      history.replace('/home');
      console.log('跳转完成');
    }, 100);
  };

  return (
    <div className={styles.container}>
      <Card title="用户登录" className={styles.card}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 