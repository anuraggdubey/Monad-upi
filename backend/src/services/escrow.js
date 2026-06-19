/**
 * PayAgent — Escrow Service
 * 
 * Handles all smart contract interactions for the escrow lifecycle.
 * Falls back to mock mode if no blockchain connection is available.
 */

import { ethers } from "ethers";
import { contracts, wallet } from "../config/blockchain.js";

// Track mock escrow IDs when running without blockchain
let mockEscrowCounter = 0;

/**
 * Create an escrow on-chain (or mock it)
 */
async function createOnChainEscrow(userAddress, agentId, amountUSDC, taskDescription, upiTransactionId) {
  const amount = ethers.parseUnits(amountUSDC.toString(), 6); // USDC has 6 decimals
  const taskHash = ethers.keccak256(ethers.toUtf8Bytes(taskDescription));
  const taskURI = `ipfs://mock/${Date.now()}`; // In production, upload to IPFS
  const deadline = 24 * 60 * 60; // 24 hours in seconds

  if (contracts.escrow && wallet) {
    try {
      // Real on-chain escrow creation
      console.log(`   ⛓️  Creating on-chain escrow: agent=${agentId}, amount=${amountUSDC} USDC`);

      const tx = await contracts.escrow.createEscrow(
        userAddress,
        agentId,
        amount,
        taskHash,
        taskURI,
        upiTransactionId,
        deadline
      );
      const receipt = await tx.wait();
      
      // Extract escrow ID from event
      const event = receipt.logs.find(
        (log) => {
          try {
            return contracts.escrow.interface.parseLog(log)?.name === "EscrowCreated";
          } catch { return false; }
        }
      );
      
      const parsedEvent = contracts.escrow.interface.parseLog(event);
      const escrowId = parsedEvent.args.escrowId.toString();

      console.log(`   ✅ Escrow created: ID=${escrowId}, tx=${receipt.hash}`);

      // Now lock funds
      const fundTx = await contracts.escrow.escrowFunds(escrowId);
      const fundReceipt = await fundTx.wait();
      console.log(`   ✅ Funds escrowed: tx=${fundReceipt.hash}`);

      return {
        escrowId: Number(escrowId),
        createTxHash: receipt.hash,
        fundTxHash: fundReceipt.hash,
        onChain: true,
      };
    } catch (err) {
      console.error("   ❌ On-chain escrow failed:", err.message);
      console.log("   ⚠️  Falling back to mock escrow");
    }
  }

  // Mock escrow (when no blockchain connection)
  mockEscrowCounter++;
  return {
    escrowId: mockEscrowCounter,
    createTxHash: `0xmock_create_${Date.now().toString(16)}`,
    fundTxHash: `0xmock_fund_${Date.now().toString(16)}`,
    onChain: false,
  };
}

/**
 * Release payment to agent on-chain
 */
async function releaseOnChainPayment(escrowId) {
  if (contracts.escrow && wallet) {
    try {
      console.log(`   ⛓️  Releasing payment for escrow ${escrowId}...`);
      const tx = await contracts.escrow.releasePayment(escrowId);
      const receipt = await tx.wait();
      console.log(`   ✅ Payment released: tx=${receipt.hash}`);
      return { txHash: receipt.hash, onChain: true };
    } catch (err) {
      console.error("   ❌ On-chain release failed:", err.message);
    }
  }

  return {
    txHash: `0xmock_release_${Date.now().toString(16)}`,
    onChain: false,
  };
}

/**
 * Submit delivery on behalf of agent (for mock flow)
 */
async function submitMockDelivery(escrowId) {
  if (contracts.escrow && wallet) {
    try {
      // In a real flow, the agent would call this directly
      // For MVP demo, backend simulates it
      const deliveryURI = `ipfs://mock-delivery/${escrowId}/${Date.now()}`;
      
      // First start work
      const startTx = await contracts.escrow.startWork(escrowId);
      await startTx.wait();
      
      // Then submit delivery
      const deliveryTx = await contracts.escrow.submitDelivery(escrowId, deliveryURI);
      const receipt = await deliveryTx.wait();
      
      return { txHash: receipt.hash, deliveryURI, onChain: true };
    } catch (err) {
      console.error("   ❌ On-chain delivery failed:", err.message);
    }
  }

  return {
    txHash: `0xmock_delivery_${Date.now().toString(16)}`,
    deliveryURI: `ipfs://mock-delivery/${escrowId}/${Date.now()}`,
    onChain: false,
  };
}

/**
 * Get escrow details from chain
 */
async function getOnChainEscrow(escrowId) {
  if (contracts.escrow) {
    try {
      const escrow = await contracts.escrow.getEscrow(escrowId);
      return {
        id: Number(escrow.id),
        user: escrow.user,
        agentId: Number(escrow.agentId),
        agentWallet: escrow.agentWallet,
        amount: ethers.formatUnits(escrow.amount, 6),
        platformFee: ethers.formatUnits(escrow.platformFee, 6),
        agentAmount: ethers.formatUnits(escrow.agentAmount, 6),
        status: ["Pending", "Escrowed", "InProgress", "Delivered", "Completed", "Disputed", "Refunded", "Cancelled"][Number(escrow.status)],
        deliveryURI: escrow.deliveryURI,
        onChain: true,
      };
    } catch (err) {
      console.error("   ❌ Failed to get on-chain escrow:", err.message);
    }
  }
  return null;
}

export {
  createOnChainEscrow,
  releaseOnChainPayment,
  submitMockDelivery,
  getOnChainEscrow,
};
