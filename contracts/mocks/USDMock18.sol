// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDMock18 is ERC20 {
	constructor() ERC20("USD Mock 18", "USD18") {}

	function mint(address account_, uint256 value_) public {
		_mint(account_, value_);
	}

	function burn(address account_, uint256 value_) public {
		_burn(account_, value_);
	}
}