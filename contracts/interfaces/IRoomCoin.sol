// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRoomCoin is IERC20 {
  function burn(uint256 amount_) external returns (bool);
  function decimals() external returns (uint8);

  event OpenTrade(uint256 startBlock);
  event SetFee(uint256 fee);
  event SetBlockTimeout(uint256 blockTimeout);
  event SetDeadBlocks(uint256 deadBlocks);
  event SetMaxTxAmount(uint256 amount);
  event SetPair(address pair);
  event SetAntibot(bool value);
  event SetIsWhitelisted(address account, bool value);
  event SetIsBlacklisted(address account, bool value);
  event SetIsDisabledFee(address account, bool value);
}