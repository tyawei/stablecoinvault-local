// 通过 provider.getLogs 获取合约的 Deposited 事件数据

const { ethers } = require("ethers");
const dotEnv = require("dotenv")
dotEnv.config()

const abi = [
  "event Deposited(uint256 indexed orderId, address indexed user, address indexed token, uint256 amount, uint256 maturityTime)",
]
// 较为消耗性能，避免写在遍历中
const iface = new ethers.Interface(abi);

// 如果是公共RPC，尽量不要频繁请求，且请求区块保持在不超过1000，否则可能被封、卡顿
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)

// 在startBlock和endBlock之间每次只拉取 blocks 个区块的日志记录
// 这里只是示例，通常一次拉取区块不要过多，考虑性能按数量分段拉取
const blocks = 3
async function getLogsDeposited(startBlock, endBlock) {
    // {type, inputs: [ParamType: {name: orderId, indexed: true}...], name, topicHash}
    const eventTopic = iface.getEvent('Deposited').topicHash

    let curBlockIdx = startBlock;

    while (curBlockIdx <= endBlock) {
        // 第一个区块从0开始，这里需-1
        const curEnd = Math.min(curBlockIdx + blocks - 1, endBlock)

        const logs = await provider.getLogs({
            address: process.env.CONTRACT_ADDRESS,
            fromBlock: curBlockIdx,
            toBlock: curEnd,
            topics: [eventTopic]
        })

        logs.forEach(log => {
            // console.log('log===', log)
            const { blockHash, blockNumber, transactionHash } = log

            const parsed = iface.parseLog(log)
            // console.log('parsed===', parsed)
            if (parsed.name === 'Deposited') {
                const [orderId, user, token, amount, maturityTime] = parsed.args
                const results = {
                    orderId: orderId.toString(),
                    user, token,
                    amount: amount.toString(),
                    maturityTime: maturityTime.toString()
                }
                console.log('results===', results)

                // await saveDBToDepositeds(results)
            }
        })

        curBlockIdx += blocks;

        // 每隔100毫秒，拉取 blocks 个区块的日志
        await new Promise(r => { setTimeout(r, 100) })

    }


}

module.exports = {
    getLogsDeposited
}