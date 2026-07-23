# 使用node.js获取graph子图/监听合约事件记录的数据，提供API

本项目通过本地localhost部署Solidity合约，通过node.js监听链上事件的数据产生，并使用graphQL获取本地graph子图数据，将历史数据存入Postgresql数据库，为前端提供链上数据API（由于 graph studio 的API 和 正式 IPFS 节点请求不通，本项目都在本地服务下进行）

## 运行项目的准备

安装 ipfs、docker 桌面端和 postgresql 数据库，开启梯子，将梯子的代理链接相关配置（比如 http://127.0.0.1:7993、http://127.0.0.1:7993、localhost,127.0.0.1,.local）配置在 docker 桌面端齿轮图标设置页面中的 resource/proxies/manual configuration 下的三个输入框中

## 运行教程

1. 首先建立 hardhat 项目，先运行 npx hardhat node 开启本地节点，同时获取测试账户，再将本项目中 hardhat 目录中的示例合约 StablecoinVault.sol、UToken.sol 部署到 localhost（hardhat/readme.md有简要说明），获取到已部署的合约地址及其ABI文件 StablecoinVault.json；
2. 全局安装 @graphprotocol/graph-cli，根据合约地址，建立 graph 项目：graph init --abi D:\example\artifacts\contracts\StablecoinVault.sol\StablecoinVault.json --network mainnet --from-contract 0xabcd1234.... stablecoinvault-local。项目生成后，基本就自动根据合约及event事件完成了代码相关逻辑；
3. 完成docker桌面端设置后，在 graph 项目终端开启docker（项目中预置了docker-compose.yml，运行docker compose up -d），运行ipfs（初始化ipfs init、ipfs daemon）。再依次运行 npm run codegen、npm run build、npm run create-local、npm run deploy-local。如果终端出现报错：× HTTP error deploying the subgraph ETIMEOUT / × HTTP error deploying the subgraph ECONNRESET，通常是docker梯子没配置对、graph 本地有部署过但是改了代码后没清除旧的服务（运行 npm run remove-local再依次运行以上命令，或者docker桌面端删除旧的运行项目再重启）等。运行成功则如下log：
    ......
    √ Upload subgraph to IPFS
    Build completed: QmZC6G6hC4onfS9JVN4vbW8TDkGeDWWzjNtdCxasvCBogA
    Deployed to http://localhost:8000/subgraphs/name/stablecoinvault-local/graphql
    Subgraph endpoints:
    Queries (HTTP):     http://localhost:8000/subgraphs/name/stablecoinvault-local
以上 http://localhost:8000/subgraphs/name/stablecoinvault-local/graphql 是本地 graph 节点服务的可视化页面，可以输入 graphQL 语句查询子图索引合约event的数据；
4. 在 .env 文件中配置：
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...
SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/stablecoinvault-local
DB_URL=postgresql://管理员名称:密码@localhost:5432/stablecoinvault
配置完成后，运行 node server/index.js 开启node服务。可以再在 hardhat 项目运行 node scripts/handleFunc.ts 执行相关函数以触发 event 在node端看终端输出
