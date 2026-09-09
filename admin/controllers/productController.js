const db = require('../models/db');

// 获取商品列表
exports.list = async (req, res) => {
    debugger
    const [rows] = await db.query('SELECT * FROM product');
    res.json(rows);
};

// 新增商品
exports.create = async (req, res) => {
  const { name, code, category, unit, remark } = req.body;
  await db.query(
    'INSERT INTO product (name, code, category, unit, remark) VALUES (?, ?, ?, ?, ?)',
    [name, code, category, unit, remark]
  );
  res.json({ success: true });
};

// 更新商品
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, code, category, unit, remark } = req.body;
  await db.query(
    'UPDATE product SET name=?, code=?, category=?, unit=?, remark=? WHERE id=?',
    [name, code, category, unit, remark, id]
  );
  res.json({ success: true });
};

// 删除商品
exports.remove = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM product WHERE id=?', [id]);
  res.json({ success: true });
};