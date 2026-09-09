import React, { useMemo, useState } from 'react';
import { Card, Button, Space, Tag, Modal, Descriptions, message } from 'antd';
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const InboundOrderPage = () => {
  const { data } = useInventory();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const dataSource = useMemo(() => {
    if ((data.inboundOrders || []).length) return data.inboundOrders;
    // 由入库明细自动汇总展示
    const groups = {};
    (data.inbound || []).forEach((row) => {
      const key = `${row.date || ''}-${row.supplier || ''}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          orderNo: `IN-${row.date || 'NA'}-${(row.supplier || 'S').slice(0, 4)}`,
          supplier: row.supplier || '-',
          inboundDate: row.date || '-',
          totalAmount: 0,
          status: 'approved',
          remark: '',
        };
      }
      groups[key].totalAmount += (Number(row.quantity) || 0) * (Number(row.price) || 0);
    });
    return Object.values(groups);
  }, [data.inbound, data.inboundOrders]);

  const columns = [
    { title: '入库单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
    { title: '入库日期', dataIndex: 'inboundDate', key: 'inboundDate' },
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
      <Card title="入库单管理">
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title="入库单详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentRecord && (
          <Descriptions bordered>
            <Descriptions.Item label="入库单号" span={3}>
              {currentRecord.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="供应商" span={3}>
              {currentRecord.supplier}
            </Descriptions.Item>
            <Descriptions.Item label="入库日期" span={3}>
              {currentRecord.inboundDate}
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

export default InboundOrderPage;
