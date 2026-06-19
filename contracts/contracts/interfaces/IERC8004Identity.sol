// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC8004Identity {
    function isRegistered(uint256 _agentId) external view returns (bool);
    function isActive(uint256 _agentId) external view returns (bool);
    function getAgentWallet(uint256 _agentId) external view returns (address);
    function getAgentIdByWallet(address _wallet) external view returns (uint256);
    function totalAgents() external view returns (uint256);
}
