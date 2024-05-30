// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import './interfaces/IDataFeeds.sol';

error WrongMaxNumber();

contract DataFeeds is IDataFeeds {
  function getRandomLotto_6_49(bytes32 salt_) external view returns(bytes6) {
    bytes32 random = keccak256(abi.encodePacked(block.prevrandao, block.number, block.timestamp));

    uint8[] memory orderedArray = getOrderedArray(1, 49);
    uint8[6] memory resultNumbers;

    for (uint8 i = 0; i < 6; i += 1) {
      uint randomNumber = uint256(keccak256(abi.encodePacked(
        salt_[i + 4], salt_[i + 3], salt_[i + 2], salt_[i + 1], salt_[i],
        random[i], random[i + 1], random[i + 2], random[i + 3], random[i + 4]
      )));
      uint index = _getRoundNumber(randomNumber, 48 - i);
      resultNumbers[i] = orderedArray[index];
      orderedArray[index] = orderedArray[orderedArray.length - 1 - i];
    }

    return bytes6(abi.encodePacked(resultNumbers[0], resultNumbers[1], resultNumbers[2], resultNumbers[3], resultNumbers[4], resultNumbers[5]));
  }

  function getRandomBingoNumbers(bytes32 salt_, uint8 maxNumber_) external view returns(bytes memory) {
    if (maxNumber_ > 96) revert WrongMaxNumber();
    if (maxNumber_ == 0) revert WrongMaxNumber();

    bytes memory random = abi.encodePacked(
      keccak256(abi.encodePacked(block.number, salt_)),
      keccak256(abi.encodePacked(block.prevrandao, salt_)),
      keccak256(abi.encodePacked(block.timestamp, salt_))
    );
    uint8[] memory orderedArray = getOrderedArray(1, maxNumber_);

    bytes memory result = new bytes(maxNumber_);

    for (uint8 i = 0; i < maxNumber_ - 1; i += 1) {
      uint randomNumber = uint256(keccak256(abi.encodePacked(random[i])));
      uint index = _getRoundNumber(randomNumber, maxNumber_ - i - 1);
      result[i] = bytes1(orderedArray[index]);
      orderedArray[index] = orderedArray[maxNumber_ - 1 - i];
    }

    result[maxNumber_ - 1] = bytes1(orderedArray[0]);

    return result;
  }

  function getOrderedArray(uint8 from_, uint8 to_) public pure returns(uint8[] memory) {
    if (from_ > to_) revert('DataFeeds: Wrong borders');

    uint8[] memory result = new uint8[](to_ - from_ + 1);

    for (uint8 i = 0; i <= to_ - from_; i += 1) {
      result[i] = from_ + i;
    }

    return result;
  }

  function getNumbersFromBytes(bytes memory bytes_) public pure returns(uint8[] memory) {
    uint8[] memory result = new uint8[](bytes_.length);
    for (uint i = 0; i < bytes_.length; i += 1) {
      result[i] = uint8(bytes_[i]);
    }

    return result;
  }

  // Need big value number >>> maxValue
  function _getRoundNumber(uint number_, uint8 maxNumber_) private pure returns(uint8) {
    if (maxNumber_ == 0) revert WrongMaxNumber();

    return uint8(number_ % (maxNumber_ + 1));
  }
}
