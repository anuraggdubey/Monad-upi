// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004IdentityRegistry
 * @dev Agent identity registry following ERC-8004 specification.
 *      Each agent is represented as an ERC-721 NFT with metadata URI.
 *      Agents register with a wallet address and can be activated/deactivated.
 */
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

    /**
     * @dev Register a new agent. Mints an ERC-721 identity NFT.
     * @param _wallet The wallet address that will receive payments
     * @param _uri Metadata URI (JSON with name, description, capabilities, pricing)
     * @return agentId The newly minted agent ID
     */
    function registerAgent(address _wallet, string calldata _uri) external returns (uint256) {
        require(_wallet != address(0), "Invalid wallet");
        require(walletToAgentId[_wallet] == 0, "Wallet already registered");
        require(bytes(_uri).length > 0, "URI required");

        _tokenIdCounter++;
        uint256 agentId = _tokenIdCounter;

        _safeMint(_wallet, agentId);
        _setTokenURI(agentId, _uri);

        agents[agentId] = AgentInfo({
            wallet: _wallet,
            active: true,
            registeredAt: block.timestamp,
            agentURI: _uri
        });
        walletToAgentId[_wallet] = agentId;

        emit AgentRegistered(agentId, _wallet, _uri);
        return agentId;
    }

    /**
     * @dev Update agent metadata URI (only owner of the NFT can update)
     */
    function updateAgentURI(uint256 _agentId, string calldata _uri) external {
        require(ownerOf(_agentId) == msg.sender, "Not owner");
        agents[_agentId].agentURI = _uri;
        _setTokenURI(_agentId, _uri);
        emit AgentUpdated(_agentId, _uri);
    }

    /**
     * @dev Deactivate an agent (only owner can deactivate)
     */
    function deactivateAgent(uint256 _agentId) external {
        require(ownerOf(_agentId) == msg.sender, "Not owner");
        agents[_agentId].active = false;
        emit AgentDeactivated(_agentId);
    }

    /**
     * @dev Reactivate a deactivated agent
     */
    function reactivateAgent(uint256 _agentId) external {
        require(ownerOf(_agentId) == msg.sender, "Not owner");
        agents[_agentId].active = true;
        emit AgentReactivated(_agentId);
    }

    // ── View Functions ──────────────────────────────────────────────

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

    // ── Override Required Functions ─────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
