// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBingo {
  function setDataFeeds(address dataFeeds_) external;
  function addTable(bytes32 salt_, uint8 maxNumber_) external;

  event SetDataFeeds(address admin, address datafeeds);
  event AddTable(address admin, uint tableId, bytes numbers);
}