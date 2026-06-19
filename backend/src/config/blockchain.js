/**
 * PayAgent Backend — Blockchain Configuration
 * 
 * Sets up ethers.js provider and contract instances for Monad testnet.
 * Reads deployed contract addresses from ../contracts/deployed-addresses.json
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Provider Setup ──────────────────────────────────────────────

const MONAD_RPC = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/";
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// ── Wallet (Treasury) ───────────────────────────────────────────

let wallet = null;
if (process.env.PRIVATE_KEY) {
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

// ── Contract ABIs (minimal for what we need) ────────────────────

const ESCROW_ABI = [
  "function createEscrow(address _user, uint256 _agentId, uint256 _amount, bytes32 _taskHash, string _taskURI, string _upiTransactionId, uint256 _deadline) returns (uint256)",
  "function escrowFunds(uint256 _escrowId)",
  "function startWork(uint256 _escrowId)",
  "function submitDelivery(uint256 _escrowId, string _deliveryURI)",
  "function releasePayment(uint256 _escrowId)",
  "function raiseDispute(uint256 _escrowId, string _reason)",
  "function autoRefund(uint256 _escrowId)",
  "function submitFeedback(uint256 _escrowId, int128 _score, uint8 _decimals, string _tags, string _feedbackURI)",
  "function getEscrow(uint256 _escrowId) view returns (tuple(uint256 id, address user, uint256 agentId, address agentWallet, uint256 amount, uint256 platformFee, uint256 agentAmount, bytes32 taskHash, string taskURI, uint256 createdAt, uint256 deadline, uint256 deliveredAt, uint8 status, string upiTransactionId, string deliveryURI, bool userConfirmed, bool agentConfirmed))",
  "function getUserEscrows(address _user) view returns (uint256[])",
  "function getAgentEscrows(uint256 _agentId) view returns (uint256[])",
  "function getTotalEscrows() view returns (uint256)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed user, uint256 indexed agentId, uint256 amount, string upiTransactionId)",
  "event FundsEscrowed(uint256 indexed escrowId, uint256 amount, uint256 platformFee)",
  "event AgentStarted(uint256 indexed escrowId, uint256 indexed agentId, uint256 timestamp)",
  "event DeliverySubmitted(uint256 indexed escrowId, string deliveryURI, uint256 timestamp)",
  "event PaymentReleased(uint256 indexed escrowId, address indexed agentWallet, uint256 agentAmount, uint256 platformFee)",
];

const IDENTITY_ABI = [
  "function registerAgent(address _wallet, string _uri) returns (uint256)",
  "function isRegistered(uint256 _agentId) view returns (bool)",
  "function isActive(uint256 _agentId) view returns (bool)",
  "function getAgentWallet(uint256 _agentId) view returns (address)",
  "function totalAgents() view returns (uint256)",
  "event AgentRegistered(uint256 indexed agentId, address indexed wallet, string uri)",
];

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function faucet()",
  "function decimals() view returns (uint8)",
];

const REPUTATION_ABI = [
  "function getAverageScore(uint256 _agentId) view returns (int256)",
  "function getFeedbackCount(uint256 _agentId) view returns (uint256)",
  "function getAllFeedback(uint256 _agentId) view returns (tuple(address reviewer, int128 score, uint8 decimals, string tags, string feedbackURI, bytes32 contentHash, uint256 timestamp)[])",
];

// ── Load Deployed Addresses ─────────────────────────────────────

let contracts = {
  escrow: null,
  identity: null,
  reputation: null,
  usdc: null,
  x402: null,
};

let addresses = {};

function loadContracts() {
  try {
    const addressPath = path.join(__dirname, "..", "..", "..", "contracts", "deployed-addresses.json");
    if (fs.existsSync(addressPath)) {
      addresses = JSON.parse(fs.readFileSync(addressPath, "utf-8"));
      const c = addresses.contracts;

      if (wallet) {
        contracts.escrow = new ethers.Contract(c.PayAgentEscrow, ESCROW_ABI, wallet);
        contracts.identity = new ethers.Contract(c.ERC8004IdentityRegistry, IDENTITY_ABI, wallet);
        contracts.reputation = new ethers.Contract(c.ERC8004ReputationRegistry, REPUTATION_ABI, wallet);
        contracts.usdc = new ethers.Contract(c.MockUSDC, USDC_ABI, wallet);
      }
      console.log("   ⛓️  Contracts loaded from deployed-addresses.json");
      return true;
    }
  } catch (err) {
    console.warn("   ⚠️  Could not load contract addresses:", err.message);
  }
  console.warn("   ⚠️  Running in mock mode (no blockchain connection)");
  return false;
}

// ── Exports ─────────────────────────────────────────────────────

export {
  provider,
  wallet,
  contracts,
  addresses,
  loadContracts,
  ESCROW_ABI,
  IDENTITY_ABI,
  USDC_ABI,
};
