// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILottery {
  function getLottery(uint fromId_, uint toId_) external returns (LotteryInfo[] memory);
  function getTicket(uint lotteryId_, uint fromId_, uint toId_) external returns (TicketInfo[] memory);
  function setTicketPrice(uint price_) external;
  function setDataFeeds(address datafeeds_) external;
  function initLottery(LotteryType lotteryType_, uint date_) external;
  function drawnLottery(uint lotteryId_, bytes32 salt_) external;
  function calculateLottery(
    uint lotteryId_, 
    uint currentJackpot_, 
    uint poolAmount_, 
    uint[5] memory winTickets_, 
    uint[5] memory winAmount_
  ) external;
  function buyTickets(uint ticketsCount_) external;
  function registerTickets(uint lotteryId_, bytes6[] memory numbers_) external;
  function claimTickket(uint lotteryId_, uint[] memory ticketIds_) external;
  function setFee(uint fee_) external;
  function withdrawFee(address payable reciever_) external;

  enum LotteryType {
    Weekly,
    Monthly,
    Quarter,
    Yearly
  }

  enum WinType {
    None,
    ThreeNum,
    FourNum,
    FiveNum,
    SixNum
  }

  enum LotteryStatus {
    NotExist,
    Init,
    Drawn,
    Calculated
  }

  struct Lottery {
    LotteryStatus lotteryStatus;
    LotteryType lotteryType;
    uint date;
    bytes6 numbers;
    uint ticketsCount;
    uint currentJackpot;
  }

  struct LotteryResult {
    uint winTickets;
    uint winValue;
  }

  struct Ticket {
    bool active;
    bool paid;
    bytes6 numbers;
    address owner;
  }

  struct LotteryInfo {
    Lottery lottery;
    LotteryResult[5] results;
  }

  struct TicketInfo {
    Ticket ticket;
    WinType winType;
    uint winAmount;
  }

  event InitLottery(uint id, LotteryType lotteryType, uint date);
  event DrawnLottery(uint id, bytes6 numbers);
  event CalculateLottery(uint id, uint currentJackpot, uint poolAmount, uint[5] winTickets, uint[5] winAmount);
  event PaidLottery(uint id, uint[] tickets);
  event EndLottery(uint id);
  event BuyTickets(address owner, uint ticketsCount);
  event RegisterTicket(uint lotteryId, uint ticketId, address owner, bytes6 numbers);
  event ClaimTicket(uint lotteryId, uint ticketId, uint winAmount);
  event SetFee(address admin, uint fee);
  event WithdrawFee(address reciever, uint amount);
  event SetDataFeeds(address admin, address datafeeds);
}