// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

contract AdvisorsLock is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  uint256 constant public unlockPeriod = 2592000;       // 2592000 - 30 days in seconds
  uint256 constant public percentDeniminator = 10000;   // 10000 = 100,00%
  uint256 constant public tgePercent = 0;               // 0 = 0,00%
  uint256 constant public unlockPercent = 500;          // 500 = 5,00%
  uint256 constant public cliff = 9;

  uint256 public avalableToClaimGlobal;
  uint256 public claimed;
  uint256 public distributionAmount;
  uint256 public nextUnlock;
  uint256 public startUnlock;
  bool public vestingIsStarted;
  address public recipientAddress;
  IERC20 private _token;

  constructor(address initialOwner_, address tokenAddress_, address recipientAddress_) Ownable(initialOwner_) {
    recipientAddress = recipientAddress_;
    _token = IERC20(tokenAddress_);
  }

  function startVesting() public onlyOwner() {
    require(!vestingIsStarted);
    vestingIsStarted = true;
    startUnlock = block.timestamp;
    nextUnlock = startUnlock + (unlockPeriod * cliff);
    avalableToClaimGlobal = tgePercent;
    distributionAmount = _token.balanceOf(address(this));
  }

  function claim() nonReentrant() public {
    require(vestingIsStarted);
    if (block.timestamp > nextUnlock) {
      avalableToClaimGlobal += unlockPercent;
      if (avalableToClaimGlobal > percentDeniminator) {
        nextUnlock = ~uint256(0);
        avalableToClaimGlobal = percentDeniminator;
      } else {
        nextUnlock = block.timestamp + unlockPeriod;
      }
    }
    uint256 _avalableAmount = distributionAmount * avalableToClaimGlobal / percentDeniminator;
    require(_avalableAmount > claimed);
    uint256 _amount = _avalableAmount - claimed;
    claimed += _amount;
    _token.safeTransfer(recipientAddress, _amount);
  }

  function changeRecipientAddress(address recipientAddress_) public onlyOwner() {
    recipientAddress = recipientAddress_;
  }
}
