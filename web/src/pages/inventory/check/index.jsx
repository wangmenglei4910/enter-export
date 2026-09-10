import React, { useState } from 'react';
import { Card, Button, Form, Input, Space, message, Modal, Select, InputNumber } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const { Option } = Select;

const InventoryCheckPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, upsert, stockMap, today, writing } = useInventory();
  const dataSource = data.checks || [];
  const products = data.products || [];

  const columns = [
    { title: '盘点单号', dataIndex: 'checkId', key: 'checkId' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '系统库存', dataIndex: 'systemQuantity', key: 'systemQuantity' },
    { title: '实际库存', dataIndex: 'actualQuantity', key: 'actualQuantity' },
    {
      title: '差异数量',
      dataIndex: 'difference',
      key: 'difference',
      render: (_, record) =>
        (Number(record.actualQuantity) || 0) - (Number(record.systemQuantity) || 0),
    },
    { title: '盘点日期', dataIndex: 'checkDate', key: 'checkDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === '已完成' ? '#52c41a' : '#faad14' }}>{status}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small" className="ant-table-cell-actions">
          {record.status !== '已完成' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              disabled={writing}
              onClick={() => handleComplete(record)}
            >
              完成盘点
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ checkDate: today });
    setIsModalVisible(true);
  };

  const handleComplete = (record) => {
    Modal.confirm({
      title: '确认完成',
      content: '确定要完成该盘点任务吗？',
      onOk: async () => {
        const hide = message.loading('正在保存并同步…', 0);
        try {
          await upsert('checks', { ...record, status: '已完成' });
          message.success('盘点完成');
        } finally {
          hide();
        }
      },
    });
  };

  const handleModalOk = () =>
    form.validateFields().then(async (values) => {
      const hide = message.loading('正在添加并同步…', 0);
      try {
        const product = products.find((p) => p.id === values.productId);
        const systemQuantity =
          values.systemQuantity ?? (product ? stockMap[product.id] || 0 : 0);
        await upsert('checks', {
          checkId: `CK${Date.now()}`,
          productId: values.productId,
          productName: product?.name || '',
          systemQuantity: Number(systemQuantity) || 0,
          actualQuantity: Number(values.actualQuantity) || 0,
          checkDate: values.checkDate || today,
          status: '进行中',
        });
        message.success('添加盘点任务成功');
        setIsModalVisible(false);
        form.resetFields();
      } finally {
        hide();
      }
    });

  return (
    <div>
      <Card
        title="库存盘点"
        extra={
          <Button type="primary" icon={<PlusOutlined />} disabled={writing} onClick={handleAdd}>
            新增盘点
          </Button>
        }
      >
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title="新增盘点"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => !writing && setIsModalVisible(false)}
        confirmLoading={writing}
        maskClosable={!writing}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="productId"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select
              placeholder="请选择商品"
              onChange={(id) => {
                form.setFieldsValue({ systemQuantity: stockMap[id] || 0 });
              }
              }
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}（当前库存 {stockMap[p.id] || 0}）
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="systemQuantity"
            label="系统库存"
            rules={[{ required: true, message: '请输入系统库存' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="actualQuantity"
            label="实际库存"
            rules={[{ required: true, message: '请输入实际库存' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="checkDate"
            label="盘点日期"
            rules={[{ required: true, message: '请输入盘点日期' }]}
          >
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryCheckPage;
