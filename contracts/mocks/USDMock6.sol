// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDMock6 is ERC20 {
	constructor() ERC20("USD Mock 6", "USD6") {}

	function mint(address account_, uint256 value_) public {
		_mint(account_, value_);
	}

	function burn(address account_, uint256 value_) public {
		_burn(account_, value_);
	}

	function decimals() public pure override returns (uint8) {
		return 6;
	}
}