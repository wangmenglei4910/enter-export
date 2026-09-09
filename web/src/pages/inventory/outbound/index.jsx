import React, { useState } from 'react';
import { Card, Button, Space, Form, Input, Modal, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const { Option } = Select;

const OutboundPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { data, upsert, remove, today } = useInventory();
  const dataSource = data.outbound || [];
  const products = data.products || [];
  const customers = data.customers || [];

  const columns = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '数量（吨）', dataIndex: 'quantity', key: 'quantity' },
    { title: '单价（元/吨）', dataIndex: 'price', key: 'price' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '出库日期', dataIndex: 'date', key: 'date' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small" className="ant-table-cell-actions">
          <a onClick={() => handleEdit(record)}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ date: today, unit: '吨' });
    setVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        await remove('outbound', record.id);
        message.success('删除成功');
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      const product = products.find((p) => p.id === values.productId);
      const customer = customers.find((c) => c.id === values.customerId);
      await upsert('outbound', {
        ...(editingRecord || {}),
        ...values,
        productName: product?.name || values.productName || '',
        customer: customer?.name || values.customer || '',
        unit: values.unit || '吨',
        date: values.date || today,
        id: editingRecord?.id,
      });
      message.success(editingRecord ? '修改成功' : '添加成功');
      setVisible(false);
    });
  };

  return (
    <div>
      <Card
        title="出库管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加出库
          </Button>
        }
      >
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title={editingRecord ? '编辑出库' : '添加出库'}
        open={visible}
        onOk={handleModalOk}
        onCancel={() => setVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="productId"
            label="选择商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="请选择商品" showSearch optionFilterProp="children">
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="price" label="单价（元/吨）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="请选择客户">
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="出库日期" rules={[{ required: true, message: '请输入日期' }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OutboundPage;
