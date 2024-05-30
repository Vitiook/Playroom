// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import "../interfaces/IRoomCoin.sol";

contract PrivateRoundStage1Lock is Ownable, ReentrancyGuard {
  using SafeERC20 for ERC20;

  uint256 constant public unlockPeriod = 2592000;     // 2592000 - 30 days in seconds
  uint256 constant public percentDeniminator = 10000; // 10000 = 100,00%
  uint256 constant public tgePercent = 500;           // 500 = 5,00%
  uint256 constant public unlockPercent = 475;        // 475 = 4,75%
  uint256 constant public cliff = 3;
  uint256 constant public marketingPercent = 2500;    // 2500 = 25,00%
  uint256 constant public teamPercent = 1670;         // 1670 = 16,70%
  uint256 constant public reservePercent = 1670;      // 1670 = 16,70%
  uint256 constant public liquidityPercent = 4160;    // 4160 = 41,60%
  uint256 constant public priceDeniminator = 100;     // 100 = 1,00$
  uint256 constant public tokenPriceUSD = 60;         // 60 = 0,60$
  uint256 constant public maxUsdAmount = 2000000;     // 2000000 = 20000,00$
  uint256 constant public minUsdAmount = 500000;      // 500000 = 5000,00$

  mapping(address => uint256) public balance;
  mapping(address => uint256) public claimedByUser;
  mapping(address => uint256) public balanceInUSD;

  uint256 public avalableToClaimGlobal;
  uint256 public tokensSoldAmount;
  uint256 public tokensSoldAmountMax;
  uint256 public nextUnlock;
  uint256 public startUnlock;
  bool public seedIsStarted;
  bool public vestingIsStarted;
  address public marketingAddress;
  address public teamAddress;
  address public reserveAddress;
  address public liquidityAddress;

  IRoomCoin private _token;
  ERC20 private _usd;

  event Claim(address indexed _claimer, uint256 _amount);
  event Buy(address indexed _spender, uint256 _amountreceive, uint256 _amountsend);
  event Phase(address indexed _activator, string _typeoperation);

  constructor(
    address initialOwner_, 
    address tokenAddress_, 
    address usdAddress_,
    address marketingAddress_, 
    address teamAddress_, 
    address reserveAddress_,
    address liquidityAddress_
  ) Ownable(initialOwner_) {
    _token = IRoomCoin(tokenAddress_);
    _usd = ERC20(usdAddress_);
    marketingAddress = marketingAddress_;
    teamAddress = teamAddress_;
    reserveAddress = reserveAddress_;
    liquidityAddress = liquidityAddress_;
  }

  function startSeed() public onlyOwner() {
    require(tokensSoldAmountMax == 0);
    require(_token.balanceOf(address(this)) != 0);
    require(!seedIsStarted);
    seedIsStarted = true;
    tokensSoldAmountMax = _token.balanceOf(address(this));
    emit Phase(msg.sender, string("start"));
  }

  function stopSeed() public onlyOwner() {
    require(seedIsStarted);
    seedIsStarted = false;
    emit Phase(msg.sender, string("stop"));
  }

  function resumeSeed() public onlyOwner() {
    require(tokensSoldAmountMax != 0);
    require(!seedIsStarted);
    seedIsStarted = true;
    emit Phase(msg.sender, string("resume"));
  }

  function startVesting() public onlyOwner() {
    require(!seedIsStarted);
    require(!vestingIsStarted);
    vestingIsStarted = true;
    startUnlock = block.timestamp;
    nextUnlock = startUnlock + (unlockPeriod * cliff);
    avalableToClaimGlobal = tgePercent;
    uint256 burnAmount = tokensSoldAmountMax - tokensSoldAmount;
    _token.burn(burnAmount);
    emit Phase(msg.sender, string("startVesting"));
  }

  function buy(uint256 amountUSD_) nonReentrant() public {
    require(tokensSoldAmount < tokensSoldAmountMax);
    require(seedIsStarted);
    uint256 usdDenominator = 10 ** _usd.decimals();
    uint256 tokenDenominator = 10 ** _token.decimals();
    if (balance[msg.sender] == 0) {
      require(amountUSD_ >= (minUsdAmount * usdDenominator / priceDeniminator));
      require(amountUSD_ <= (maxUsdAmount * usdDenominator / priceDeniminator));
    }
    require(balanceInUSD[msg.sender] + amountUSD_ <= maxUsdAmount * usdDenominator / priceDeniminator);
    uint256 tokenAmount = amountUSD_ * tokenDenominator * priceDeniminator / (tokenPriceUSD * usdDenominator);
    require(tokenAmount <= tokensSoldAmountMax - tokensSoldAmount);
    _usd.safeTransferFrom(msg.sender, address(this), amountUSD_);
    balanceInUSD[msg.sender] += amountUSD_;
    balance[msg.sender] += tokenAmount;
    tokensSoldAmount += tokenAmount;
    uint256 minTokenAmount = minUsdAmount * tokenDenominator / tokenPriceUSD;
    emit Buy(msg.sender, tokenAmount, amountUSD_);
    if (tokensSoldAmountMax - tokensSoldAmount < minTokenAmount) stopSeed();
  }

  function claim() nonReentrant() public {
    require(vestingIsStarted);
    require(balance[msg.sender] > 0);
    if (block.timestamp > nextUnlock) {
      avalableToClaimGlobal += unlockPercent;
      if (avalableToClaimGlobal >= percentDeniminator) {
        nextUnlock = ~uint256(0);
        avalableToClaimGlobal = percentDeniminator;
      } else {
        nextUnlock = block.timestamp + unlockPeriod;
      }
    }
    uint256 _avalableAmount = balance[msg.sender] * avalableToClaimGlobal / percentDeniminator;
    require(_avalableAmount > claimedByUser[msg.sender]);
    uint256 _amount = _avalableAmount - claimedByUser[msg.sender];
    claimedByUser[msg.sender] += _amount;
    _token.transfer(msg.sender, _amount);
    emit Claim(msg.sender, _amount);
  }

  function distributionBUSD() public onlyOwner() {
    uint256 _totalBalanceBUSD = _usd.balanceOf(address(this));
    require(_totalBalanceBUSD > 0);
    require(!seedIsStarted);
    uint256 _marketingAmount = _totalBalanceBUSD * marketingPercent / percentDeniminator;
    uint256 _teamAmount = _totalBalanceBUSD * teamPercent / percentDeniminator;
    uint256 _reserveAmount = _totalBalanceBUSD * reservePercent / percentDeniminator;
    uint256 _liquidityAmount = _totalBalanceBUSD * liquidityPercent / percentDeniminator;
    _usd.safeTransfer(marketingAddress, _marketingAmount);
    _usd.safeTransfer(teamAddress, _teamAmount);
    _usd.safeTransfer(reserveAddress, _reserveAmount);
    _usd.safeTransfer(liquidityAddress, _liquidityAmount);
    emit Phase(msg.sender, string("distributionBUSD"));
  }
}
