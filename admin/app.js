const express = require('express');
const app = express();
const productRouter = require('./routes/product');

app.use(express.json());
app.use('/api/product', productRouter);

app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});