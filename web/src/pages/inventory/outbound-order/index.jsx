import React, { useMemo, useState } from 'react';
import { Card, Button, Space, Tag, Modal, Descriptions, message } from 'antd';
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const OutboundOrderPage = () => {
  const { data } = useInventory();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const dataSource = useMemo(() => {
    if ((data.outboundOrders || []).length) return data.outboundOrders;
    const groups = {};
    (data.outbound || []).forEach((row) => {
      const key = `${row.date || ''}-${row.customer || ''}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          orderNo: `OUT-${row.date || 'NA'}-${(row.customer || 'C').slice(0, 4)}`,
          customer: row.customer || '-',
          outboundDate: row.date || '-',
          totalAmount: 0,
          status: 'approved',
          remark: '',
        };
      }
      groups[key].totalAmount += (Number(row.quantity) || 0) * (Number(row.price) || 0);
    });
    return Object.values(groups);
  }, [data.outbound, data.outboundOrders]);

  const columns = [
    { title: '出库单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '出库日期', dataIndex: 'outboundDate', key: 'outboundDate' },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `¥${Number(amount || 0).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { text: '待审核', color: 'orange' },
          approved: { text: '已审核', color: 'green' },
          rejected: { text: '已驳回', color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: status || '-', color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space size="small" className="ant-table-cell-actions">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setCurrentRecord(record);
              setIsModalVisible(true);
            }}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => {
              window.print();
              message.success('已调起打印');
            }}
          >
            打印
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="出库单管理">
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title="出库单详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentRecord && (
          <Descriptions bordered>
            <Descriptions.Item label="出库单号" span={3}>
              {currentRecord.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="客户" span={3}>
              {currentRecord.customer}
            </Descriptions.Item>
            <Descriptions.Item label="出库日期" span={3}>
              {currentRecord.outboundDate}
            </Descriptions.Item>
            <Descriptions.Item label="总金额" span={3}>
              ¥{Number(currentRecord.totalAmount || 0).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={3}>
              {currentRecord.status}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={3}>
              {currentRecord.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OutboundOrderPage;
