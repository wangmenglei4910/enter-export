import React, { useState } from 'react';
import { Card, Button, Space, Form, Input, Modal, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const { Option } = Select;

const InboundPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { data, upsert, remove, today, writing } = useInventory();
  const dataSource = data.inbound || [];
  const products = data.products || [];
  const suppliers = data.suppliers || [];

  const columns = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '数量（吨）', dataIndex: 'quantity', key: 'quantity' },
    { title: '单价（元/吨）', dataIndex: 'price', key: 'price' },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
    { title: '入库日期', dataIndex: 'date', key: 'date' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small" className="ant-table-cell-actions">
          <Button type="link" disabled={writing} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger disabled={writing} onClick={() => handleDelete(record)}>
            删除
          </Button>
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
        const hide = message.loading('正在删除并同步…', 0);
        try {
          await remove('inbound', record.id);
          message.success('删除成功');
        } finally {
          hide();
        }
      },
    });
  };

  const handleModalOk = () =>
    form.validateFields().then(async (values) => {
      const hide = message.loading(editingRecord ? '正在保存…' : '正在添加并同步…', 0);
      try {
        const product = products.find((p) => p.id === values.productId);
        const supplier = suppliers.find((s) => s.id === values.supplierId);
        await upsert('inbound', {
          ...(editingRecord || {}),
          ...values,
          productName: product?.name || values.productName || '',
          supplier: supplier?.name || values.supplier || '',
          unit: values.unit || '吨',
          date: values.date || today,
          id: editingRecord?.id,
        });
        message.success(editingRecord ? '修改成功' : '添加成功');
        setVisible(false);
      } finally {
        hide();
      }
    });

  return (
    <div>
      <Card
        title="入库管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} disabled={writing} onClick={handleAdd}>
            添加入库
          </Button>
        }
      >
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title={editingRecord ? '编辑入库' : '添加入库'}
        visible={visible}
        onOk={handleModalOk}
        onCancel={() => !writing && setVisible(false)}
        confirmLoading={writing}
        destroyOnClose
        maskClosable={!writing}
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
            name="supplierId"
            label="供应商"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select placeholder="请选择供应商">
              {suppliers.map((supplier) => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="入库日期" rules={[{ required: true, message: '请输入日期' }]}>
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

export default InboundPage;
