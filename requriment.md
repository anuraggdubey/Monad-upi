# PayAgent: UPI-to-Agent Bridge on Monad

## Project Overview

**PayAgent** is a middleware bridge that enables 600M+ Indian UPI users to access the global AI agent economy on Monad without ever touching cryptocurrency directly. Users pay via familiar UPI apps (GPay, PhonePe, Paytm), while the backend seamlessly converts, escrows, and settles payments using ERC-8004 agent identity, x-402 micropayments, and Monad's high-performance infrastructure.

**Hackathon:** Monad Blitz Mumbai V3 — The Agent Economy  
**Date:** June 20, 2026 (1-Day Build)  
**Tech Stack:** Monad (L1), Solidity, ERC-8004, x-402, Razorpay UPI, Node.js/Python, React

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Core Features](#3-core-features)
4. [System Architecture](#4-system-architecture)
5. [Smart Contract Design](#5-smart-contract-design)
6. [User Flow](#6-user-flow)
7. [Agent Flow](#7-agent-flow)
8. [Payment Flow](#8-payment-flow)
9. [Data Models](#9-data-models)
10. [API Specification](#10-api-specification)
11. [Frontend Design](#11-frontend-design)
12. [Security Considerations](#12-security-considerations)
13. [1-Day Build Plan](#13-1-day-build-plan)
14. [Resources & References](#14-resources--references)

---

## 1. Problem Statement

### 1.1 The UPI-Crypto Chasm
India has **600M+ UPI users** processing 14B+ transactions monthly. UPI is instant, free, and ubiquitous — but it is **closed-loop fiat**. Users cannot:
- Pay an AI agent for analysis or computation
- Buy data feeds or API access in the agent economy
- Participate in machine-to-machine commerce

### 1.2 Crypto Onboarding is Too Complex
Converting UPI to Crypto requires:
- KYC on centralized exchanges
- Bank transfers and waiting periods
- Wallet setup, seed phrase management
- Understanding gas fees and network congestion
**Result:** 15+ steps, 30+ minutes, massive cognitive load. A user wanting to pay Rs.30 for an AI task abandons before starting.

### 1.3 Microtransactions Are Impossible on Slow Chains
Agent economies require **thousands of micro-payments daily** ($0.10-$1.00 per interaction). On Ethereum, a $0.10 payment costs $2+ in gas. This fundamentally breaks the agent economy model.

### 1.4 No Trust Layer for Agents
Users cannot verify:
- Whether an agent is legitimate
- The agent's past performance and reputation
- Whether payment will be refunded if the agent fails
There is no escrow, no reputation system, and no dispute resolution for agent services.

### 1.5 Regulatory Uncertainty in India
Indians are wary of crypto due to:
- 1% TDS on every transaction
- 30% flat tax on crypto gains
- RBI's historically hostile stance
- Fear of scams and unregulated platforms

---

## 2. Solution Overview

**PayAgent** is a **UPI-to-Agent Bridge** that abstracts all crypto complexity from the user while running the entire backend on a verifiable, trustless agent economy.

### 2.1 Core Value Proposition
| For Users | For Agents |
|-----------|------------|
| Pay via UPI (GPay, PhonePe, Paytm) in <10 seconds | Receive instant USDC payments via x-402 |
| No wallet setup, no gas fees, no crypto knowledge | Build verifiable reputation via ERC-8004 |
| See prices in Rs. (not ETH or USDC) | Access 600M+ potential Indian customers |
| Escrow protection — pay only when service delivers | No chargebacks, instant settlement |

### 2.2 How It Works (High Level)
```
User --(UPI Payment)--> PayAgent Bridge --(x-402 / USDC)--> Monad Agent Economy
  ^                                                          |
  |________________(Service Delivery)________________________|
```

### 2.3 Why Monad?
| Feature | Why It Matters for PayAgent |
|---------|---------------------------|
| **10,000 TPS** | Thousands of agent micro-transactions per second without congestion |
| **1-second finality** | Users get instant confirmation; agents get instant payment |
| **Near-zero fees** | A Rs.10 ($0.12) task is economically viable |
| **Full EVM compatibility** | Deploy Solidity contracts directly, use existing tooling |
| **Parallel execution** | Multiple users and agents transact simultaneously |

---

## 3. Core Features

### 3.1 User-Facing Features

**F1: UPI Payment Integration**
- Generate dynamic UPI QR codes and UPI IDs
- Support all major UPI apps: GPay, PhonePe, Paytm, BHIM, Amazon Pay
- Real-time payment confirmation via webhooks
- Prices displayed in Rs. INR (converted from USDC at real-time rates)

**F2: Agent Service Marketplace**
- Browse agents by category: Data Analysis, Translation, Code Review, Market Sentiment, Image Generation
- Each agent card shows: name, description, price in Rs., reputation score, tasks completed
- Filter by: price range, category, reputation, delivery time

**F3: Order Tracking & History**
- Real-time status: Pending -> Paid -> Escrowed -> In Progress -> Delivered -> Completed
- View past orders with transaction hashes on Monad testnet
- Download deliverables (reports, translations, code, etc.)

**F4: Dispute & Refund**
- Raise dispute if agent fails to deliver
- Time-locked automatic refund if agent does not respond within deadline
- Admin/DAO-based dispute resolution (MVP: manual)

### 3.2 Agent-Facing Features

**F5: Agent Registration (ERC-8004)**
- Mint ERC-721 identity NFT on Monad
- Submit agent card JSON with: name, description, capabilities, endpoint, pricing
- Link wallet address for receiving x-402 payments
- Build reputation over time via on-chain feedback

**F6: x-402 Payment Reception**
- Agents expose x-402 compliant endpoints
- Automatically detect escrowed payments and begin execution
- Receive USDC instantly upon delivery confirmation
- No API keys, no subscriptions, no manual invoicing

**F7: Reputation Dashboard**
- View reputation score, feedback history, success rate
- Track earnings in USDC and equivalent INR
- Analytics: tasks completed, average rating, peak hours

### 3.3 Platform Features

**F8: Escrow Smart Contract**
- Lock USDC when UPI payment is confirmed
- Release to agent upon delivery verification
- Auto-refund to treasury if deadline expires

**F9: Price Oracle & Conversion**
- Real-time INR/USDC exchange rate
- Price displayed in Rs., settled in USDC
- Slippage protection for conversion

**F10: Notification System**
- Webhook-based real-time updates
- SMS/Email notifications for payment confirmation and delivery
- In-app notification center

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
CLIENT LAYER
  - Web App (React)
  - Mobile App (Optional)
  - Agent SDK (Python/JS)
  - Admin Dashboard

API GATEWAY
  - Express.js / FastAPI Server
  - Rate Limiting, Auth, Validation

SERVICE LAYER
  - Payment Service (Razorpay integration)
  - Escrow Service (Smart contract interaction)
  - Agent Service (Registration, discovery, reputation)
  - Notification Service (WebSocket, SMS, Email)

BLOCKCHAIN LAYER (Monad)
  - PayAgentEscrow Contract
  - ERC-8004 Identity Registry
  - ERC-8004 Reputation Registry
  - x-402 Payment Handler
  - USDC Token (ERC-20)

EXTERNAL SERVICES
  - Razorpay (UPI payments)
  - Price Oracle (INR/USDC rate)
  - RPC Provider (Alchemy/QuickNode/Ankr)
  - Indexer (The Graph)
```

### 4.2 Component Descriptions

**Client Layer:**
- Web App: React + Tailwind + Vite for user-facing marketplace
- Agent SDK: Python/Node.js library for agents to integrate x-402 and ERC-8004
- Admin Dashboard: React + shadcn/ui for platform management

**API Gateway:**
- Express.js or FastAPI server with rate limiting, JWT auth, input validation

**Service Layer:**
- Payment Service: UPI link generation, webhook handling, INR/USDC conversion
- Escrow Service: Fund locking, release, refund, dispute management via ethers.js/viem
- Agent Service: Registration, discovery, reputation queries
- Notification Service: Real-time updates via WebSocket, SMS, email

**Blockchain Layer:**
- PayAgentEscrow: Core escrow logic for UPI-backed payments
- ERC-8004 Identity Registry: Agent identity and metadata (ERC-721)
- ERC-8004 Reputation Registry: On-chain feedback and ratings
- x-402 Payment Handler: Payment verification and settlement
- USDC Token: Settlement currency (ERC-20)

**External Services:**
- Razorpay: UPI link generation, payment collection, webhooks
- Price Feed: Chainlink or custom oracle for INR/USDC rate
- RPC: Alchemy, QuickNode, or Ankr for Monad blockchain interaction
- Indexing: The Graph or custom indexer for querying agent data

---

## 5. Smart Contract Design

### 5.1 Contract Architecture

Contracts interact as follows:
- PayAgentEscrow calls ERC-8004 Identity Registry to verify agents
- PayAgentEscrow calls USDC Token for fund transfers
- x-402 Payment Handler verifies signatures and settles payments
- ERC-8004 Reputation Registry stores immutable feedback

### 5.2 PayAgentEscrow.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC8004Identity.sol";
import "./IERC8004Reputation.sol";

contract PayAgentEscrow is ReentrancyGuard, Ownable {

    IERC20 public immutable usdc;
    IERC8004Identity public immutable identityRegistry;
    IERC8004Reputation public immutable reputationRegistry;

    address public payAgentTreasury;
    address public disputeResolver;

    uint256 public platformFeeBps = 250;  // 2.5%
    uint256 public constant MAX_DEADLINE = 7 days;
    uint256 public constant DISPUTE_WINDOW = 3 days;
    uint256 private _escrowIdCounter;

    enum EscrowStatus {
        Pending, Escrowed, InProgress, Delivered, 
        Completed, Disputed, Refunded, Cancelled
    }

    struct Escrow {
        uint256 id;
        address user;
        uint256 agentId;
        address agentWallet;
        uint256 amount;
        uint256 platformFee;
        uint256 agentAmount;
        bytes32 taskHash;
        string taskURI;
        uint256 createdAt;
        uint256 deadline;
        uint256 deliveredAt;
        EscrowStatus status;
        string upiTransactionId;
        string deliveryURI;
        bool userConfirmed;
        bool agentConfirmed;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(address => uint256[]) public userEscrows;
    mapping(uint256 => uint256[]) public agentEscrows;
    mapping(string => uint256) public upiToEscrow;
    mapping(address => bool) public authorizedPayAgents;

    event EscrowCreated(uint256 indexed escrowId, address indexed user, 
                        uint256 indexed agentId, uint256 amount, string upiTransactionId);
    event FundsEscrowed(uint256 indexed escrowId, uint256 amount, uint256 platformFee);
    event AgentStarted(uint256 indexed escrowId, uint256 indexed agentId, uint256 timestamp);
    event DeliverySubmitted(uint256 indexed escrowId, string deliveryURI, uint256 timestamp);
    event PaymentReleased(uint256 indexed escrowId, address indexed agentWallet, 
                          uint256 agentAmount, uint256 platformFee);
    event RefundIssued(uint256 indexed escrowId, address indexed to, uint256 amount);
    event DisputeRaised(uint256 indexed escrowId, address indexed by, string reason);
    event DisputeResolved(uint256 indexed escrowId, bool userWins, uint256 refundAmount);
    event FeedbackSubmitted(uint256 indexed escrowId, uint256 indexed agentId, 
                            int128 score, string tags);

    modifier onlyAuthorized() {
        require(authorizedPayAgents[msg.sender], "Not authorized");
        _;
    }

    modifier onlyDisputeResolver() {
        require(msg.sender == disputeResolver, "Not dispute resolver");
        _;
    }

    modifier escrowExists(uint256 _escrowId) {
        require(_escrowId > 0 && _escrowId <= _escrowIdCounter, "Invalid escrow");
        _;
    }

    constructor(address _usdc, address _identityRegistry, address _reputationRegistry,
                address _treasury, address _disputeResolver) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        identityRegistry = IERC8004Identity(_identityRegistry);
        reputationRegistry = IERC8004Reputation(_reputationRegistry);
        payAgentTreasury = _treasury;
        disputeResolver = _disputeResolver;
        authorizedPayAgents[_treasury] = true;
    }

    function setAuthorizedPayAgent(address _agent, bool _status) external onlyOwner {
        authorizedPayAgents[_agent] = _status;
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee max 10%");
        platformFeeBps = _feeBps;
    }

    function createEscrow(address _user, uint256 _agentId, uint256 _amount,
        bytes32 _taskHash, string calldata _taskURI, string calldata _upiTransactionId,
        uint256 _deadline) external onlyAuthorized returns (uint256) {

        require(_user != address(0), "Invalid user");
        require(_amount > 0, "Amount must be > 0");
        require(bytes(_upiTransactionId).length > 0, "UPI ID required");
        require(upiToEscrow[_upiTransactionId] == 0, "UPI ID already used");
        require(_deadline <= MAX_DEADLINE, "Deadline too long");
        require(identityRegistry.isRegistered(_agentId), "Agent not registered");
        require(identityRegistry.isActive(_agentId), "Agent not active");

        address agentWallet = identityRegistry.getAgentWallet(_agentId);
        require(agentWallet != address(0), "Agent has no wallet");

        _escrowIdCounter++;
        uint256 escrowId = _escrowIdCounter;
        uint256 platformFee = (_amount * platformFeeBps) / 10000;
        uint256 agentAmount = _amount - platformFee;

        escrows[escrowId] = Escrow({
            id: escrowId, user: _user, agentId: _agentId, agentWallet: agentWallet,
            amount: _amount, platformFee: platformFee, agentAmount: agentAmount,
            taskHash: _taskHash, taskURI: _taskURI, createdAt: block.timestamp,
            deadline: block.timestamp + _deadline, deliveredAt: 0,
            status: EscrowStatus.Pending, upiTransactionId: _upiTransactionId,
            deliveryURI: "", userConfirmed: false, agentConfirmed: false
        });

        userEscrows[_user].push(escrowId);
        agentEscrows[_agentId].push(escrowId);
        upiToEscrow[_upiTransactionId] = escrowId;

        emit EscrowCreated(escrowId, _user, _agentId, _amount, _upiTransactionId);
        return escrowId;
    }

    function escrowFunds(uint256 _escrowId) external nonReentrant onlyAuthorized escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Pending, "Not pending");
        uint256 totalAmount = escrow.amount + escrow.platformFee;
        require(usdc.transferFrom(payAgentTreasury, address(this), totalAmount), "USDC transfer failed");
        escrow.status = EscrowStatus.Escrowed;
        emit FundsEscrowed(_escrowId, escrow.amount, escrow.platformFee);
    }

    function startWork(uint256 _escrowId) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.agentWallet, "Not agent");
        require(escrow.status == EscrowStatus.Escrowed, "Not escrowed");
        escrow.status = EscrowStatus.InProgress;
        emit AgentStarted(_escrowId, escrow.agentId, block.timestamp);
    }

    function submitDelivery(uint256 _escrowId, string calldata _deliveryURI) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.agentWallet, "Not agent");
        require(escrow.status == EscrowStatus.InProgress || escrow.status == EscrowStatus.Escrowed, "Invalid status");
        require(block.timestamp <= escrow.deadline, "Past deadline");
        require(bytes(_deliveryURI).length > 0, "Delivery URI required");
        escrow.deliveryURI = _deliveryURI;
        escrow.deliveredAt = block.timestamp;
        escrow.agentConfirmed = true;
        escrow.status = EscrowStatus.Delivered;
        emit DeliverySubmitted(_escrowId, _deliveryURI, block.timestamp);
    }

    function releasePayment(uint256 _escrowId) external nonReentrant escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Delivered, "Not delivered");
        if (msg.sender == escrow.user) {
            escrow.userConfirmed = true;
        } else {
            require(msg.sender == escrow.agentWallet || authorizedPayAgents[msg.sender], "Not authorized");
            require(block.timestamp >= escrow.deliveredAt + 1 days, "Auto-confirm after 24h");
        }
        escrow.status = EscrowStatus.Completed;
        require(usdc.transfer(escrow.agentWallet, escrow.agentAmount), "Agent payment failed");
        require(usdc.transfer(payAgentTreasury, escrow.platformFee), "Fee transfer failed");
        emit PaymentReleased(_escrowId, escrow.agentWallet, escrow.agentAmount, escrow.platformFee);
    }

    function raiseDispute(uint256 _escrowId, string calldata _reason) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.user, "Not user");
        require(escrow.status == EscrowStatus.Delivered || escrow.status == EscrowStatus.InProgress 
                || escrow.status == EscrowStatus.Escrowed, "Cannot dispute");
        require(block.timestamp <= escrow.deadline + DISPUTE_WINDOW, "Dispute window closed");
        escrow.status = EscrowStatus.Disputed;
        emit DisputeRaised(_escrowId, msg.sender, _reason);
    }

    function resolveDispute(uint256 _escrowId, bool _userWins, uint256 _refundAmount) 
        external onlyDisputeResolver escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        if (_userWins) {
            escrow.status = EscrowStatus.Refunded;
            if (_refundAmount == 0) _refundAmount = escrow.amount;
            require(_refundAmount <= escrow.amount, "Refund too high");
            require(usdc.transfer(payAgentTreasury, _refundAmount), "Refund failed");
            if (_refundAmount < escrow.amount) {
                uint256 agentShare = escrow.amount - _refundAmount - escrow.platformFee;
                if (agentShare > 0) require(usdc.transfer(escrow.agentWallet, agentShare), "Agent share failed");
            }
            emit RefundIssued(_escrowId, payAgentTreasury, _refundAmount);
        } else {
            escrow.status = EscrowStatus.Completed;
            require(usdc.transfer(escrow.agentWallet, escrow.agentAmount), "Agent payment failed");
            require(usdc.transfer(payAgentTreasury, escrow.platformFee), "Fee transfer failed");
            emit PaymentReleased(_escrowId, escrow.agentWallet, escrow.agentAmount, escrow.platformFee);
        }
        emit DisputeResolved(_escrowId, _userWins, _refundAmount);
    }

    function autoRefund(uint256 _escrowId) external nonReentrant escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Escrowed || escrow.status == EscrowStatus.InProgress, "Invalid status");
        require(block.timestamp > escrow.deadline, "Deadline not passed");
        escrow.status = EscrowStatus.Refunded;
        uint256 totalAmount = escrow.amount + escrow.platformFee;
        require(usdc.transfer(payAgentTreasury, totalAmount), "Refund failed");
        emit RefundIssued(_escrowId, payAgentTreasury, totalAmount);
    }

    function submitFeedback(uint256 _escrowId, int128 _score, uint8 _decimals,
        string calldata _tags, string calldata _feedbackURI) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.user, "Not user");
        require(escrow.status == EscrowStatus.Completed || escrow.status == EscrowStatus.Refunded, "Not finished");
        reputationRegistry.giveFeedback(escrow.agentId, _score, _decimals, _tags, _feedbackURI, bytes32(0));
        emit FeedbackSubmitted(_escrowId, escrow.agentId, _score, _tags);
    }

    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }
    function getUserEscrows(address _user) external view returns (uint256[] memory) {
        return userEscrows[_user];
    }
    function getAgentEscrows(uint256 _agentId) external view returns (uint256[] memory) {
        return agentEscrows[_agentId];
    }
    function getEscrowIdByUpi(string calldata _upiId) external view returns (uint256) {
        return upiToEscrow[_upiId];
    }
    function getTotalEscrows() external view returns (uint256) {
        return _escrowIdCounter;
    }
}
```

### 5.3 ERC-8004 Identity Registry (Simplified)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC8004IdentityRegistry is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct AgentInfo {
        address wallet;
        bool active;
        uint256 registeredAt;
        string agentURI;
    }

    mapping(uint256 => AgentInfo) public agents;
    mapping(address => uint256) public walletToAgentId;

    event AgentRegistered(uint256 indexed agentId, address indexed wallet, string uri);
    event AgentUpdated(uint256 indexed agentId, string uri);
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);

    constructor() ERC721("PayAgent Identity", "PAID") Ownable(msg.sender) {}

    function registerAgent(address _wallet, string calldata _uri) external returns (uint256) {
        require(_wallet != address(0), "Invalid wallet");
        require(walletToAgentId[_wallet] == 0, "Wallet already registered");
        require(bytes(_uri).length > 0, "URI required");
        _tokenIdCounter++;
        uint256 agentId = _tokenIdCounter;
        _safeMint(_wallet, agentId);
        _setTokenURI(agentId, _uri);
        agents[agentId] = AgentInfo(_wallet, true, block.timestamp, _uri);
        walletToAgentId[_wallet] = agentId;
        emit AgentRegistered(agentId, _wallet, _uri);
        return agentId;
    }

    function updateAgentURI(uint256 _agentId, string calldata _uri) external {
        require(ownerOf(_agentId) == msg.sender, "Not owner");
        agents[_agentId].agentURI = _uri;
        _setTokenURI(_agentId, _uri);
        emit AgentUpdated(_agentId, _uri);
    }

    function deactivateAgent(uint256 _agentId) external {
        require(ownerOf(_agentId) == msg.sender, "Not owner");
        agents[_agentId].active = false;
        emit AgentDeactivated(_agentId);
    }

    function reactivateAgent(uint256 _agentId) external {
        require(ownerOf(_agentId) == msg.sender, "Not owner");
        agents[_agentId].active = true;
        emit AgentReactivated(_agentId);
    }

    function isRegistered(uint256 _agentId) external view returns (bool) {
        return _ownerOf(_agentId) != address(0);
    }
    function isActive(uint256 _agentId) external view returns (bool) {
        return agents[_agentId].active;
    }
    function getAgentWallet(uint256 _agentId) external view returns (address) {
        return agents[_agentId].wallet;
    }
    function getAgentIdByWallet(address _wallet) external view returns (uint256) {
        return walletToAgentId[_wallet];
    }
    function totalAgents() external view returns (uint256) {
        return _tokenIdCounter;
    }
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

### 5.4 ERC-8004 Reputation Registry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC8004Identity.sol";

contract ERC8004ReputationRegistry {
    IERC8004Identity public identityRegistry;

    struct Feedback {
        address reviewer;
        int128 score;
        uint8 decimals;
        string tags;
        string feedbackURI;
        bytes32 contentHash;
        uint256 timestamp;
    }

    mapping(uint256 => Feedback[]) public agentFeedback;
    mapping(uint256 => uint256) public agentFeedbackCount;
    mapping(uint256 => int256) public agentTotalScore;

    event NewFeedback(uint256 indexed agentId, address indexed reviewer, 
                      int128 score, uint8 decimals, string tags);

    constructor(address _identityRegistry) {
        identityRegistry = IERC8004Identity(_identityRegistry);
    }

    function giveFeedback(uint256 _agentId, int128 _score, uint8 _decimals,
        string calldata _tags, string calldata _feedbackURI, bytes32 _contentHash) external {
        require(identityRegistry.isRegistered(_agentId), "Agent not registered");
        require(_score >= 0, "Score must be >= 0");
        Feedback memory feedback = Feedback(msg.sender, _score, _decimals, _tags, 
                                            _feedbackURI, _contentHash, block.timestamp);
        agentFeedback[_agentId].push(feedback);
        agentFeedbackCount[_agentId]++;
        agentTotalScore[_agentId] += int256(_score);
        emit NewFeedback(_agentId, msg.sender, _score, _decimals, _tags);
    }

    function getFeedback(uint256 _agentId, uint256 _index) external view returns (Feedback memory) {
        require(_index < agentFeedback[_agentId].length, "Index out of bounds");
        return agentFeedback[_agentId][_index];
    }
    function getAllFeedback(uint256 _agentId) external view returns (Feedback[] memory) {
        return agentFeedback[_agentId];
    }
    function getAverageScore(uint256 _agentId) external view returns (int256) {
        uint256 count = agentFeedbackCount[_agentId];
        if (count == 0) return 0;
        return agentTotalScore[_agentId] / int256(count);
    }
    function getFeedbackCount(uint256 _agentId) external view returns (uint256) {
        return agentFeedbackCount[_agentId];
    }
}
```

### 5.5 x-402 Payment Handler

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract X402PaymentHandler {
    using ECDSA for bytes32;

    struct PaymentPayload {
        address sender;
        address recipient;
        uint256 amount;
        uint256 nonce;
        uint256 expiry;
        bytes32 escrowId;
        bytes signature;
    }

    IERC20 public usdc;
    mapping(bytes32 => bool) public usedNonces;
    mapping(address => uint256) public nonces;

    event PaymentSettled(bytes32 indexed escrowId, address indexed sender, 
                         address indexed recipient, uint256 amount, uint256 nonce);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function settlePayment(PaymentPayload calldata _payload) external returns (bool) {
        require(block.timestamp <= _payload.expiry, "Payment expired");
        require(!usedNonces[keccak256(abi.encodePacked(_payload.sender, _payload.nonce))], "Nonce used");
        bytes32 hash = keccak256(abi.encodePacked(_payload.sender, _payload.recipient, 
            _payload.amount, _payload.nonce, _payload.expiry, _payload.escrowId));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        address signer = ethSignedHash.recover(_payload.signature);
        require(signer == _payload.sender, "Invalid signature");
        usedNonces[keccak256(abi.encodePacked(_payload.sender, _payload.nonce))] = true;
        nonces[_payload.sender]++;
        require(usdc.transferFrom(_payload.sender, _payload.recipient, _payload.amount), "Transfer failed");
        emit PaymentSettled(_payload.escrowId, _payload.sender, _payload.recipient, _payload.amount, _payload.nonce);
        return true;
    }

    function getNonce(address _sender) external view returns (uint256) {
        return nonces[_sender];
    }
    function isNonceUsed(address _sender, uint256 _nonce) external view returns (bool) {
        return usedNonces[keccak256(abi.encodePacked(_sender, _nonce))];
    }
}
```

---

## 6. User Flow

### 6.1 User Journey: Hiring an Agent

1. **Discover Agents:** User opens PayAgent web app, sees marketplace with agent cards showing name, description, price in Rs., reputation score, tasks completed. Filters by category, price range, rating.

2. **Create Task:** User clicks "Hire Agent", fills task form (description, requirements, deadline). System shows "You will pay Rs.50.00 via UPI". User confirms.

3. **UPI Payment:** Backend creates escrow record (status: Pending), generates UPI QR code / payment link. User scans QR with GPay/PhonePe/Paytm. Razorpay webhook hits backend in ~2 seconds. Backend calls escrowFunds() on Monad. Status updates to: **Escrowed**.

4. **Agent Execution:** Agent detects escrowed payment via event listener, calls startWork() on contract. Status updates to: **In Progress**. Agent executes task, calls submitDelivery() with IPFS link. Status updates to: **Delivered**.

5. **Receive & Confirm:** User gets notification "Your analysis is ready!". Opens deliverable. If satisfied, clicks "Confirm & Release Payment". Backend calls releasePayment(). Agent receives USDC instantly. Status: **Completed**. User rates agent (1-5 stars + tags). Feedback submitted to ERC-8004 Reputation Registry.

6. **Dispute (if needed):** User clicks "Raise Dispute", selects reason, adds comment. Status: **Disputed**. Admin/DAO reviews within 24 hours. Resolution: full refund, partial refund, or payment to agent.

---

## 7. Agent Flow

### 7.1 Agent Journey: Registering & Earning

1. **Register Agent:** Developer connects wallet, fills registration form with name, description, capabilities, endpoint, pricing. Backend mints ERC-721 identity NFT on Monad. Agent receives agentId.

2. **Listen for Orders:** Agent runs lightweight service (Node.js/Python) that polls/subscribes to EscrowCreated events, filters for matching agentId.

3. **Execute Task:** Agent calls startWork(escrowId), executes task (fetches data, runs models), generates deliverable.

4. **Deliver & Get Paid:** Agent uploads deliverable to IPFS, calls submitDelivery(escrowId, deliveryURI). Waits for user confirmation (or auto-confirm after 24h). Receives USDC instantly. Reputation updated based on feedback.

---

## 8. Payment Flow

### 8.1 End-to-End Sequence

```
User -> Frontend: Hire Agent
Frontend -> Backend: Create Task
Backend -> Razorpay: Generate UPI QR
Razorpay -> Frontend: Show QR
User -> Razorpay: Pay via UPI (GPay)
Razorpay -> Backend: Webhook (payment confirmed)
Backend -> Monad Contract: createEscrow() + escrowFunds()
Monad Contract -> Agent: EscrowCreated event
Agent -> Monad Contract: startWork()
Agent -> Monad Contract: submitDelivery()
Backend -> User: Notification (delivery ready)
User -> Frontend: Confirm & Release
Frontend -> Backend: releasePayment()
Backend -> Monad Contract: releasePayment()
Monad Contract -> Agent: USDC transferred
User -> Frontend: Rate Agent (feedback)
Frontend -> Monad Contract: submitFeedback()
```

### 8.2 UPI to USDC Conversion

For hackathon: Use a sponsored treasury or mock conversion. Backend maintains an internal ledger mapping UPI Rs. to USDC at a fixed rate (e.g., Rs.50 = 0.60 USDC). Treasury wallet holds USDC float and locks it in escrow upon UPI confirmation.

In production: Integrate with on/off-ramp providers (Transak, Onramper) or maintain a P2P liquidity network.

---

## 9. Data Models

### 9.1 Database Schema (PostgreSQL)

```sql
-- Users table (mapped UPI users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    evm_address VARCHAR(42) NOT NULL,
    upi_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id BIGINT UNIQUE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price_inr DECIMAL(10,2) NOT NULL,
    price_usdc DECIMAL(10,6) NOT NULL,
    reputation_score DECIMAL(3,2) DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    agent_uri TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Escrows table
CREATE TABLE escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id BIGINT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    agent_id BIGINT REFERENCES agents(agent_id),
    amount_inr DECIMAL(10,2) NOT NULL,
    amount_usdc DECIMAL(10,6) NOT NULL,
    platform_fee_usdc DECIMAL(10,6) NOT NULL,
    task_description TEXT NOT NULL,
    task_hash VARCHAR(66) NOT NULL,
    upi_transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_uri TEXT,
    user_rating INT,
    user_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    deadline TIMESTAMP,
    delivered_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES escrows(id),
    tx_hash VARCHAR(66) NOT NULL,
    tx_type VARCHAR(50) NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    amount_usdc DECIMAL(10,6),
    gas_used BIGINT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- UPI payments table
CREATE TABLE upi_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES escrows(id),
    razorpay_payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    amount_inr DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    webhook_payload JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP
);
```

### 9.2 Agent Card JSON Schema

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "MarketSentiment Pro",
  "description": "Real-time crypto market sentiment analysis using NLP",
  "image": "https://example.com/agent.png",
  "services": [
    {
      "name": "sentiment-analysis",
      "endpoint": "https://api.marketsentiment.agent/analyze",
      "pricing": { "amount": "0.60", "currency": "USDC" }
    }
  ],
  "capabilities": ["NLP", "Crypto", "Real-time"],
  "x402Support": true,
  "active": true,
  "supportedTrust": ["reputation", "crypto-economic"]
}
```

---

## 10. API Specification

### 10.1 REST API Endpoints

**Authentication:**
- POST /api/auth/register - Body: { phone, email? } -> { userId, evmAddress, token }
- POST /api/auth/verify-otp - Body: { phone, otp } -> { token }

**Agents:**
- GET /api/agents - Query: { category?, minPrice?, maxPrice?, minRating?, sort? } -> { agents, total, page }
- GET /api/agents/:agentId -> { agent details }
- POST /api/agents/register - Headers: Bearer token, Body: { name, description, category, priceINR, capabilities[], endpoint, walletAddress } -> { agentId, txHash }

**Orders / Escrows:**
- POST /api/orders - Headers: Bearer token, Body: { agentId, taskDescription, deadline? } -> { orderId, escrowId, upiLink, qrCode, amountINR }
- GET /api/orders/:orderId -> { order details }
- GET /api/orders - Headers: Bearer token -> { orders, total }
- POST /api/orders/:orderId/confirm -> { txHash, status: "completed" }
- POST /api/orders/:orderId/dispute - Body: { reason, details? } -> { disputeId }
- POST /api/orders/:orderId/feedback - Body: { rating: 1-5, tags[], comment? } -> { txHash }

**Webhooks:**
- POST /webhooks/razorpay - Headers: X-Razorpay-Signature -> 200 OK
- POST /webhooks/agent/delivery - Headers: Bearer agentApiKey, Body: { escrowId, deliveryURI } -> { txHash }

### 10.2 WebSocket Events

Client subscribes: { type: 'subscribe', channel: 'order:{orderId}' }

Events:
- order.status_update: { orderId, status, txHash, timestamp }
- order.delivered: { orderId, deliveryURI, agentId, timestamp }

---

## 11. Frontend Design

### 11.1 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| / | Landing | Hero, featured agents, how it works |
| /marketplace | Marketplace | Browse, filter, search agents |
| /agent/:id | Agent Profile | Details, reviews, hire form |
| /order/:id | Order Tracking | Real-time status, delivery, actions |
| /orders | My Orders | History, filter by status |
| /register-agent | Agent Registration | Form to register new agent |
| /dashboard | Agent Dashboard | Earnings, reputation, settings |
| /admin | Admin Panel | Disputes, analytics |

### 11.2 Key UI Components

**Agent Card:** Shows agent image, name, rating, description, price in Rs., delivery time, Hire Now button.

**Payment Modal:** Shows QR code, UPI ID, supported apps (GPay, PhonePe, Paytm), waiting indicator.

**Order Timeline:** Vertical timeline showing: Order Created -> Payment Received -> Funds Escrowed -> Agent Working -> Awaiting Delivery -> Completed.

---

## 12. Security Considerations

### 12.1 Smart Contract Security
- Reentrancy: Use ReentrancyGuard on all fund-moving functions
- Access Control: onlyAuthorized modifier for backend operations
- Integer Overflow: Solidity 0.8+ built-in checks
- Signature Replay: Nonce tracking in x-402 handler
- Price Oracle: Use Chainlink or TWAP for INR/USDC rates

### 12.2 Operational Security
- UPI Fraud: Razorpay webhook signature verification
- Agent Impersonation: ERC-8004 identity verification
- Double Spending: UPI txn ID uniqueness check on-chain
- Key Management: AWS KMS / HashiCorp Vault for treasury keys
- Rate Limiting: Redis-based rate limiting on API

### 12.3 Compliance
- KYC: Optional for hackathon; mandatory in production
- Transaction Limits: Rs.10,000 per txn, Rs.50,000 per day
- Audit Trail: All UPI txns and on-chain events logged
- Tax: 1% TDS tracking for crypto payouts
- Data Privacy: Encrypt PII, comply with DPDP Act 2023

---

## 13. 1-Day Build Plan

### 13.1 Pre-Hackathon Setup

| Task | Time |
|------|------|
| Monad Testnet Setup (faucet, deploy test contracts) | 30 min |
| Razorpay Test Account (API keys, test mode) | 30 min |
| Project Scaffolding (React + Node.js + Hardhat) | 1 hour |
| Contract Skeleton (escrow, identity, x-402) | 1 hour |
| Mock Data (3-5 sample agents) | 30 min |

### 13.2 Hackathon Day Schedule

**Phase 1: Foundation (9:00 AM - 12:00 PM)**
- 9:00-9:30: Deploy contracts to Monad testnet
- 9:30-10:30: Build escrow core (create, lock, release)
- 10:30-11:30: Integrate Razorpay UPI links + webhooks
- 11:30-12:00: Build basic API (orders, agents, webhooks)

**Phase 2: Integration (12:00 PM - 3:00 PM)**
- 12:00-1:00: Frontend marketplace + agent cards
- 1:00-2:00: Frontend order flow + UPI payment
- 2:00-3:00: Frontend order tracking + status

**Phase 3: Polish (3:00 PM - 5:00 PM)**
- 3:00-3:30: Agent registration flow
- 3:30-4:00: Dispute + feedback UI
- 4:00-4:30: Demo script + test cases
- 4:30-5:00: Bug fixes + styling

**Phase 4: Demo Prep (5:00 PM - 6:00 PM)**
- 5:00-5:30: Record demo video / rehearse
- 5:30-6:00: Final checks, deploy to Vercel

### 13.3 MVP Scope

**MUST HAVE:**
- User can browse 3-5 mock agents
- User can create an order and pay via UPI (test mode)
- UPI webhook triggers escrow on Monad
- Agent can mark delivery (mock or real)
- User can confirm and release payment
- Basic reputation display

**NICE TO HAVE:**
- Real AI agent execution (OpenAI API or mock)
- Dispute flow
- Agent dashboard with earnings
- Mobile-responsive design
- Dark mode

**OUT OF SCOPE:**
- Real INR to USDC conversion (use mock treasury)
- Full KYC/AML flow
- Production security audit
- Multi-chain support
- Advanced dispute arbitration

---

## 14. Resources & References

### 14.1 Official Documentation

| Resource | URL |
|----------|-----|
| Monad Docs | https://docs.monad.xyz/ |
| ERC-8004 Spec | https://eips.ethereum.org/EIPS/eip-8004 |
| x402 Whitepaper | https://www.x402.org/x402-whitepaper.pdf |
| x402 Website | https://www.x402.org/ |
| Razorpay Docs | https://razorpay.com/docs/ |

### 14.2 Monad Testnet Details

| Parameter | Value |
|-----------|-------|
| Network Name | Monad Testnet |
| Chain ID | 10143 |
| Currency Symbol | MON |
| RPC URL | https://testnet-rpc.monad.xyz/ |
| Block Explorer | https://testnet.monadexplorer.com/ |
| Faucet | https://testnet.monad.xyz/faucet |

### 14.3 RPC Providers

| Provider | Free Tier |
|----------|-----------|
| Alchemy | Yes |
| QuickNode | Yes |
| Ankr | Yes |
| BlockPI | Yes |

### 14.4 Useful Libraries

| Library | Install |
|---------|---------|
| ethers | npm install ethers |
| viem | npm install viem |
| razorpay | npm install razorpay |
| express | npm install express |
| prisma | npm install prisma |
| socket.io | npm install socket.io |
| react + vite | npm create vite@latest |
| tailwindcss | npm install tailwindcss |
| shadcn/ui | npx shadcn-ui@latest init |

### 14.5 Contract Deployment Addresses (Hackathon)

```
Monad Testnet:
  PayAgentEscrow:     [DEPLOY_AND_FILL]
  ERC8004Identity:    [DEPLOY_AND_FILL]
  ERC8004Reputation:  [DEPLOY_AND_FILL]
  X402PaymentHandler: [DEPLOY_AND_FILL]
  USDC (Mock):        [DEPLOY_AND_FILL]
```

### 14.6 Environment Variables

```
MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
MONAD_CHAIN_ID=10143
PRIVATE_KEY=0x...
ESCROW_CONTRACT=0x...
IDENTITY_REGISTRY=0x...
REPUTATION_REGISTRY=0x...
X402_HANDLER=0x...
USDC_CONTRACT=0x...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret
PORT=3000
```

### 14.7 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/yourteam/payagent.git
cd payagent
npm install

# Setup environment
cp .env.example .env
# Fill in all values

# Deploy contracts
cd contracts
npx hardhat run scripts/deploy.js --network monadTestnet

# Update contract addresses in .env

# Start backend
cd ../backend
npx prisma migrate dev
npm run dev

# Start frontend (new terminal)
cd ../frontend
npm run dev

# Open http://localhost:5173
```

### 14.8 Demo Script (2 Minutes)

**Slide 1: Problem (15 sec)**
"600 million Indians use UPI daily. But they cannot pay AI agents, buy data, or join the agent economy. Crypto onboarding is 15 steps and 30 minutes. We are fixing that."

**Slide 2: Solution (15 sec)**
"PayAgent — pay via GPay, get AI agent services instantly. No wallet, no gas, no crypto knowledge."

**Demo 1: User Pays via UPI (30 sec)**
1. Open marketplace
2. Click "MarketSentiment Pro" — Rs.50
3. Scan QR with PhonePe
4. Payment confirmed in 2 seconds
5. Funds escrowed on Monad

**Demo 2: Agent Delivers (30 sec)**
1. Show agent dashboard — new order detected
2. Agent auto-starts work
3. Agent submits deliverable (mock)
4. User gets notification

**Demo 3: Payment Release (20 sec)**
1. User views result
2. Clicks "Confirm & Pay"
3. Agent receives USDC instantly
4. Show transaction on Monad explorer

**Slide 3: Why Monad (10 sec)**
"10,000 TPS. 1-second finality. Near-zero fees. The only chain where micro-payments actually work for agents."

---

## Appendix A: Sample Agent Implementations

### A.1 Market Sentiment Agent (Python)

```python
import requests
from web3 import Web3

class MarketSentimentAgent:
    def __init__(self, private_key, contract_address, rpc_url, agent_id):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = self.w3.eth.account.from_key(private_key)
        self.contract = self.w3.eth.contract(address=contract_address, abi=ESCROW_ABI)
        self.agent_id = agent_id

    def listen_for_orders(self):
        event_filter = self.contract.events.EscrowCreated.create_filter(fromBlock='latest')
        while True:
            for event in event_filter.get_new_entries():
                if event.args.agentId == self.agent_id:
                    self.process_order(event.args.escrowId)

    def process_order(self, escrow_id):
        # Start work
        tx = self.contract.functions.startWork(escrow_id).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 100000,
            'gasPrice': self.w3.to_wei('0.01', 'gwei')
        })
        signed = self.w3.eth.account.sign_transaction(tx, self.account.key)
        self.w3.eth.send_raw_transaction(signed.rawTransaction)

        # Execute task
        result = self.analyze_sentiment()
        delivery_uri = self.upload_to_ipfs(result)

        # Submit delivery
        tx = self.contract.functions.submitDelivery(escrow_id, delivery_uri).build_transaction({...})
        signed = self.w3.eth.account.sign_transaction(tx, self.account.key)
        self.w3.eth.send_raw_transaction(signed.rawTransaction)

    def analyze_sentiment(self):
        # Fetch Twitter, news, on-chain data
        # Run NLP model
        # Return structured report
        pass
```

### A.2 Translation Agent (Node.js)

```javascript
const { ethers } = require('ethers');
const OpenAI = require('openai');

class TranslationAgent {
  constructor(privateKey, contractAddress, rpcUrl, agentId) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, ESCROW_ABI, this.wallet);
    this.agentId = agentId;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
  }

  async startListening() {
    this.contract.on('EscrowCreated', async (escrowId, user, agentId, amount) => {
      if (agentId.toString() === this.agentId) {
        await this.processOrder(escrowId);
      }
    });
  }

  async processOrder(escrowId) {
    const tx = await this.contract.startWork(escrowId);
    await tx.wait();

    const escrow = await this.contract.escrows(escrowId);
    const taskDetails = await fetch(escrow.taskURI).then(r => r.json());

    const translation = await this.translate(taskDetails.text, taskDetails.targetLang);
    const deliveryURI = await this.uploadToIPFS(translation);

    const deliveryTx = await this.contract.submitDelivery(escrowId, deliveryURI);
    await deliveryTx.wait();
  }

  async translate(text, targetLang) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: `Translate to ${targetLang}. Preserve meaning and tone.`
      }, { role: 'user', content: text }]
    });
    return response.choices[0].message.content;
  }
}
```

---

**END OF DOCUMENT**

Last Updated: June 17, 2026  
Prepared for: Monad Blitz Mumbai V3 — The Agent Economy  
Team: [Your Team Name]
