
1. 需要先使用 hardhat建项目（这里只列出了关键几个文件）；
2. 建好项目后，先 npx hardhat node 开启 hardhat本地节点，获取测试账户， 再 npx hardhat run scripts/deployUandVault.ts --network localhost 部署合约， 再 node scripts/handleDeposit.ts，本地 localhost 网络就有了 deposit 函数的事件记录数据