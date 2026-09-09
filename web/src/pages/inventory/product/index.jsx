import React, { useState } from 'react';
import { Card, Button, Space, Form, Input, Modal, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const { Option } = Select;

const categories = [
  { id: '1', name: '原材料' },
  { id: '2', name: '半成品' },
  { id: '3', name: '成品' },
  { id: '4', name: '包装材料' },
];

const ProductPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { data, upsert, remove } = useInventory();
  const dataSource = data.products || [];

  const columns = [
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '商品编码', dataIndex: 'code', key: 'code' },
    { title: '商品类别', dataIndex: 'category', key: 'category' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
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
    form.setFieldsValue({ unit: '吨' });
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
      content: '确定要删除这个商品吗？',
      onOk: async () => {
        await remove('products', record.id);
        message.success('删除成功');
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      await upsert('products', {
        ...(editingRecord || {}),
        ...values,
        unit: values.unit || '吨',
        id: editingRecord?.id,
      });
      message.success(editingRecord ? '修改成功' : '添加成功');
      setVisible(false);
    });
  };

  return (
    <div>
      <Card
        title="商品管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加商品
          </Button>
        }
      >
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title={editingRecord ? '编辑商品' : '添加商品'}
        open={visible}
        onOk={handleModalOk}
        onCancel={() => setVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ unit: '吨' }}>
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="商品编码"
            rules={[{ required: true, message: '请输入商品编码' }]}
          >
            <Input placeholder="请输入商品编码" />
          </Form.Item>
          <Form.Item
            name="category"
            label="商品类别"
            rules={[{ required: true, message: '请选择商品类别' }]}
          >
            <Select placeholder="请选择商品类别">
              {categories.map((category) => (
                <Option key={category.id} value={category.name}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="minStock" label="最低库存预警">
            <Input type="number" placeholder="可选，用于库存预警" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPage;
