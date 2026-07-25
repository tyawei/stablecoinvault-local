// 通过 provider.getLogs 获取ERC20代币转账 Transfer 事件数据

const { ethers } = require("ethers");
const dotEnv = require("dotenv")
dotEnv.config()

const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals()  external view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]
// 较为消耗性能，避免写在遍历中
const iface = new ethers.Interface(tokenABI);

// 如果是公共RPC，尽量不要频繁请求，且请求区块保持在不超过1000，否则可能被封、卡顿
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)

async function listenLogTransfer() {

    // const token = new ethers.Contract(process.env.TOKEN_ADDRESS, tokenABI, provider)
    // const balance = await token.balanceOf(process.env.USER_ADDRESS)
    // const decimals = await token.decimals()
    // console.log('balance===', balance, '; decimals===', decimals)
    // const bal = ethers.formatUnits(balance, decimals)

    const blockNumber = await provider.getBlockNumber()
    const logs = await provider.getLogs({
        address: process.env.process.env.TOKEN_ADDRESS,
        fromBlock: blockNumber - 100,
        toBlock: blockNumber,
        // topics: [] // 用于合约事件log
    })

    logs.forEach(log => {
        console.log('log===', log)

        const parsed = iface.parseLog(log)
        console.log('parsed===', parsed)
        if (parsed.name === 'Transfer') {
            const { from = '', to = '', value } = parsed.args
            const { transactionHash = '' } = log
            const val = value ? value.toString() : ''

            // 保存到数据库
            await saveToTransfer(from, to, value, transactionHash)
        }

    })
    



}

module.exports = {
    listenLogTransfer
}