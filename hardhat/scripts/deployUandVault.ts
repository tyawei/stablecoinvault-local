import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create({
    network: "localhost",
  });

  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address, "; 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  console.log("正在部署测试 ERC20 代币到 localhost，并铸造给自己10万个 ...");
  const tokenContract = await ethers.deployContract("UToken", ["USD Coin", "USDC"]);
  await tokenContract.waitForDeployment();
  const tokenAddress = await tokenContract.getAddress();
  console.log("测试代币地址:", tokenAddress);

  console.log("正在部署 stablecoinvault ...");
  const governanceAddress = "0x953fa8fbfb5f9589b2feb84ba0d941eaf6abe4e1";
  const stablecoinVault = await ethers.deployContract("StablecoinVault", [governanceAddress]);
  await stablecoinVault.waitForDeployment();
  const stablecoinVaultAddress = await stablecoinVault.getAddress();
  console.log("StablecoinVault 地址:", stablecoinVaultAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
