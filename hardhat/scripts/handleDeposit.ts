import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create({
    network: "localhost",
  });

  const [deployer] = await ethers.getSigners();

  // deployUandVault.ts 部署合约后填在这里
  const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  const stablecoinVaultAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  const stablecoinVault = await ethers.getContractAt("StablecoinVault", stablecoinVaultAddress, deployer);

  console.log("配置 StablecoinVault 支持的代币...");
  const token = await new ethers.Contract(tokenAddress, [
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ], deployer);
  const decimals = await token.decimals();  
  console.log('代币精度:', decimals);
  const minDepositAmount = ethers.parseUnits("1", decimals); 
  await stablecoinVault.setTokenConfig(tokenAddress, true, minDepositAmount);

  console.log("授权 StablecoinVault 转走代币...");
  const amount = ethers.parseUnits("1.1", decimals);
  const approveTx = await token.approve(stablecoinVaultAddress, amount);
  await approveTx.wait();

  console.log("执行存款...");
  const tx = await stablecoinVault.deposit(tokenAddress, amount);
  await tx.wait();
  console.log("存款成功，交易哈希:", tx.hash);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
