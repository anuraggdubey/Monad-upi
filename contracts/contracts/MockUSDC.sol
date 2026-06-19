// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing on Monad testnet.
 *      Allows the owner to mint tokens freely for testing purposes.
 *      In production, this would be replaced with the real USDC contract.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6; // USDC uses 6 decimals

    constructor() ERC20("USD Coin (Mock)", "USDC") Ownable(msg.sender) {
        // Mint 1,000,000 USDC to deployer (treasury) for testing
        _mint(msg.sender, 1_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Mint tokens to any address (for testing only)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in smallest unit, 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function - anyone can mint a small amount for testing
     *      Limited to 1000 USDC per call
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** DECIMALS);
    }
}
