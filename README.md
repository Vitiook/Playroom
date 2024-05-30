# Lottery and Bingo Contracts

## Description

The smart contract system is designed for conducting lotteries and creating tables for bingo games. To ensure random results, a separate smart contract is used with the generation of pseudorandom numbers in the required format. ERC20 tokens, which are used only within our system and are tied to the stablecoins we use, are utilized for purchasing tickets and paying out winnings. When the lottery is drawn, the calculation of results is facilitated by the backend, as such calculations on the blockchain side are very costly and inefficient.

## Project structure

```├──  contracts/ # contracts
├──  deploy/ # scripts for deploy
├──  deployments/ # deployments
├──  scripts/ # scripts
├──  test/ # test cases
├──  .env.sample # example of .env file
├──  .gitignore
├──  hardhat.config.js # config for deploying or testing on various networks
├──  package-lock.json
├──  package.json
└──  README.md
```

## Local development

### .ENV

#### Setup .env file

- `MNEMONIC_LOCAL` - mnemonic for tests
- `MNEMONIC` - mnemonic for deploy
- `INFURA_API_KEY` - infura api key
- `REPORT_GAS` - true if you need report gas
- `COINMARKETCAP_API_KEY` - coinmarketcap api key
- `ETHERSCAN_KEY` - etherscan api key

#### value for deployment

- `TOKEN_NAME` - the name of the internal stablecoin token
- `TOKEN_SYMBOL` - the symbol of the internal stablecoin token
- `TICKET_PRICE` - the price of the token, which is set when the contract is initialized
- `LOTTERY_FEE` - the value of the commission for ticket sales, which is set when the contract is initialized

## Setup

- Copy the `.env.example` file into `.env` and add the values and keys
- Install the dependencies
```npm install```

## Smart contracts

| Contract        | Description                                                                  |
|-----------------|------------------------------------------------------------------------------|
| Lottery | This smart contract that ensures the lottery draw. Stores all ticket and lottery data.|
| Token | Implementation of an ERC20 token for an internal stablecoin. |
| Bingo | This smart contract that ensures the addition of new tables with the required set of numbers. Saves all created tables. |
| DataFeeds | This smart contract generates pseudo random data for Lottery and Bingo contract. |

## Smart contract descriptions

### Token.sol

The token contract is implemented based on the openzeppelin ERC20Upgradeable contract. The contract is upgradeable. The token is used for calculations within the lottery system. All transfers can only be made between our contracts and lottery participants.

The contract has a role system that includes three roles:

- `DEFAULT_ADMIN_ROLE` - the default super admin role that assigns and removes all other roles. It is assigned to the owner during contract initialization.

- `TOKEN_ADMIN_ROLE` - the token admin role that has the right to mint and burn tokens at any address. Used for conversion between stable coins and internal tokens.

- `CONTRACT_ROLE` - the contract role that is assigned to the contracts used in the system. All transfers without an address with this role are blocked. Currently, this role is assigned to the Lottery contract.

### DataFeeds.sol

A smart contract for generating pseudo-random numbers. The contract is not upgradeable as it does not contain any data, only methods for generating results for lotteries and bingo. It can be replaced by another contract at any time and set in the lottery and bingo contracts.

The contract has the following primary methods:

- `getRandomLotto_6_49` - returns 6 unique random numbers from 1 to 49 in bytes6 format. The function takes a salt parameter of type bytes32 which is considered in the number generation.

- `getRandomBingoNumbers` - returns a set of unique random numbers from 1 to the specified maximum value when the function is called. The maximum number that can be passed is 96, meaning the maximum set will consist of 96 numbers. The function takes a salt parameter of type bytes32 which is considered in the number generation.

- `getNumbersFromBytes` - a helper function for converting bytes of any size into an array of numbers, where each byte in the bytes corresponds to a number in the array.

### Lottery.sol

