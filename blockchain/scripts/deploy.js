const { ethers, network, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  const networkInfo = await ethers.provider.getNetwork();
  const chainId = Number(networkInfo.chainId);

  console.log("==================================================");
  console.log("Deploying DecentraCertRegistry contract");
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
  console.log("==================================================");

  const DecentraCertRegistry = await ethers.getContractFactory("DecentraCertRegistry");
  const contract = await DecentraCertRegistry.deploy(deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ DecentraCertRegistry successfully deployed to: ${contractAddress}`);

  // Fetch full contract artifact for ABI
  const artifact = await artifacts.readArtifact("DecentraCertRegistry");

  const exportData = {
    address: contractAddress,
    network: networkName,
    chainId: chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: artifact.abi,
  };

  // Target paths for backend and frontend configurations
  const backendConfigDir = path.resolve(__dirname, "../../backend/src/config");
  const frontendConfigDir = path.resolve(__dirname, "../../frontend/src/config");

  for (const dir of [backendConfigDir, frontendConfigDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const targetFile = path.join(dir, "contractArtifact.json");
    fs.writeFileSync(targetFile, JSON.stringify(exportData, null, 2), "utf8");
    console.log(`📄 Saved contract artifact to: ${targetFile}`);
  }

  console.log("==================================================");
  console.log("Deployment completed successfully.");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
