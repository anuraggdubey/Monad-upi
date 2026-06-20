import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Make sure you have set a PRIVATE_KEY in your .env file.");
  }
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║          PayAgent — Deploying to Monad Testnet          ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Deployer: ${deployer.address}  ║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} MON\n`);

  // ── 1. Deploy MockUSDC ────────────────────────────────────────────
  console.log("1/5  Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log(`     ✅ MockUSDC deployed at: ${usdcAddr}`);

  // ── 2. Deploy ERC8004 Identity Registry ───────────────────────────
  console.log("2/5  Deploying ERC8004IdentityRegistry...");
  const IdentityRegistry = await hre.ethers.getContractFactory("ERC8004IdentityRegistry");
  const identity = await IdentityRegistry.deploy();
  await identity.waitForDeployment();
  const identityAddr = await identity.getAddress();
  console.log(`     ✅ Identity Registry deployed at: ${identityAddr}`);

  // ── 3. Deploy ERC8004 Reputation Registry ─────────────────────────
  console.log("3/5  Deploying ERC8004ReputationRegistry...");
  const ReputationRegistry = await hre.ethers.getContractFactory("ERC8004ReputationRegistry");
  const reputation = await ReputationRegistry.deploy(identityAddr);
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log(`     ✅ Reputation Registry deployed at: ${reputationAddr}`);

  // ── 4. Deploy X402 Payment Handler ────────────────────────────────
  console.log("4/5  Deploying X402PaymentHandler...");
  const X402Handler = await hre.ethers.getContractFactory("X402PaymentHandler");
  const x402 = await X402Handler.deploy(usdcAddr);
  await x402.waitForDeployment();
  const x402Addr = await x402.getAddress();
  console.log(`     ✅ X402 Payment Handler deployed at: ${x402Addr}`);

  // ── 5. Deploy PayAgentEscrow ──────────────────────────────────────
  console.log("5/5  Deploying PayAgentEscrow...");
  const PayAgentEscrow = await hre.ethers.getContractFactory("PayAgentEscrow");
  const escrow = await PayAgentEscrow.deploy(
    usdcAddr,
    identityAddr,
    reputationAddr,
    deployer.address, // Treasury = deployer for testnet
    deployer.address  // Dispute resolver = deployer for testnet
  );
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log(`     ✅ PayAgentEscrow deployed at: ${escrowAddr}`);

  // ── 6. Post-deployment Setup ──────────────────────────────────────
  console.log("\n📋 Post-deployment setup...");

  // Authorize escrow contract as a PayAgent
  const authTx = await escrow.setAuthorizedPayAgent(deployer.address, true);
  await authTx.wait();
  console.log("     ✅ Deployer authorized as PayAgent");

  // Approve escrow contract to spend treasury's USDC
  const approveTx = await usdc.approve(escrowAddr, hre.ethers.MaxUint256);
  await approveTx.wait();
  console.log("     ✅ USDC approved for escrow contract");

  // ── Summary ───────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                 DEPLOYMENT COMPLETE                     ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  MockUSDC:          ${usdcAddr}  ║`);
  console.log(`║  Identity Registry: ${identityAddr}  ║`);
  console.log(`║  Reputation:        ${reputationAddr}  ║`);
  console.log(`║  X402 Handler:      ${x402Addr}  ║`);
  console.log(`║  Escrow:            ${escrowAddr}  ║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Write addresses to a JSON file for backend/frontend consumption
  const addresses = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployer: deployer.address,
    contracts: {
      MockUSDC: usdcAddr,
      ERC8004IdentityRegistry: identityAddr,
      ERC8004ReputationRegistry: reputationAddr,
      X402PaymentHandler: x402Addr,
      PayAgentEscrow: escrowAddr,
    },
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log(`\n📄 Addresses saved to: deployed-addresses.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
