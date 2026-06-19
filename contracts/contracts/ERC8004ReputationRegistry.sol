// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC8004Identity.sol";

/**
 * @title ERC8004ReputationRegistry
 * @dev On-chain reputation system for AI agents.
 *      Stores immutable feedback with scores, tags, and URIs.
 *      Only works with agents registered in the Identity Registry.
 */
contract ERC8004ReputationRegistry {
    IERC8004Identity public identityRegistry;

    struct Feedback {
        address reviewer;
        int128 score;        // Score value (e.g., 1-5 stars as 100-500)
        uint8 decimals;      // Decimal precision for the score
        string tags;         // Comma-separated tags (e.g., "fast,accurate,helpful")
        string feedbackURI;  // URI to detailed feedback (IPFS or HTTP)
        bytes32 contentHash; // Hash of delivered content (for verification)
        uint256 timestamp;
    }

    mapping(uint256 => Feedback[]) public agentFeedback;
    mapping(uint256 => uint256) public agentFeedbackCount;
    mapping(uint256 => int256) public agentTotalScore;

    event NewFeedback(
        uint256 indexed agentId,
        address indexed reviewer,
        int128 score,
        uint8 decimals,
        string tags
    );

    constructor(address _identityRegistry) {
        identityRegistry = IERC8004Identity(_identityRegistry);
    }

    /**
     * @dev Submit feedback for an agent
     * @param _agentId The agent's token ID
     * @param _score Rating score (must be >= 0)
     * @param _decimals Decimal precision for the score
     * @param _tags Comma-separated descriptive tags
     * @param _feedbackURI URI to detailed feedback
     * @param _contentHash Hash of the delivered content
     */
    function giveFeedback(
        uint256 _agentId,
        int128 _score,
        uint8 _decimals,
        string calldata _tags,
        string calldata _feedbackURI,
        bytes32 _contentHash
    ) external {
        require(identityRegistry.isRegistered(_agentId), "Agent not registered");
        require(_score >= 0, "Score must be >= 0");

        Feedback memory feedback = Feedback({
            reviewer: msg.sender,
            score: _score,
            decimals: _decimals,
            tags: _tags,
            feedbackURI: _feedbackURI,
            contentHash: _contentHash,
            timestamp: block.timestamp
        });

        agentFeedback[_agentId].push(feedback);
        agentFeedbackCount[_agentId]++;
        agentTotalScore[_agentId] += int256(_score);

        emit NewFeedback(_agentId, msg.sender, _score, _decimals, _tags);
    }

    // ── View Functions ──────────────────────────────────────────────

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
