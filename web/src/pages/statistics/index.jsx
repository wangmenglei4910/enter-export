import React, { useMemo } from 'react';
import { Card, Row, Col, Empty, Statistic, Tag, Table } from 'antd';
import { Line, Column } from '@ant-design/plots';
import { WarningOutlined } from '@ant-design/icons';
import { useInventory } from '@/hooks/useInventory';

function monthKey(date) {
  return String(date || '').slice(0, 7) || '未知';
}

function money(n) {
  return Number(n || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function renderTrendTooltip(title, detail) {
  const d = detail?.[title];
  if (!d) return `<div style="padding:4px 8px">${title || ''}</div>`;

  const block = (label, rows, total, color) => {
    if (!rows.length) {
      return `<div style="margin-top:6px;color:#999">${label}：无</div>`;
    }
    const items = rows
      .map(
        (r) =>
          `<div style="display:flex;justify-content:space-between;gap:16px;line-height:1.6">
            <span>${r.name}</span>
            <span style="color:${color};font-variant-numeric:tabular-nums">${r.qty} 吨</span>
          </div>`,
      )
      .join('');
    return `<div style="margin-top:8px">
      <div style="font-weight:600;color:${color};margin-bottom:2px">${label}合计 ${total} 吨</div>
      ${items}
    </div>`;
  };

  return `<div style="padding:8px 10px;max-width:280px;max-height:280px;overflow:auto">
    <div style="font-weight:600;margin-bottom:4px">${title}</div>
    <div>入库 ${d.totalIn} 吨 ／ 出库 ${d.totalOut} 吨</div>
    ${block('入库', d.inbound, d.totalIn, '#3f8600')}
    ${block('出库', d.outbound, d.totalOut, '#cf1322')}
  </div>`;
}

const StatisticsPage = () => {
  const { data, stockMap } = useInventory();

  const { trendData, trendDetail } = useMemo(() => {
    const totals = {};
    const detail = {};

    const ensure = (key) => {
      if (!detail[key]) {
        detail[key] = {
          inboundMap: {},
          outboundMap: {},
          totalIn: 0,
          totalOut: 0,
        };
      }
      return detail[key];
    };

    const bumpTotal = (key, type, qty) => {
      const id = `${key}-${type}`;
      if (!totals[id]) totals[id] = { date: key, type, value: 0 };
      totals[id].value += qty;
    };

    (data.inbound || []).forEach((r) => {
      const key = monthKey(r.date);
      const qty = Number(r.quantity) || 0;
      const name = r.productName || r.productId || '未知商品';
      const slot = ensure(key);
      slot.inboundMap[name] = (slot.inboundMap[name] || 0) + qty;
      slot.totalIn += qty;
      bumpTotal(key, '入库', qty);
    });

    (data.outbound || []).forEach((r) => {
      const key = monthKey(r.date);
      const qty = Number(r.quantity) || 0;
      const name = r.productName || r.productId || '未知商品';
      const slot = ensure(key);
      slot.outboundMap[name] = (slot.outboundMap[name] || 0) + qty;
      slot.totalOut += qty;
      bumpTotal(key, '出库', qty);
    });

    const normalizedDetail = {};
    Object.keys(detail).forEach((key) => {
      const slot = detail[key];
      normalizedDetail[key] = {
        totalIn: Number(slot.totalIn.toFixed(3)),
        totalOut: Number(slot.totalOut.toFixed(3)),
        inbound: Object.entries(slot.inboundMap)
          .map(([name, qty]) => ({ name, qty: Number(qty.toFixed(3)) }))
          .sort((a, b) => b.qty - a.qty),
        outbound: Object.entries(slot.outboundMap)
          .map(([name, qty]) => ({ name, qty: Number(qty.toFixed(3)) }))
          .sort((a, b) => b.qty - a.qty),
      };
    });

    return {
      trendData: Object.values(totals).sort((a, b) => a.date.localeCompare(b.date)),
      trendDetail: normalizedDetail,
    };
  }, [data.inbound, data.outbound]);

  const inventoryData = useMemo(() => {
    return (data.products || [])
      .map((p) => ({
        name: p.name || p.code || p.id,
        stock: Number(stockMap[p.id]) || 0,
      }))
      .sort((a, b) => a.stock - b.stock);
  }, [data.products, stockMap]);

  const customerData = useMemo(() => {
    const map = {};
    (data.outbound || []).forEach((r) => {
      const name = r.customer || '未知客户';
      const amount = (Number(r.quantity) || 0) * (Number(r.price) || 0);
      map[name] = (map[name] || 0) + amount;
    });
    return Object.entries(map)
      .map(([customer, amount]) => ({ customer, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [data.outbound]);

  const alertRows = useMemo(() => {
    return (data.products || [])
      .map((p) => {
        const currentStock = Number(stockMap[p.id]) || 0;
        const minStock = Number(p.minStock) || 0;
        const negative = currentStock < 0;
        const low = minStock > 0 && currentStock <= minStock;
        if (!negative && !low) return null;
        return {
          id: p.id,
          productName: p.name,
          productCode: p.code || p.id,
          currentStock,
          minStock,
          status: negative ? '库存为负' : currentStock <= 0 ? '严重不足' : '库存偏低',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [data.products, stockMap]);

  const profit = useMemo(() => {
    const costAcc = {};
    (data.inbound || []).forEach((r) => {
      const id = r.productId || r.productName || 'unknown';
      if (!costAcc[id]) costAcc[id] = { qty: 0, amount: 0, name: r.productName || id };
      const qty = Number(r.quantity) || 0;
      const price = Number(r.price) || 0;
      costAcc[id].qty += qty;
      costAcc[id].amount += qty * price;
    });

    const avgCost = {};
    Object.entries(costAcc).forEach(([id, v]) => {
      avgCost[id] = v.qty > 0 ? v.amount / v.qty : 0;
    });

    let revenue = 0;
    let cogs = 0;
    const byMonth = {};
    const byProduct = {};

    (data.outbound || []).forEach((r) => {
      const id = r.productId || r.productName || 'unknown';
      const name = r.productName || costAcc[id]?.name || id;
      const qty = Number(r.quantity) || 0;
      const price = Number(r.price) || 0;
      const unitCost = avgCost[id] || 0;
      const sale = qty * price;
      const cost = qty * unitCost;
      const gp = sale - cost;
      revenue += sale;
      cogs += cost;

      const m = monthKey(r.date);
      if (!byMonth[m]) byMonth[m] = { month: m, profit: 0, revenue: 0, cost: 0 };
      byMonth[m].profit += gp;
      byMonth[m].revenue += sale;
      byMonth[m].cost += cost;

      if (!byProduct[id]) byProduct[id] = { name, profit: 0, revenue: 0, cost: 0 };
      byProduct[id].profit += gp;
      byProduct[id].revenue += sale;
      byProduct[id].cost += cost;
    });

    const monthData = Object.values(byMonth)
      .map((x) => ({
        month: x.month,
        profit: Number(x.profit.toFixed(2)),
        revenue: Number(x.revenue.toFixed(2)),
        cost: Number(x.cost.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const productData = Object.values(byProduct)
      .map((x) => ({
        name: x.name,
        profit: Number(x.profit.toFixed(2)),
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    return {
      revenue: Number(revenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      gross: Number((revenue - cogs).toFixed(2)),
      monthData,
      productData,
    };
  }, [data.inbound, data.outbound]);

  const alertColumns = [
    { title: '商品编号', dataIndex: 'productCode', key: 'productCode' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (v) => (
        <span style={{ color: v < 0 ? '#cf1322' : undefined, fontWeight: v < 0 ? 600 : 400 }}>
          {v}
        </span>
      ),
    },
    { title: '最低库存', dataIndex: 'minStock', key: 'minStock' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === '库存为负' || status === '严重不足' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="销售收入" value={profit.revenue} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="销售成本（按加权入库均价）" value={profit.cogs} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="毛利润"
              value={profit.gross}
              precision={2}
              prefix="¥"
              valueStyle={{ color: profit.gross >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="入库出库趋势">
            {trendData.length ? (
              <Line
                data={trendData}
                xField="date"
                yField="value"
                colorField="type"
                seriesField="type"
                smooth
                height={320}
                legend={{ position: 'top' }}
                axis={{
                  y: { title: false, labelFormatter: (v) => `${v}` },
                  x: { title: false },
                }}
                interaction={{
                  tooltip: {
                    shared: true,
                    render: (_e, { title }) => renderTrendTooltip(title, trendDetail),
                  },
                }}
                tooltip={{
                  title: 'date',
                }}
              />
            ) : (
              <Empty description="暂无出入库数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="库存分布（含负库存）">
            {inventoryData.length ? (
              <Column
                data={inventoryData}
                xField="name"
                yField="stock"
                height={320}
                label={{
                  text: 'stock',
                  style: { fontSize: 10 },
                }}
                style={{
                  fill: ({ stock }) => (stock < 0 ? '#cf1322' : '#5B8FF9'),
                }}
                axis={{
                  x: {
                    labelAutoRotate: true,
                    labelAutoHide: true,
                  },
                  y: { title: false },
                }}
                tooltip={{
                  items: [
                    (d) => ({
                      name: '库存',
                      value: `${d.stock} 吨`,
                    }),
                  ],
                }}
              />
            ) : (
              <Empty description="暂无商品" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="客户采购意向">
            {customerData.length ? (
              <Column
                data={customerData}
                xField="customer"
                yField="amount"
                height={300}
                axis={{
                  x: { labelAutoRotate: true, labelAutoHide: true },
                  y: {
                    labelFormatter: (v) => `¥${money(v)}`,
                  },
                }}
                tooltip={{
                  items: [
                    (d) => ({
                      name: '采购金额',
                      value: `¥${money(d.amount)}`,
                    }),
                  ],
                }}
              />
            ) : (
              <Empty description="暂无出库金额数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="毛利润趋势（按月）">
            {profit.monthData.length ? (
              <Line
                data={profit.monthData}
                xField="month"
                yField="profit"
                smooth
                height={300}
                axis={{
                  y: {
                    labelFormatter: (v) => `¥${money(v)}`,
                  },
                }}
                tooltip={{
                  items: [
                    (d) => ({
                      name: '毛利润',
                      value: `¥${money(d.profit)}`,
                    }),
                  ],
                }}
              />
            ) : (
              <Empty description="暂无利润数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="商品毛利润排行（Top 10）">
            {profit.productData.length ? (
              <Column
                data={profit.productData}
                xField="name"
                yField="profit"
                height={300}
                style={{
                  fill: ({ profit: p }) => (p < 0 ? '#cf1322' : '#3f8600'),
                }}
                axis={{
                  x: { labelAutoRotate: true, labelAutoHide: true },
                  y: {
                    labelFormatter: (v) => `¥${money(v)}`,
                  },
                }}
                tooltip={{
                  items: [
                    (d) => ({
                      name: '毛利润',
                      value: `¥${money(d.profit)}`,
                    }),
                  ],
                }}
              />
            ) : (
              <Empty description="暂无出库利润数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                库存预警
              </span>
            }
          >
            {alertRows.length ? (
              <Table
                size="small"
                rowKey="id"
                columns={alertColumns}
                dataSource={alertRows}
                pagination={false}
                scroll={{ y: 260 }}
              />
            ) : (
              <Empty description="暂无预警商品" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsPage;
