// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC8004Reputation {
    function giveFeedback(
        uint256 _agentId,
        int128 _score,
        uint8 _decimals,
        string calldata _tags,
        string calldata _feedbackURI,
        bytes32 _contentHash
    ) external;

    function getAverageScore(uint256 _agentId) external view returns (int256);
    function getFeedbackCount(uint256 _agentId) external view returns (uint256);
}
