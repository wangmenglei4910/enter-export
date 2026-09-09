import React, { useMemo } from 'react';
import { Card, Row, Col, Empty } from 'antd';
import { Line, Bar, Pie } from '@ant-design/plots';
import { useInventory } from '@/hooks/useInventory';

const StatisticsPage = () => {
  const { data, stockMap } = useInventory();

  const trendData = useMemo(() => {
    const map = {};
    const bump = (date, type, qty) => {
      const key = String(date || '').slice(0, 7) || '未知';
      const id = `${key}-${type}`;
      if (!map[id]) map[id] = { date: key, type, value: 0 };
      map[id].value += Number(qty) || 0;
    };
    (data.inbound || []).forEach((r) => bump(r.date, '入库', r.quantity));
    (data.outbound || []).forEach((r) => bump(r.date, '出库', r.quantity));
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [data.inbound, data.outbound]);

  const inventoryData = useMemo(() => {
    return (data.products || [])
      .map((p) => ({
        type: p.name,
        value: Math.max(0, Number(stockMap[p.id]) || 0),
      }))
      .filter((x) => x.value > 0);
  }, [data.products, stockMap]);

  const customerData = useMemo(() => {
    const map = {};
    (data.outbound || []).forEach((r) => {
      const name = r.customer || '未知客户';
      const amount = (Number(r.quantity) || 0) * (Number(r.price) || 0);
      map[name] = (map[name] || 0) + amount;
    });
    return Object.entries(map)
      .map(([customer, amount]) => ({ customer, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [data.outbound]);

  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="入库出库趋势">
            {trendData.length ? (
              <Line data={trendData} xField="date" yField="value" seriesField="type" smooth />
            ) : (
              <Empty description="暂无出入库数据" />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="库存分布">
            {inventoryData.length ? (
              <Pie data={inventoryData} angleField="value" colorField="type" radius={0.8} />
            ) : (
              <Empty description="暂无库存" />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="客户采购排行" style={{ marginTop: 16 }}>
        {customerData.length ? (
          <Bar data={customerData} xField="amount" yField="customer" seriesField="customer" />
        ) : (
          <Empty description="暂无出库金额数据" />
        )}
      </Card>
    </div>
  );
};

export default StatisticsPage;