A smart contract for conducting lotteries with the ability to be updated. Each lottery is initialized, drawn, and calculated by the lottery administrator. All lotteries and their results are stored in the contract. During initialization, the administrator specifies the type of lottery and the draw time. The draw time is a timestamp by which ticket registration is inclusive, and after which the lottery can be drawn and calculated. The lottery cannot be drawn before the draw time and tickets cannot be registered after. During the lottery draw, 6 numbers are taken from the DataFeeds contract and recorded in the lottery as winning numbers. After the lottery draw, each ticket in the lottery displays the win type for the ticket. When calculating the lottery on the backend, all tickets are analyzed, the lottery pool is calculated, and the lottery results are recorded - the number of tickets and the winning amount per ticket for each win type. After calculation, each ticket in the lottery also displays the winning amount and, if it is a winning ticket, the option to claim the prize. Tickets are purchased with internal tokens tied to stable tokens at any time, and the funds are immediately credited to the jackpot, minus the commission. The ticket price is set during contract initialization and can be changed at any time by the lottery administrator. Tickets can only be registered for an active lottery, specifying a set of numbers. All tickets and their results are stored in the contract.

Types of Lotteries: **Weekly**, **Monthly**, **Quarterly**, **Yearly**.

Percentage breakdown for calculating the lottery pool based on type:

- `Weekly` - 3.5% of the jackpot.
- `Monthly` - 10% of the jackpot.
- `Quarterly` - 25% of the jackpot.
- `Yearly` - 100% of the jackpot.

Ticket win types: **None**, **ThreeNum**, **FourNum**, **FiveNum**, **SixNum**.

Percentage breakdown for calculating the portion of the lottery pool for each win type:

- `None` - 0, 1, or 2 numbers matched - 0% of the lottery pool.
- `ThreeNum` - 3 numbers matched - 5% of the lottery pool.
- `FourNum` - 4 numbers matched - 10% of the lottery pool.
- `FiveNum` - 5 numbers matched - 20% of the lottery pool.
- `SixNum` - 6 numbers matched - 65% of the lottery pool.

The portion of the pool for each win type is evenly distributed among the number of tickets with that win type. If there are no winning tickets of a certain type, the portion of the lottery pool for that win type is returned to the jackpot.

When calculating each lottery, the jackpot decreases by the calculated lottery pool value, and the value of unpaid winnings increases accordingly. When selling tickets, the jackpot is credited with the token purchase amount minus the lottery commission, which can be withdrawn by the lottery administrator at any time. The commission can be set from 0 (no commission) to 20% inclusive. The commission rate is set during contract initialization and can be changed at any time by the lottery administrator.

The contract has the following primary methods:

- `getLottery` - returns an array of lottery data based on the specified ID.
- `getTicket` - returns an array of ticket data based on the specified lottery and ticket ID.
- `setTicketPrice` - sets a new ticket price, only for the lottery administrator.
- `setDataFeeds` - sets the address of the contract for obtaining random values, only for the lottery administrator.
- `initLottery` - initializes the lottery, only for the lottery administrator.
- `drawnLottery` - draws the lottery, only for the lottery administrator.
- `calculateLottery` - calculates the lottery, only for the lottery administrator.
- `buyTickets` - purchases tickets.
- `registerTickets` - registers tickets.
- `claimTicket` - claims the winnings of winning tickets.
- `setFee` - sets a new commission, only for the lottery administrator.
- `withdrawFee` - withdraws the commission, only for the lottery administrator.

getLottery returns array:

[

- **LotteryStatus** - lottery status (**NotExist**, **Init**, **Drawn**, **Calculated**),
- **LotteryType** - lottery type (**Weekly**, **Monthly**, **Quarter**, **Yearly**),
- **uint** - timestamp of draw time,
- **uint** - the number of registered tickets,
- **uint** - the size of the jackpot at the time of calculation (filled in during calculation),
- **bytes6** - a set of winning numbers (filled in when drawing),
- **[][]** - array of results (number of tickets and amount of winnings per ticket, filled in during calculation)

]

getTicket returns array:

