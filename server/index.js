// 启动一个 express 服务，监听3001端口；
// 写一个监听 /api/graph-deposits 接口，返回 res.json(data)

const express = require('express');
const { queryDepositeds } = require('./src/data');
const db = require('./src/db');
const { listenDepositeds } = require('./src/listener');

const app = express();
const port = 3001;

app.use(express.json());

app.get('/api/graph-deposits', async (req, res) => {
  const data = await queryDepositeds(db);
  console.log('Fetched data from database:', data);
  res.json(data);
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await listenDepositeds(db);
});
