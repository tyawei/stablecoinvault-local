// ethers 监听链上事件

const { ethers } = require("ethers");
const dotenv = require('dotenv');
dotenv.config();

const abi = require("../../abis/StablecoinVault.json")
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

// 查询graph子图节点历史数据；如果本地服务想要把最新监听数据和历史数据同时返给前端，
// 需要把历史数据和最新监听到数据整合在一起，再一同返回
// 因为最新监听链上事件产生的数据，不一定立刻被子图索引了。
const { fetchDepositeds } = require('./subgraph');
const db = require("./db");

async function listenDepositeds() {
    contract.on("Deposited", async (orderId, user, token, amount, maturityTime, contractEventPayload) => {
        // 这里try catch 可以防止 ethers.js 报错 @TODO TypeError: results is not iterable
        // 这个报错是因为 ethers.js 在处理事件时，可能会遇到一些不可预料的情况，导致无法正确解析事件数据，从而抛出异常。
        // github 上这个bug还处于open状态（2023年），有人建议在catch中捕获以上报错，重新建立监听，但是需要手动处理数据补偿防止丢失
        // AI给出的优化建议，是在 hardhat 本地启用 url: "ws://127.0.0.1:8454"，通过const provider = new ethers.WebSocketProvider(wsUrl)
        // 再const filter = contract.filters.Deposited();provider.on(filter, async (log) => ...) 处理监听
        try {
            console.log('Depositeds_data===', orderId, user, token, amount, maturityTime, contractEventPayload)
            const { blockNumber, blockHash, transactionHash, } = contractEventPayload.log || {};   
            const block = await contractEventPayload.getBlock();
            console.log('block===', block)
            const blockTimestamp = block ? block.timestamp : null;

            const payload = {
                order_id: orderId ? orderId.toString() : null,
                user_address: user,
                token_address: token,
                amount: amount ? amount.toString() : null,
                maturity_time: maturityTime !== undefined ? maturityTime.toString() : null,
                block_number: blockNumber ? blockNumber.toString() : null,
                tx_hash: transactionHash ? transactionHash.toString() : null,
                block_timestamp: blockTimestamp ? blockTimestamp.toString() : null
            }

            await db.query(
                `INSERT INTO depositeds (order_id, user_address, token_address, amount, maturity_time, block_number, block_timestamp, tx_hash) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, 
                [
                    payload.order_id,
                    payload.user_address,
                    payload.token_address,
                    payload.amount,
                    payload.maturity_time,
                    payload.block_number,
                    payload.block_timestamp,
                    payload.tx_hash
                ]
            );

            const historyData = await fetchDepositeds(db);
            console.log('historyData===', historyData)
        } catch(e) {
            console.error('Error processing Deposited event:', e);
        }
    })

}

module.exports = {
    listenDepositeds
};