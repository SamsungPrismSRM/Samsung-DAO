// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "openzeppelin-contracts/contracts/utils/Nonces.sol";
import "openzeppelin-contracts/contracts/access/AccessControl.sol";
import "openzeppelin-contracts/contracts/utils/Pausable.sol";

contract SPUToken is ERC20, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    event OracleMint(address indexed to, uint256 amount);
    event OracleBurn(address indexed from, uint256 amount);
    event CircuitBreakerTripped(address indexed admin, string reason);
    event SyncProposed(address indexed user, uint256 delta, bool isMint, uint256 nonce);

    uint256 public autoApproveThreshold = 100 * 10**18;

    mapping(address => uint256) public lastMintBlock;
    mapping(address => uint256) public accountNonces;

    struct SyncProposal {
        uint256 delta;
        bool isMint;
        bool executed;
    }

    mapping(address => mapping(uint256 => SyncProposal)) public syncProposals;

    constructor() ERC20("Samsung Participation Unit", "SPU") ERC20Permit("SPU") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Oracle role must be granted post-deployment by ADMIN
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function triggerCircuitBreaker(string calldata reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
        emit CircuitBreakerTripped(msg.sender, reason);
    }

    function recoverCircuitBreaker() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function proposeSync(address user, uint256 delta, bool isMint, uint256 nonce) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(nonce == accountNonces[user]++, "Stale Nonce / Replay Error");
        
        syncProposals[user][nonce] = SyncProposal({
            delta: delta,
            isMint: isMint,
            executed: false
        });

        emit SyncProposed(user, delta, isMint, nonce);

        // Auto approve safe thresholds
        if (delta <= autoApproveThreshold) {
            _executeSync(user, nonce);
        }
    }

    function confirmSync(address user, uint256 nonce) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        _executeSync(user, nonce);
    }

    function _executeSync(address user, uint256 nonce) internal {
        SyncProposal storage proposal = syncProposals[user][nonce];
        require(!proposal.executed, "Sync already executed");
        require(proposal.delta > 0 || proposal.isMint == false, "Invalid proposal delta zero");

        proposal.executed = true;

        if (proposal.isMint) {
            uint256 currentSupply = totalSupply();
            require(proposal.delta <= currentSupply / 100, "Violates 1% max mint constraint per tx");
            
            // Record mint block enforcing Voting Delays
            lastMintBlock[user] = block.number;
            _mint(user, proposal.delta);
            emit OracleMint(user, proposal.delta);
        } else {
            _burn(user, proposal.delta);
            emit OracleBurn(user, proposal.delta);
        }
    }

    // Overrides required by Solidity OZ v5
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) whenNotPaused {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
