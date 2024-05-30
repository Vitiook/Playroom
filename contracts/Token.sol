// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';


contract Token is ERC20Upgradeable, AccessControlUpgradeable {
  bytes32 public constant TOKEN_ADMIN_ROLE = keccak256("TOKEN_ADMIN_ROLE");
  bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");

  function initialize(string memory name_, string memory symbol_) external initializer {
    __ERC20_init(name_, symbol_);
    __AccessControl_init();

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function mint(address account_, uint value_) external onlyRole(TOKEN_ADMIN_ROLE) {
    _mint(account_, value_);
  }

  function burn(address account_, uint value_) external onlyRole(TOKEN_ADMIN_ROLE) {
    _burn(account_, value_);
  }

  function transfer(address to_, uint256 value_) public override returns (bool) {
    require(hasRole(CONTRACT_ROLE, msg.sender) || hasRole(CONTRACT_ROLE, to_), 'Token: Forbidden transfer');
    return super.transfer(to_, value_);
  }

  function transferFrom(address from_, address to_, uint256 value_) public override returns (bool) {
    require(hasRole(CONTRACT_ROLE, from_) || hasRole(CONTRACT_ROLE, to_), 'Token: Forbidden transfer');
    return super.transferFrom(from_, to_, value_);
  }
}
