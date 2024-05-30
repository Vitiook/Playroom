// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import './interfaces/IBingo.sol';
import './interfaces/IDataFeeds.sol';

contract Bingo is IBingo, AccessControlUpgradeable {
  bytes32 public constant BINGO_ADMIN_ROLE = keccak256("BINGO_ADMIN_ROLE");

  address public dataFeeds;
  uint public tableCount;

  mapping(uint => bytes) public tables;

  function initialize(address dataFeeds_) external initializer {
    dataFeeds = dataFeeds_;

    __AccessControl_init();

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function setDataFeeds(address dataFeeds_) onlyRole(BINGO_ADMIN_ROLE) external {
    if (dataFeeds_ == address(0)) revert('Bingo: Wrong datafeeds address');

    dataFeeds = dataFeeds_;

    emit SetDataFeeds(msg.sender, dataFeeds_);
  }

  function addTable(bytes32 salt_, uint8 maxNumber_) onlyRole(BINGO_ADMIN_ROLE) external {
    bytes memory numbers = IDataFeeds(dataFeeds).getRandomBingoNumbers(salt_, maxNumber_);
    tables[tableCount] = numbers;

    emit AddTable(msg.sender, tableCount++, numbers);
  }
}