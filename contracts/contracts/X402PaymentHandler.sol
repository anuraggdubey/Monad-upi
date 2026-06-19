// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title X402PaymentHandler
 * @dev Implements the x-402 payment protocol for micropayments.
 *      Verifies signed payment payloads and settles USDC transfers.
 *      Uses nonce tracking to prevent replay attacks.
 */
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

    event PaymentSettled(
        bytes32 indexed escrowId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 nonce
    );

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Settle a signed payment. Verifies the ECDSA signature and transfers USDC.
     * @param _payload The signed payment payload
     * @return success Whether the settlement was successful
     */
    function settlePayment(PaymentPayload calldata _payload) external returns (bool) {
        // Check expiry
        require(block.timestamp <= _payload.expiry, "Payment expired");

        // Check nonce hasn't been used
        bytes32 nonceKey = keccak256(abi.encodePacked(_payload.sender, _payload.nonce));
        require(!usedNonces[nonceKey], "Nonce already used");

        // Reconstruct and verify signature
        bytes32 hash = keccak256(
            abi.encodePacked(
                _payload.sender,
                _payload.recipient,
                _payload.amount,
                _payload.nonce,
                _payload.expiry,
                _payload.escrowId
            )
        );
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        address signer = ethSignedHash.recover(_payload.signature);
        require(signer == _payload.sender, "Invalid signature");

        // Mark nonce as used
        usedNonces[nonceKey] = true;
        nonces[_payload.sender]++;

        // Transfer USDC
        require(
            usdc.transferFrom(_payload.sender, _payload.recipient, _payload.amount),
            "USDC transfer failed"
        );

        emit PaymentSettled(
            _payload.escrowId,
            _payload.sender,
            _payload.recipient,
            _payload.amount,
            _payload.nonce
        );

        return true;
    }

    // ── View Functions ──────────────────────────────────────────────

    function getNonce(address _sender) external view returns (uint256) {
        return nonces[_sender];
    }

    function isNonceUsed(address _sender, uint256 _nonce) external view returns (bool) {
        return usedNonces[keccak256(abi.encodePacked(_sender, _nonce))];
    }
}
