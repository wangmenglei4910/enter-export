import * as XLSX from 'xlsx';
import { COLLECTIONS } from '@/services/inventoryStore';

/** sheet 名称（Excel 限制 ≤31 字符） */
export const SHEET_LABELS = {
  products: '商品',
  customers: '客户',
  suppliers: '供应商',
  inbound: '入库',
  outbound: '出库',
  inboundOrders: '入库单',
  outboundOrders: '出库单',
  checks: '盘点',
  alerts: '预警',
  stock: '库存汇总',
};

const FIELD_LABELS = {
  id: 'ID',
  code: '编号',
  name: '名称',
  productId: '商品ID',
  productName: '商品名称',
  quantity: '数量',
  price: '单价',
  unit: '单位',
  supplier: '供应商',
  customer: '客户',
  date: '日期',
  inboundDate: '入库日期',
  outboundDate: '出库日期',
  orderNo: '单号',
  status: '状态',
  phone: '电话',
  address: '地址',
  contact: '联系人',
  remark: '备注',
  minStock: '最低库存',
  currentStock: '当前库存',
  systemQuantity: '账面数量',
  actualQuantity: '实盘数量',
  difference: '差异',
  companyId: '公司ID',
  updatedAt: '更新时间',
  totalAmount: '总金额',
};

function cellValue(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return value;
}

function formatUpdatedAt(row) {
  if (!row || !row.updatedAt) return row;
  const next = { ...row };
  const n = Number(row.updatedAt);
  if (n > 1e11) {
    const d = new Date(n);
    if (!Number.isNaN(d.getTime())) {
      const p = (x) => String(x).padStart(2, '0');
      next.updatedAt = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
        d.getHours(),
      )}:${p(d.getMinutes())}`;
    }
  }
  return next;
}

function rowsToSheet(rows) {
  const list = (rows || []).map((row) => {
    const clean = { ...row };
    delete clean._deleted;
    return formatUpdatedAt(clean);
  });

  if (!list.length) {
    return XLSX.utils.aoa_to_sheet([['（暂无数据）']]);
  }

  const keySet = new Set();
  list.forEach((row) => Object.keys(row || {}).forEach((k) => keySet.add(k)));
  // 常用字段靠前
  const preferred = Object.keys(FIELD_LABELS);
  const keys = [
    ...preferred.filter((k) => keySet.has(k)),
    ...Array.from(keySet)
      .filter((k) => !preferred.includes(k))
      .sort(),
  ];

  const header = keys.map((k) => FIELD_LABELS[k] || k);
  const body = list.map((row) => keys.map((k) => cellValue(row[k])));
  return XLSX.utils.aoa_to_sheet([header, ...body]);
}

function buildStockRows(products, stockMap) {
  return (products || []).map((p) => ({
    id: p.id,
    code: p.code || '',
    name: p.name || '',
    currentStock: Number(stockMap?.[p.id]) || 0,
    minStock: Number(p.minStock) || 0,
    unit: p.unit || '吨',
    remark: p.remark || '',
  }));
}

/**
 * 导出当前公司可见数据为多 Sheet Excel
 * @param {{ data: object, stockMap?: object, company?: string }} options
 */
export function exportInventoryExcel({ data, stockMap = {}, company = '' } = {}) {
  const wb = XLSX.utils.book_new();

  COLLECTIONS.forEach((key) => {
    const sheetName = SHEET_LABELS[key] || key;
    const sheet = rowsToSheet(data?.[key] || []);
    XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31));
  });

  const stockSheet = rowsToSheet(buildStockRows(data?.products || [], stockMap));
  XLSX.utils.book_append_sheet(wb, stockSheet, SHEET_LABELS.stock);

  const stamp = (() => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
      d.getMinutes(),
    )}`;
  })();

  const safeCompany = String(company || '仓库')
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 20);
  const filename = `${safeCompany}-数据导出-${stamp}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
