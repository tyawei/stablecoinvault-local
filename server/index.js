// 启动一个 express 服务，监听3001端口；

const express = require('express');
const db = require('./src/db');
const { queryDepositeds } = require('./src/data');

const { getLogsDeposited } = require('./src/getEventLogsFromBlocks')
const { listenDepositeds } = require('./src/listenerContractOn');

// // 监听 usdt 代币交易，放在另一个项目 listenTransfer.git
// const { listenTokenTransfer } = require('./src/listenerWsProviderOn')
// const { multipleTransaction } = require('./src/transfer')

// 后续：
// 1. listenTokenTransfer 替代 listenerContractOn，前者补全入 PG 库的逻辑
// 2. 在 listenTokenTransfer 的 wsProvider.on 补充 websocket监听，并提供API
// 3. 定时任务有两个：
//    对账PG库和链上日志2000个区块的数据，遗漏数据补充入PG库；
//    对账graph子图数据和链上日志2000个区块的数据，子图有遗漏、无遗漏但核心字段值不匹配（from/to/value)、子图多余脏数据等，可以告警


const app = express();
const port = 3001;

app.use(express.json());

app.get('/api/graph-deposits', async (req, res) => {
  // 查询子图历史数据
  const data = await queryDepositeds(db);
  console.log('Fetched data from database:', data);
  res.json(data);
});


app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await listenDepositeds();
  // 拉取1000个区块，获取 Deposited 合约event 记录
  await getLogsDeposited(0, 999)

});
