import React from 'react';
import { Result, Button } from 'antd';
import { history } from 'umi';

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          返回首页
        </Button>
      }
    />
  );
} 