[

- **bool** - true if the ticket is active (registered),
- **bool** - true if the ticket is paid,
- **address** - address of the ticket holder,
- **bytes6** - numbers specified for the ticket,
- **WinType** - ticket winning type (**None**, **ThreeNum**, **FourNum**, **FiveNum**, **SixNum**), shown after the lottery draw,
- **uint** - the value of the winning ticket is shown after the lottery is calculated

]

### Bingo.sol

This smart contract allows for the addition of bingo game tables with the ability to update them. When a table is added, a set of random numbers is taken from the DateFeeds contract and written to the contract with the table ID. Table IDs start at zero and increase as tables are added. Only the bingo administrator can add tables. The maximum number for a table, which is equal to the number of numbers in the set, can be in the range from 1 to 96.

The contract has the following main methods:

- `addTable`: adds a table with a set of random numbers of the specified size.

## Vesting contracts

### contracts

| Contract        | Description                                                                  |
|-----------------|------------------------------------------------------------------------------|
| RoomCoin | The smart contract is implemented on the basis of the open zeppelin ERC20 contract with added management logic.|
| vesting/StrategicRoundLock | The smart contract for pre-sale and vesting for `Strategic Round`. |
| vesting/SeedRoundLock | The smart contract for pre-sale and vesting for `Seed Round`. |
| vesting/PrivateRoundStage1Lock | TThe smart contract for pre-sale and vesting for `Private Round Stage - 1`. |
| vesting/PrivateRoundStage2Lock | The smart contract for pre-sale and vesting for `Private Round Stage - 2`. |
| vesting/TGELock | The smart contract for pre-sale and vesting for `TGE (IDO)` round. |
| vesting/FoundersAndTeamLock | Smart contract with vesting for `Founders and Team`. |
| vesting/AdvisorsLock | Smart contract with vesting for `Advisors`. |
| vesting/MarketingLock | Smart contract with vesting for `Marketing`. |
| vesting/GamersRewardsLock | Smart contract with vesting for `Gamers rewards`. |
| vesting/DevelopmentLock | Smart contract with vesting for `Development`. |
| vesting/TreasuryLock | Smart contract with vesting for `Treasury`. |

### descriptions

#### RoomCoin.sol

- Name - **Room Coin**
- Symbol - **RMC**
- Total supply - **10.000.000**
- Max fee - **5%**
- The smart contract has a whitelist. If one of the addresses in the whitelist is present in a transfer, the transfer proceeds as a regular ERC20 transfer without processing.
- The smart contract has a blacklist. If one of the addresses in the blacklist is present in a transfer, the transfer is prohibited.
- The whitelist takes precedence over the blacklist. That means if both whitelists are present in a transfer, the transfer proceeds without restrictions.
- There is a restriction on the maximum transaction value in the smart contract, which is set by the contract owner.
- Addresses with the role `RMC_PAIR_ROLE`, granted by the owner, are considered pools.
- There is a restriction on trading with pools in the smart contract. After buying tokens in a pool, selling them can only be done after a certain number of blocks, which is set by the owner.
- There is an anti-bot mechanism in the smart contract, which operates at the beginning of trading for a set number of blocks and adds to the blacklist addresses attempting to interact with registered pools.
- There is a commission in the smart contract, which is burned during a transfer if the commission is not disabled for the sender's address. The maximum commission value is 5% and is set by the owner.

#### Pre-sale + vesting contracts
(*StrategicRoundLock*, *SeedRoundLock*, *PrivateRoundStage1Lock*, *PrivateRoundStage2Lock*, *TGELock*)

The smart contract facilitates token sales after the start of sales and distributes tokens to owners over a set period. For each of the rounds, individual parameters are set according to the tokenomics. The start and end of trading and vesting are set by the contract owner and can be arbitrary.

#### Vesting contracts
(*FoundersAndTeamLock*, *AdvisorsLock*, *MarketingLock*, *GamersRewardsLock*, *DevelopmentLock*, *TreasuryLock*)

The smart contract ensures the distribution of tokens to a specified address over a set period. Individual parameters are set for each contract according to the tokenomics. The start and end of vesting are set by the contract owner and can be arbitrary.
