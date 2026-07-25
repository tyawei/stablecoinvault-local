// 使用 WebSocketProvider.on 监听合约 deposited 事件
// 适用于多合约、多事件、数据实时性要求高的 企业项目场景，比 contract.on更好

const { ethers } = require('ethers')
const dotEnv = require('dotenv')
dotEnv.config()

const abi = [
  "event Deposited(uint256 indexed orderId, address indexed user, address indexed token, uint256 amount, uint256 maturityTime)",
  "event GovernanceUpdated(address indexed oldGovernance, address indexed newGovernance)"
]
const usdtAbi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
]

const iface = new ethers.Interface(abi)
const tokenIface = new ethers.Interface(usdtAbi)

// ws_rpc_url = ws://127.0.0.1:8545
const wsProvider = new ethers.WebSocketProvider(process.env.WS_RPC_URL)

async function listenProviderOn() {

    const depositedTopic = iface.getEvent('Deposited').topicHash
    const goverUpdatedTopic = iface.getEvent('GovernanceUpdated').topicHash

    const transferTopic = tokenIface.getEvent('Transfer').topicHash

    // wsProvider._network.ensAddress = null

    wsProvider.on({
        address: process.env.CONTRACT_ADDRESS,  // 这里尝试[普通合约, 代币合约]，但是出先ensAddress 报错，或者network报错；不同合约尽量分开监听
        topics: [[depositedTopic, goverUpdatedTopic]]       // 多个事件必须二维数组
    }, log => {
        // 多个事件时，log还是一个一个输出
        // console.log('logs===', log)
        const parsed = iface.parseLog(log)
        console.log('parsed===', parsed)
        if (parsed.name === 'Deposited') {
            const [orderId, user, token, amount, maturityTime] = parsed.args
            const results = {
                orderId: orderId.toString(),
                user, token,
                amount: amount.toString(),
                maturityTime: maturityTime.toString()
            }
            console.log('depositeds===', results)

            // await saveDBToDepositeds(results)
        } else if (parsed.name === 'GovernanceUpdated') {
            const [oldGovernance, newGovernance] = parsed.args
            const results = {
                oldGovernance, 
                newGovernance
            }
            console.log('governance===', results)            

            // await saveDBToGoverance(results)
        } 
    })

    // 这里报错：Error: network does not support ENS
    // 可能是由于我本地部署 token 的rpc_url 不太合规，估计需要正式网rpc
    wsProvider.on(
    {
      address: process.env.TOKEN_ADDRESS,
      topics: [transferTopic]
    }, async log => {
        console.log("transfer_log", log)
    })
}

module.exports = {
    listenProviderOn
}