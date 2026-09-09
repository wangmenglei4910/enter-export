import React, { useMemo } from 'react';
import { Card, Tag, Button, Space, message } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const InventoryAlertPage = () => {
  const { data, stockMap, pullRemote } = useInventory();

  const dataSource = useMemo(() => {
    return (data.products || [])
      .map((p) => {
        const currentStock = Number(stockMap[p.id]) || 0;
        const minStock = Number(p.minStock) || 0;
        if (minStock <= 0) return null;
        if (currentStock > minStock) return null;
        return {
          id: p.id,
          productId: p.code || p.id,
          productName: p.name,
          currentStock,
          minStock,
          status: currentStock <= 0 ? '严重不足' : '库存偏低',
        };
      })
      .filter(Boolean);
  }, [data.products, stockMap]);

  const columns = [
    { title: '商品编号', dataIndex: 'productId', key: 'productId' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock' },
    { title: '最低库存', dataIndex: 'minStock', key: 'minStock' },
    {
      title: '预警状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === '严重不足' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: () => (
        <Space size="small" className="ant-table-cell-actions">
          <Button
            type="link"
            icon={<ReloadOutlined />}
            onClick={async () => {
              await pullRemote();
              message.success('库存信息已更新');
            }}
          >
            刷新
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <span>
            <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
            库存预警
          </span>
        }
      >
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
};

export default InventoryAlertPage;
