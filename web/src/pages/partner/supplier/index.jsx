import React, { useState } from 'react';
import { Card, Button, Space, Tag, Modal, Form, Input, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { useInventory } from '@/hooks/useInventory';
import AppTable from '@/components/AppTable';

const SupplierPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const { data, upsert, remove, writing } = useInventory();
  const dataSource = data.suppliers || [];

  const columns = [
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => history.push(`/partner/supplier/${record.id}/orders`)}>
          {text}
        </Button>
      ),
    },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      className: 'ant-table-cell-wrap',
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 260,
      render: (_, record) => (
        <Space size="small" className="ant-table-cell-actions">
          <Button
            type="link"
            icon={<EyeOutlined />}
            disabled={writing}
            onClick={() => history.push(`/partner/supplier/${record.id}/orders`)}
          >
            查看订单
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            disabled={writing}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            disabled={writing}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除供应商"${record.name}"吗？`,
      onOk: async () => {
        const hide = message.loading('正在删除并同步…', 0);
        try {
          await remove('suppliers', record.id);
          message.success('删除成功');
        } finally {
          hide();
        }
      },
    });
  };

  const handleSubmit = () =>
    form.validateFields().then(async (values) => {
      const hide = message.loading(editingSupplier ? '正在保存…' : '正在添加并同步…', 0);
      try {
        await upsert('suppliers', {
          ...(editingSupplier || {}),
          ...values,
          status: values.status || 'active',
          id: editingSupplier?.id,
        });
        message.success(editingSupplier ? '更新成功' : '添加成功');
        setVisible(false);
      } finally {
        hide();
      }
    });

  return (
    <div>
      <Card
        title="供应商管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} disabled={writing} onClick={handleAdd}>
            新增供应商
          </Button>
        }
      >
        <AppTable columns={columns} dataSource={dataSource} rowKey="id" />
      </Card>

      <Modal
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        visible={visible}
        onOk={handleSubmit}
        onCancel={() => !writing && setVisible(false)}
        confirmLoading={writing}
        destroyOnClose
        maskClosable={!writing}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
          <Form.Item
            name="name"
            label="供应商名称"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item
            name="contact"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierPage;
