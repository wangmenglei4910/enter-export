import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import styles from './index.less';

const HomePage = () => {
  const { data, stockMap, today } = useInventory();

  const stats = useMemo(() => {
    const inboundToday = (data.inbound || []).filter((r) => r.date === today).length;
    const outboundToday = (data.outbound || []).filter((r) => r.date === today).length;
    const alertCount = (data.products || []).filter((p) => {
      const min = Number(p.minStock) || 0;
      if (min <= 0) return false;
      return (stockMap[p.id] || 0) <= min;
    }).length;
    const pendingOrders =
      (data.inboundOrders || []).filter((o) => o.status === 'pending').length +
      (data.outboundOrders || []).filter((o) => o.status === 'pending').length;
    return { inboundToday, outboundToday, alertCount, pendingOrders };
  }, [data, stockMap, today]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>欢迎使用仓库管理系统</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="今日入库"
              value={stats.inboundToday}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="今日出库"
              value={stats.outboundToday}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="库存预警"
              value={stats.alertCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="待处理订单"
              value={stats.pendingOrders}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
