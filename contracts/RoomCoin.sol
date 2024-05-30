// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

import "./interfaces/IRoomCoin.sol";

contract RoomCoin is IRoomCoin, AccessControlEnumerable, ERC20 {
  bytes32 public constant RMC_PAIR_ROLE = keccak256("RMC_PAIR_ROLE");
  uint256 public constant MAX_BLOCK_TIMEOUT = 28800;  // ~1 day
  uint256 public constant MAX_FEE_AMOUNT = 5;         // 5%

  uint256 public startBlock;
  uint256 public fee;
  uint256 public blockTimeout;
  uint256 public deadBlocks;
  uint256 public maxTxAmount;
  bool public isTradingEnabled;
  bool public antibot;

  mapping(address => bool) public isBlacklisted;
  mapping(address => bool) public isWhitelisted;
  mapping(address => bool) public isDisabledFee;
  mapping(address => uint256) public lastTransfer;


  constructor(address initialOwner_) 
    ERC20('Room Coin', 'RMC')
  {
    _grantRole(DEFAULT_ADMIN_ROLE, initialOwner_);

    super._update(address(0), initialOwner_, 10_000_000 * 10 ** decimals());

    _setIsWhitelisted(initialOwner_, true);
    _setIsDisabledFee(initialOwner_, true);
    _setIsWhitelisted(address(this), true);
    
    fee = 2;
    blockTimeout = 10;
    deadBlocks = 5;
    maxTxAmount = 1_000_000 * 10 ** decimals();
    antibot = true;
  }

  function openTrade() public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (isTradingEnabled) revert("RoomCoin: Trading is already enabled");

    isTradingEnabled = true;
    startBlock = block.number;

    emit OpenTrade(startBlock);
  }

  function setFee(uint256 fee_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (fee_ > MAX_FEE_AMOUNT) revert("RoomCoin: Wronf fee amount");

    fee = fee_;

    emit SetFee(fee_);
  }

  function setBlockTimeout(uint256 blockTimeout_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (blockTimeout_ > MAX_BLOCK_TIMEOUT) revert("RoomCoin: Block timeout can't be more when 1 day");

    blockTimeout = blockTimeout_;

    emit SetBlockTimeout(blockTimeout_);
  }

  function setDeadBlocks(uint256 deadBlocks_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    deadBlocks = deadBlocks_;

    emit SetDeadBlocks(deadBlocks_);
  }

  function setMaxTxAmount(uint256 amount_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (amount_ > totalSupply()) revert("RoomCoin: Max tx amount can't be more than total supply");
    if (amount_ == 0) revert("RoomCoin: Max tx amount can't be zero");

    maxTxAmount = amount_;

    emit SetMaxTxAmount(amount_);
  }

  function setAntibot(bool value_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    antibot = value_;

    emit SetAntibot(value_);
  }

  function setIsWhitelisted(address account_, bool value_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setIsWhitelisted(account_, value_);
  }

  function setBanchIsWhitelisted(address[] calldata accounts_, bool value_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    for (uint256 i = 0; i < accounts_.length; i++) {
      _setIsWhitelisted(accounts_[i], value_);
    }
  }

  function setIsBlacklisted(address account_, bool value_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setIsBlacklisted(account_, value_);
  }

  function setBanchIsBlacklisted(address[] calldata accounts_, bool value_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    for (uint256 i = 0; i < accounts_.length; i++) {
      _setIsBlacklisted(accounts_[i], value_);
    }
  }

  function setIsDisabledFee(address account_, bool value_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setIsDisabledFee(account_, value_);
  }

  function decimals() public view override(ERC20, IRoomCoin) returns (uint8) {
    return super.decimals();
  }

  function burn(uint256 amount_) public returns (bool) {
    super._update(msg.sender, address(0), amount_);
    return true;
  }

  function _update(address from_, address to_, uint256 value_) internal override {
    uint value = value_;

    if (!isWhitelisted[from_] && !isWhitelisted[to_]) {
      if (!isTradingEnabled) revert("RoomCoin: Trading is disabled");
      if (isBlacklisted[from_] || isBlacklisted[to_]) revert("RoomCoin: Blacklisted address");
      if (value > maxTxAmount) revert("RoomCoin: Amount must be lower maxTxAmount");
      if (hasRole(RMC_PAIR_ROLE, from_)) {
        lastTransfer[to_] = block.number;
        if (antibot) _antibot(to_);
      }
      if (hasRole(RMC_PAIR_ROLE, to_)) {
        if(lastTransfer[from_] + blockTimeout > block.number) revert("RoomCoin: Not time yet");
        if (antibot) _antibot(from_);
      }

      if(!isDisabledFee[from_] && fee != 0) {
        uint256 feeAmount = value * fee / 100;
        super._update(from_, address(0), feeAmount);
        value -= feeAmount;
      }
    }

    super._update(from_, to_, value);
  }

  function _antibot(address account) private {
    if (startBlock + deadBlocks >= block.number) {
      _setIsBlacklisted(account, true);
    } else {
      antibot = false;
    }
  }

  function _setIsWhitelisted(address account_, bool value_) private {
    isWhitelisted[account_] = value_;

    emit SetIsWhitelisted(account_, value_);
  }

  function _setIsBlacklisted(address account_, bool value_) private {
    isBlacklisted[account_] = value_;

    emit SetIsBlacklisted(account_, value_);
  }

  function _setIsDisabledFee(address account_, bool value_) private {
    isDisabledFee[account_] = value_;

    emit SetIsDisabledFee(account_, value_);
  }
}