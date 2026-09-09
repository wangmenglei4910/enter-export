import React from 'react';
import { Table } from 'antd';

/**
 * 统一表格：防止列被挤压导致操作按钮裁切，窄屏可横向滚动
 */
const AppTable = ({ pagination, scroll, className, ...rest }) => {
  const mergedPagination =
    pagination === false
      ? false
      : {
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          ...(typeof pagination === 'object' ? pagination : {}),
        };

  return (
    <Table
      size="middle"
      className={['app-table', className].filter(Boolean).join(' ')}
      scroll={{ x: 'max-content', ...scroll }}
      pagination={mergedPagination}
      {...rest}
    />
  );
};

export default AppTable;
