// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import './interfaces/ILottery.sol';
import './interfaces/IDataFeeds.sol';

error TicketSameNumbers();
error TicketWrongNumber();
error TicketZeroCount();
error WrongIndexes();

contract Lottery is ILottery, Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
  bytes32 public constant LOTTERY_ADMIN_ROLE = keccak256("LOTTERY_ADMIN_ROLE");

  uint public constant MAX_FEE_AMOUNT = 2000; // 20%

  address dataFeeds;
  address token;

  uint public ticketPrice;
  uint public lotteryFee; // percents, 10000 = 100%
  uint public lotteryCount;
  uint public totalJackpot;
  uint public unpaidWinnings;

  mapping(uint => Lottery) public lotteries;
  mapping(address => uint) public tickets;
  mapping(uint => mapping(uint => Ticket)) public activeTickets;
  mapping(uint => mapping(WinType => LotteryResult)) public lotteryResults;

  function initialize(address dataFeeds_, address token_, uint ticketPrice_, uint lotteryFee_) external initializer {
    dataFeeds = dataFeeds_;
    token = token_;
    ticketPrice = ticketPrice_;
    lotteryFee = lotteryFee_;

    __AccessControl_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function getLottery(uint fromId_, uint toId_) external view returns (LotteryInfo[] memory) {
    if (toId_ < fromId_) revert WrongIndexes();

    uint count = toId_ - fromId_ + 1;
    LotteryInfo[] memory result = new LotteryInfo[](count);

    for (uint i = 0; i < count; i += 1) {
      Lottery memory lottery = lotteries[i + fromId_];

      result[i].lottery = lottery;

      if (lottery.lotteryStatus == LotteryStatus.Calculated) {
        for (uint j = 0; j < 5; j += 1) {
          result[i].results[j] = lotteryResults[i + fromId_][WinType(j)];
        }
      }
    }

    return result;
  }

  function getTicket(uint lotteryId_, uint fromId_, uint toId_) external view returns (TicketInfo[] memory) {
    if (toId_ < fromId_) revert WrongIndexes();

    Lottery memory lottery = lotteries[lotteryId_];

    uint count = toId_ - fromId_ + 1;
    TicketInfo[] memory result = new TicketInfo[](count);

    for (uint i = 0; i < count; i += 1) {
      Ticket memory ticket = activeTickets[lotteryId_][i + fromId_];

      result[i].ticket = ticket;

      if (lottery.lotteryStatus == LotteryStatus.Drawn) {
        result[i].winType = _checkWinNumbers6(lottery.numbers, ticket.numbers);
      }
      if (lottery.lotteryStatus == LotteryStatus.Calculated) {
        result[i].winType = _checkWinNumbers6(lottery.numbers, ticket.numbers);
        result[i].winAmount = lotteryResults[lotteryId_][result[i].winType].winValue;
      }
    }

    return result;
  }

  function setTicketPrice(uint price_) onlyRole(LOTTERY_ADMIN_ROLE) external {
    if (price_ == 0) revert('Lottery: Wrong ticket price');

    ticketPrice = price_;

    emit SetFee(msg.sender, price_);
  }

  function setDataFeeds(address datafeeds_) onlyRole(LOTTERY_ADMIN_ROLE) external {
    if (datafeeds_ == address(0)) revert('Lottery: Wrong datafeeds address');

    dataFeeds = datafeeds_;

    emit SetDataFeeds(msg.sender, datafeeds_);
  }

  function initLottery(LotteryType lotteryType_, uint date_) onlyRole(LOTTERY_ADMIN_ROLE) external {
    Lottery storage lottery = lotteries[lotteryCount];

    lottery.lotteryStatus = LotteryStatus.Init;
    lottery.lotteryType = lotteryType_;
    lottery.date = date_;

    emit InitLottery(lotteryCount++, lotteryType_, date_);
  }

  function drawnLottery(uint lotteryId_, bytes32 salt_) onlyRole(LOTTERY_ADMIN_ROLE) external {
    Lottery storage lottery = lotteries[lotteryId_];

    if (lottery.lotteryStatus != LotteryStatus.Init) revert('Lottery: Lottery not init');
    if (lottery.date > block.timestamp) revert('Lottery: Lottery is not over');
    
    bytes6 numbers = IDataFeeds(dataFeeds).getRandomLotto_6_49(salt_);

    lottery.numbers = numbers;
    lottery.lotteryStatus = LotteryStatus.Drawn;

    emit DrawnLottery(lotteryId_, numbers);
  }

  function calculateLottery(
    uint lotteryId_, 
    uint currentJackpot_, 
    uint poolAmount_, 
    uint[5] memory winTickets_, 
    uint[5] memory winAmount_
  ) onlyRole(LOTTERY_ADMIN_ROLE) external {
    if (poolAmount_ > totalJackpot || poolAmount_ > currentJackpot_) revert('Lottery: Lottery pool is too much');

    Lottery storage lottery = lotteries[lotteryId_];

    if (lottery.lotteryStatus != LotteryStatus.Drawn) revert('Lottery: Lottery not drawn');
    if (lottery.ticketsCount != winTickets_[0] + winTickets_[1] + winTickets_[2] + winTickets_[3] + winTickets_[4]) 
      revert('Lottery: Wrong tickets count');
    if (poolAmount_ != winTickets_[0] * winAmount_[0] + winTickets_[1] * winAmount_[1] + winTickets_[2] * winAmount_[2] + winTickets_[3] * winAmount_[3] + winTickets_[4] * winAmount_[4])
      revert('Lottery: Wrong pool value');

    lotteryResults[lotteryId_][WinType.None] = LotteryResult(winTickets_[0], winAmount_[0]);
    lotteryResults[lotteryId_][WinType.ThreeNum] = LotteryResult(winTickets_[1], winAmount_[1]);
    lotteryResults[lotteryId_][WinType.FourNum] = LotteryResult(winTickets_[2], winAmount_[2]);
    lotteryResults[lotteryId_][WinType.FiveNum] = LotteryResult(winTickets_[3], winAmount_[3]);
    lotteryResults[lotteryId_][WinType.SixNum] = LotteryResult(winTickets_[4], winAmount_[4]);
    
    totalJackpot -= poolAmount_;
    unpaidWinnings += poolAmount_;
    lottery.lotteryStatus = LotteryStatus.Calculated;
    lottery.currentJackpot = currentJackpot_;

    emit CalculateLottery(lotteryId_, currentJackpot_, poolAmount_, winTickets_, winAmount_);
  }

  function buyTickets(uint ticketsCount_) external nonReentrant() {
    if (ticketsCount_ == 0) revert TicketZeroCount();

    uint tokenAmount = ticketPrice * ticketsCount_;
    uint fee = tokenAmount * lotteryFee / 10000;

    IERC20(token).transferFrom(msg.sender, address(this), tokenAmount);

    tickets[msg.sender] += ticketsCount_;
    totalJackpot += tokenAmount - fee;

    emit BuyTickets(msg.sender, ticketsCount_);
  }

  function registerTickets(uint lotteryId_, bytes6[] memory numbers_) external nonReentrant() {
    Lottery storage lottery = lotteries[lotteryId_];
    if (lottery.lotteryStatus != LotteryStatus.Init) revert('Lottery: Lottery not init');
    if (lottery.date <= block.timestamp) revert('Lottery: Lottery time is over');

    uint ticketsCount = numbers_.length;
    if (ticketsCount == 0) revert TicketZeroCount();
    if (ticketsCount > tickets[msg.sender]) revert('Lottery: Not enough tickets');

    uint counter = lottery.ticketsCount;

    for (uint i = 0; i < numbers_.length; i += 1) {
      _addTicket(lotteryId_, counter++, msg.sender, numbers_[i]);
    }

    tickets[msg.sender] -= ticketsCount;
    lottery.ticketsCount = counter;
  }

  function claimTickket(uint lotteryId_, uint[] memory ticketIds_) external nonReentrant() {
    Lottery storage lottery = lotteries[lotteryId_];
    if (lottery.lotteryStatus != LotteryStatus.Calculated) revert('Lottery: Lottery not calculated');
    if (ticketIds_.length == 0) revert TicketZeroCount();

    uint paidAmount;

    for (uint i = 0; i < ticketIds_.length; i += 1) {
      Ticket storage ticket = activeTickets[lotteryId_][ticketIds_[i]];

      if (!ticket.active) revert('Lottery: Ticket not active');
      if (ticket.paid) revert('Lottery: Ticket is already paid');
      if (ticket.owner != msg.sender) revert('Lottery: Wrong ticket owner');

      WinType winType = _checkWinNumbers6(lottery.numbers, ticket.numbers);
      uint winAmount = lotteryResults[lotteryId_][winType].winValue;

      if (winAmount == 0) revert('Lottery: Ticket is not winning');

      paidAmount += winAmount;
      ticket.paid = true;

      emit ClaimTicket(lotteryId_, ticketIds_[i], winAmount);
    }

    unpaidWinnings -= paidAmount;
    IERC20(token).transfer(msg.sender, paidAmount);
  }

  function setFee(uint fee_) onlyRole(LOTTERY_ADMIN_ROLE) external {
    if (fee_ > MAX_FEE_AMOUNT) revert('Lottery: Wrong fee value');

    lotteryFee = fee_;

    emit SetFee(msg.sender, fee_);
  }

  function withdrawFee(address payable reciever_) onlyRole(LOTTERY_ADMIN_ROLE) external {
    uint balance = IERC20(token).balanceOf(address(this));

    if (balance <= totalJackpot + unpaidWinnings) revert('Lottery: No fee');

    uint amountfee = balance - totalJackpot - unpaidWinnings;

    IERC20(token).transfer(reciever_,amountfee);

    emit WithdrawFee(reciever_, amountfee);
  }

  function _addTicket(uint lotteryId_, uint ticketId_, address owner_, bytes6 numbers_) private {
    _checkTicket_6_49(numbers_);

    Ticket storage ticket = activeTickets[lotteryId_][ticketId_];

    ticket.active = true;
    ticket.owner = owner_;
    ticket.numbers = numbers_;

    emit RegisterTicket(lotteryId_, ticketId_, owner_, numbers_);
  }

  function _checkWinNumbers6(bytes6 b1_, bytes6 b2_) public pure returns(WinType) {
    uint win;

    for (uint i = 0; i < 6; i += 1) {
      for (uint j = 0; j < 6; j += 1) {
        if (b1_[i] == b2_[j]) win++;
      }
    }

    if (win == 3) return WinType.ThreeNum;
    if (win == 4) return WinType.FourNum;
    if (win == 5) return WinType.FiveNum;
    if (win == 6) return WinType.SixNum;
    return WinType.None;
  }

  function _checkTicket_6_49(bytes6 numbers_) private pure {
    // //second part is more effective for gas
    // for (uint i = 0; i < 6; i += 1) {
    //   if (uint8(numbers_[i]) > 49 || uint8(numbers_[i]) == 0) revert TicketWrongNumber();
    //   for (uint j = 5; j > i; j -= 1) {
    //     if (numbers_[i] == numbers_[j]) revert TicketSameNumbers();
    //   }
    // }

    if (uint8(numbers_[0]) > 49 || uint8(numbers_[0]) == 0) revert TicketWrongNumber();
    if (uint8(numbers_[1]) > 49 || uint8(numbers_[1]) == 0) revert TicketWrongNumber();
    if (uint8(numbers_[2]) > 49 || uint8(numbers_[2]) == 0) revert TicketWrongNumber();
    if (uint8(numbers_[3]) > 49 || uint8(numbers_[3]) == 0) revert TicketWrongNumber();
    if (uint8(numbers_[4]) > 49 || uint8(numbers_[4]) == 0) revert TicketWrongNumber();
    if (uint8(numbers_[5]) > 49 || uint8(numbers_[5]) == 0) revert TicketWrongNumber();

    if (numbers_[0] == numbers_[1]) revert TicketSameNumbers();
    if (numbers_[0] == numbers_[2]) revert TicketSameNumbers();
    if (numbers_[0] == numbers_[3]) revert TicketSameNumbers();
    if (numbers_[0] == numbers_[4]) revert TicketSameNumbers();
    if (numbers_[0] == numbers_[5]) revert TicketSameNumbers();
    if (numbers_[1] == numbers_[2]) revert TicketSameNumbers();
    if (numbers_[1] == numbers_[3]) revert TicketSameNumbers();
    if (numbers_[1] == numbers_[4]) revert TicketSameNumbers();
    if (numbers_[1] == numbers_[5]) revert TicketSameNumbers();
    if (numbers_[2] == numbers_[3]) revert TicketSameNumbers();
    if (numbers_[2] == numbers_[4]) revert TicketSameNumbers();
    if (numbers_[2] == numbers_[5]) revert TicketSameNumbers();
    if (numbers_[3] == numbers_[4]) revert TicketSameNumbers();
    if (numbers_[3] == numbers_[5]) revert TicketSameNumbers();
    if (numbers_[4] == numbers_[5]) revert TicketSameNumbers();
  }

  function _numbersFromBytes6(bytes6 bytes_) private pure returns(uint8[6] memory) {
    uint8[6] memory result;
    for (uint i = 0; i < 6; i += 1) {
      result[i] = uint8(bytes_[i]);
    }
    return result;
  }
}
