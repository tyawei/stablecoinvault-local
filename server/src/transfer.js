// 构造交易：获取余额，授权，估计gas并动态上浮，调用transfer，交易失败重试
// 尝试批量交易

const {ethers} = require('ethers')
const dotEnv = require('dotenv')
dotEnv.config()

const usdtAbi = [
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// const ALCHEMY_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY // sepolia 测试网，获取 eth 测试币
const provider = new ethers.JsonRpcProvider(process.env.INFURA_RPC_URL)

// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)
const usdt = new ethers.Contract(process.env.SEPOLIA_USDT, usdtAbi, wallet)

async function multipleTransaction() {
    const RETRY = 3  // transfer 失败重试三次 
    // 获取最新一个正在交易中的交易 nonce，后续交易nonce + 1
    let nonce = await provider.getTransactionCount(wallet.address, 'pending')    

    const excuteTransfer = async (to, amount, retry = RETRY) => {
        for (let i = 0 ; i < retry; i++) {
            try {
                nonce++

                const decimals = await usdt.decimals()

                if (typeof amount !== 'bigint') {
                    amount = ethers.parseUnits(amount, decimals)
                }

                //token余额和原生ETH余额
                const balance = await usdt.balanceOf(wallet.address)
                // balance = ethers.formatUnits(balance, decimals) 

                if (balance < amount) {
                    throw new Error("Insufficient usdt balance")
                }

                let ethBalance = await provider.getBalance(wallet.address)
                ethBalance = ethers.formatEther(ethBalance)
                ethBalance = isNaN(ethBalance) ? 0 : Number(ethBalance)
                if (ethBalance < 0.01) {
                    throw new Error("Insufficient ETH balance for gas")
                }

                //  gas估计
                const curGas = await usdt.transfer.estimateGas(to, amount)
                const gasLimit = (curGas * 120n) / 100n

                // 获取单笔gas最大值，单笔gas优先费
                let { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData()
                maxFeePerGas = (maxFeePerGas * 120n) / 100n
                maxPriorityFeePerGas = (maxPriorityFeePerGas * 125n) / 100n

                // console.log(
                //     'balance===', balance, '\n',
                //     'eth===', ethBalance, '\n',
                //     'curGas===', curGas, '\n',
                //     'feeData===', maxFeePerGas, maxPriorityFeePerGas
                // )

                // 执行 transfer
                const tx = await usdt.transfer(to, amount, {
                    nonce, gasLimit, maxFeePerGas, maxPriorityFeePerGas
                })

                const results = await tx.wait(1)

                console.log('results===', results)

                break;

            } catch(e) {
                console.log('transfer_error===', e)
                await new Promise(r => { setTimeout(r, 1000) })
            }
        }

    }

    await excuteTransfer(process.env.RECEIVE_ADDRESS, '1.1')
    await new Promise(r => { setTimeout(r, 5000) })
    await excuteTransfer(process.env.RECEIVE_ADDRESS, '2.7')

}

module.exports = {
    multipleTransaction
}