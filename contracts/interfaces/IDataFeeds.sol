// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDataFeeds {
  function getRandomLotto_6_49(bytes32 salt_) external returns(bytes6);
  function getRandomBingoNumbers(bytes32 salt_, uint8 maxNumber_) external returns(bytes memory);
  function getOrderedArray(uint8 from_, uint8 to_) external returns(uint8[] memory);
  function getNumbersFromBytes(bytes memory bytes_) external returns(uint8[] memory);
}