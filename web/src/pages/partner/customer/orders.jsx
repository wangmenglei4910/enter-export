import React, { useMemo } from 'react';
import { Card, Empty } from 'antd';
import { useParams } from 'umi';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const CustomerOrdersPage = () => {
  const { id } = useParams();
  const { data } = useInventory();
  const customer = (data.customers || []).find((c) => c.id === id);

  const dataSource = useMemo(() => {
    return (data.outbound || []).filter(
      (row) => row.customerId === id || row.customer === customer?.name,
    );
  }, [data.outbound, id, customer]);

  const columns = [
    { title: '商品', dataIndex: 'productName', key: 'productName' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '单价', dataIndex: 'price', key: 'price', width: 100 },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: '金额',
      key: 'amount',
      width: 120,
      render: (_, r) =>
        `¥${((Number(r.quantity) || 0) * (Number(r.price) || 0)).toFixed(2)}`,
    },
  ];

  return (
    <Card title={`客户历史订单${customer ? ` - ${customer.name}` : ''}`}>
      {dataSource.length ? (
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      ) : (
        <Empty description="暂无出库记录" />
      )}
    </Card>
  );
};

export default CustomerOrdersPage;
