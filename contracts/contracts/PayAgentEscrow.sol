// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC8004Identity.sol";
import "./interfaces/IERC8004Reputation.sol";

/**
 * @title PayAgentEscrow
 * @dev Core escrow contract for the PayAgent UPI-to-Agent bridge.
 *      Manages the full lifecycle: create → escrow → work → deliver → release/refund.
 *      Integrates with ERC-8004 for agent verification and reputation.
 *
 *      Flow:
 *      1. Backend creates escrow after UPI payment confirmed
 *      2. Backend locks USDC from treasury into this contract
 *      3. Agent starts work and submits delivery
 *      4. User confirms → USDC released to agent
 *      5. If agent fails → auto-refund after deadline
 */
contract PayAgentEscrow is ReentrancyGuard, Ownable {
    // ── State Variables ─────────────────────────────────────────────

    IERC20 public immutable usdc;
    IERC8004Identity public immutable identityRegistry;
    IERC8004Reputation public immutable reputationRegistry;

    address public payAgentTreasury;
    address public disputeResolver;

    uint256 public platformFeeBps = 250; // 2.5% platform fee
    uint256 public constant MAX_DEADLINE = 7 days;
    uint256 public constant DISPUTE_WINDOW = 3 days;
    uint256 private _escrowIdCounter;

    // ── Enums & Structs ─────────────────────────────────────────────

    enum EscrowStatus {
        Pending,     // 0: Escrow created, awaiting USDC deposit
        Escrowed,    // 1: USDC locked in contract
        InProgress,  // 2: Agent has started working
        Delivered,   // 3: Agent submitted delivery
        Completed,   // 4: Payment released to agent
        Disputed,    // 5: User raised a dispute
        Refunded,    // 6: Funds returned to treasury
        Cancelled    // 7: Order cancelled before escrow
    }

    struct Escrow {
        uint256 id;
        address user;
        uint256 agentId;
        address agentWallet;
        uint256 amount;          // Total USDC amount (before fees)
        uint256 platformFee;     // Fee taken by platform
        uint256 agentAmount;     // Amount agent receives (amount - fee)
        bytes32 taskHash;        // Hash of task description for verification
        string taskURI;          // URI to full task details (IPFS/HTTP)
        uint256 createdAt;
        uint256 deadline;
        uint256 deliveredAt;
        EscrowStatus status;
        string upiTransactionId; // Linked UPI transaction for audit trail
        string deliveryURI;      // URI to delivered result
        bool userConfirmed;
        bool agentConfirmed;
    }

    // ── Mappings ────────────────────────────────────────────────────

    mapping(uint256 => Escrow) public escrows;
    mapping(address => uint256[]) public userEscrows;
    mapping(uint256 => uint256[]) public agentEscrows;
    mapping(string => uint256) public upiToEscrow;
    mapping(address => bool) public authorizedPayAgents;

    // ── Events ──────────────────────────────────────────────────────

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed user,
        uint256 indexed agentId,
        uint256 amount,
        string upiTransactionId
    );
    event FundsEscrowed(uint256 indexed escrowId, uint256 amount, uint256 platformFee);
    event AgentStarted(uint256 indexed escrowId, uint256 indexed agentId, uint256 timestamp);
    event DeliverySubmitted(uint256 indexed escrowId, string deliveryURI, uint256 timestamp);
    event PaymentReleased(
        uint256 indexed escrowId,
        address indexed agentWallet,
        uint256 agentAmount,
        uint256 platformFee
    );
    event RefundIssued(uint256 indexed escrowId, address indexed to, uint256 amount);
    event DisputeRaised(uint256 indexed escrowId, address indexed by, string reason);
    event DisputeResolved(uint256 indexed escrowId, bool userWins, uint256 refundAmount);
    event FeedbackSubmitted(uint256 indexed escrowId, uint256 indexed agentId, int128 score, string tags);

    // ── Modifiers ───────────────────────────────────────────────────

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

    // ── Constructor ─────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _identityRegistry,
        address _reputationRegistry,
        address _treasury,
        address _disputeResolver
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        identityRegistry = IERC8004Identity(_identityRegistry);
        reputationRegistry = IERC8004Reputation(_reputationRegistry);
        payAgentTreasury = _treasury;
        disputeResolver = _disputeResolver;
        authorizedPayAgents[_treasury] = true;
    }

    // ── Admin Functions ─────────────────────────────────────────────

    function setAuthorizedPayAgent(address _agent, bool _status) external onlyOwner {
        authorizedPayAgents[_agent] = _status;
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee max 10%");
        platformFeeBps = _feeBps;
    }

    // ── Core Escrow Functions ───────────────────────────────────────

    /**
     * @dev Create a new escrow record. Called by backend after UPI payment is confirmed.
     */
    function createEscrow(
        address _user,
        uint256 _agentId,
        uint256 _amount,
        bytes32 _taskHash,
        string calldata _taskURI,
        string calldata _upiTransactionId,
        uint256 _deadline
    ) external onlyAuthorized returns (uint256) {
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
            id: escrowId,
            user: _user,
            agentId: _agentId,
            agentWallet: agentWallet,
            amount: _amount,
            platformFee: platformFee,
            agentAmount: agentAmount,
            taskHash: _taskHash,
            taskURI: _taskURI,
            createdAt: block.timestamp,
            deadline: block.timestamp + _deadline,
            deliveredAt: 0,
            status: EscrowStatus.Pending,
            upiTransactionId: _upiTransactionId,
            deliveryURI: "",
            userConfirmed: false,
            agentConfirmed: false
        });

        userEscrows[_user].push(escrowId);
        agentEscrows[_agentId].push(escrowId);
        upiToEscrow[_upiTransactionId] = escrowId;

        emit EscrowCreated(escrowId, _user, _agentId, _amount, _upiTransactionId);
        return escrowId;
    }

    /**
     * @dev Lock USDC from treasury into this contract. Called after UPI payment confirmed.
     */
    function escrowFunds(uint256 _escrowId) external nonReentrant onlyAuthorized escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Pending, "Not pending");

        uint256 totalAmount = escrow.amount;
        require(usdc.transferFrom(payAgentTreasury, address(this), totalAmount), "USDC transfer failed");

        escrow.status = EscrowStatus.Escrowed;
        emit FundsEscrowed(_escrowId, escrow.amount, escrow.platformFee);
    }

    /**
     * @dev Agent signals they have started working on the task.
     */
    function startWork(uint256 _escrowId) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.agentWallet, "Not agent");
        require(escrow.status == EscrowStatus.Escrowed, "Not escrowed");

        escrow.status = EscrowStatus.InProgress;
        emit AgentStarted(_escrowId, escrow.agentId, block.timestamp);
    }

    /**
     * @dev Agent submits the completed deliverable.
     */
    function submitDelivery(uint256 _escrowId, string calldata _deliveryURI) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.agentWallet, "Not agent");
        require(
            escrow.status == EscrowStatus.InProgress || escrow.status == EscrowStatus.Escrowed,
            "Invalid status"
        );
        require(block.timestamp <= escrow.deadline, "Past deadline");
        require(bytes(_deliveryURI).length > 0, "Delivery URI required");

        escrow.deliveryURI = _deliveryURI;
        escrow.deliveredAt = block.timestamp;
        escrow.agentConfirmed = true;
        escrow.status = EscrowStatus.Delivered;

        emit DeliverySubmitted(_escrowId, _deliveryURI, block.timestamp);
    }

    /**
     * @dev Release escrowed funds to the agent. Can be called by:
     *      - User (immediate release)
     *      - Agent or authorized backend (after 24h auto-confirm window)
     */
    function releasePayment(uint256 _escrowId) external nonReentrant escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Delivered, "Not delivered");

        if (msg.sender == escrow.user) {
            escrow.userConfirmed = true;
        } else {
            require(
                msg.sender == escrow.agentWallet || authorizedPayAgents[msg.sender],
                "Not authorized"
            );
            require(block.timestamp >= escrow.deliveredAt + 1 days, "Auto-confirm after 24h");
        }

        escrow.status = EscrowStatus.Completed;

        // Transfer agent share
        require(usdc.transfer(escrow.agentWallet, escrow.agentAmount), "Agent payment failed");
        // Transfer platform fee
        require(usdc.transfer(payAgentTreasury, escrow.platformFee), "Fee transfer failed");

        emit PaymentReleased(_escrowId, escrow.agentWallet, escrow.agentAmount, escrow.platformFee);
    }

    // ── Dispute & Refund Functions ──────────────────────────────────

    /**
     * @dev User raises a dispute (only within dispute window after deadline)
     */
    function raiseDispute(uint256 _escrowId, string calldata _reason) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.user, "Not user");
        require(
            escrow.status == EscrowStatus.Delivered ||
            escrow.status == EscrowStatus.InProgress ||
            escrow.status == EscrowStatus.Escrowed,
            "Cannot dispute"
        );
        require(block.timestamp <= escrow.deadline + DISPUTE_WINDOW, "Dispute window closed");

        escrow.status = EscrowStatus.Disputed;
        emit DisputeRaised(_escrowId, msg.sender, _reason);
    }

    /**
     * @dev Resolve a dispute (only by designated dispute resolver)
     */
    function resolveDispute(
        uint256 _escrowId,
        bool _userWins,
        uint256 _refundAmount
    ) external onlyDisputeResolver escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");

        if (_userWins) {
            escrow.status = EscrowStatus.Refunded;
            if (_refundAmount == 0) _refundAmount = escrow.amount;
            require(_refundAmount <= escrow.amount, "Refund too high");

            // Refund to treasury (which maps back to user's UPI)
            require(usdc.transfer(payAgentTreasury, _refundAmount), "Refund failed");

            // If partial refund, pay agent the remainder
            if (_refundAmount < escrow.amount) {
                uint256 agentShare = escrow.amount - _refundAmount - escrow.platformFee;
                if (agentShare > 0) {
                    require(usdc.transfer(escrow.agentWallet, agentShare), "Agent share failed");
                }
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

    /**
     * @dev Auto-refund if agent fails to deliver before deadline
     */
    function autoRefund(uint256 _escrowId) external nonReentrant escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.Escrowed || escrow.status == EscrowStatus.InProgress,
            "Invalid status"
        );
        require(block.timestamp > escrow.deadline, "Deadline not passed");

        escrow.status = EscrowStatus.Refunded;
        uint256 totalAmount = escrow.amount;
        require(usdc.transfer(payAgentTreasury, totalAmount), "Refund failed");

        emit RefundIssued(_escrowId, payAgentTreasury, totalAmount);
    }

    // ── Feedback ────────────────────────────────────────────────────

    /**
     * @dev Submit feedback for an agent after task completion
     */
    function submitFeedback(
        uint256 _escrowId,
        int128 _score,
        uint8 _decimals,
        string calldata _tags,
        string calldata _feedbackURI
    ) external escrowExists(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.user, "Not user");
        require(
            escrow.status == EscrowStatus.Completed || escrow.status == EscrowStatus.Refunded,
            "Not finished"
        );

        reputationRegistry.giveFeedback(
            escrow.agentId,
            _score,
            _decimals,
            _tags,
            _feedbackURI,
            bytes32(0)
        );

        emit FeedbackSubmitted(_escrowId, escrow.agentId, _score, _tags);
    }

    // ── View Functions ──────────────────────────────────────────────

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
