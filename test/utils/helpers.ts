import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Bingo, DataFeeds, Token } from "../../types/typechain-types";

export async function standardPrepareBingo() {
  const [owner, bingoAdmin, user]: SignerWithAddress[] = await ethers.getSigners();

  const DataFeedsInstance = await ethers.getContractFactory("DataFeeds");
  const dataFeeds: DataFeeds = await DataFeedsInstance.deploy();
  const reserveDataFeeds: DataFeeds = await DataFeedsInstance.deploy();

  const BingoInstance = await ethers.getContractFactory("Bingo");
  const bingo: Bingo = await upgrades.deployProxy(BingoInstance, [await dataFeeds.getAddress()]);
  await bingo.waitForDeployment();

  const BINGO_ADMIN_ROLE = await bingo.BINGO_ADMIN_ROLE();
  await bingo.connect(owner).grantRole(BINGO_ADMIN_ROLE, bingoAdmin);

  return {
    owner,
    bingoAdmin,
    user,
    BINGO_ADMIN_ROLE,
    dataFeeds,
    reserveDataFeeds,
    bingo,
  };
}

export async function standardPrepareToken() {
  const [owner, tokenAdmin, user, user2]: SignerWithAddress[] = await ethers.getSigners();

  const TokenInstance = await ethers.getContractFactory("Token");
  const token: Token = await upgrades.deployProxy(TokenInstance, ["Test", "TST"]);
  await token.waitForDeployment();

  const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
  const TOKEN_ADMIN_ROLE = await token.TOKEN_ADMIN_ROLE();
  const CONTRACT_ROLE = await token.CONTRACT_ROLE();

  await token.connect(owner).grantRole(TOKEN_ADMIN_ROLE, tokenAdmin);
  await token.connect(owner).grantRole(CONTRACT_ROLE, user2);
  await token.connect(tokenAdmin).mint(user, ethers.parseUnits("10", 18));
  await token.connect(tokenAdmin).mint(user2, ethers.parseUnits("10", 18));

  return {
    owner,
    tokenAdmin,
    user,
    user2,
    token,
    DEFAULT_ADMIN_ROLE,
    TOKEN_ADMIN_ROLE,
    CONTRACT_ROLE,
  };
}

export async function standardPrepareLottery() {
  const [owner, lotteryAdmin, tokenAdmin, alice, bob, mike]: SignerWithAddress[] = await ethers.getSigners();

  const ticketPrice = ethers.parseUnits("1", 18);
  const lotteryFee = 1000;

  const DataFeedsInstance = await ethers.getContractFactory("DataFeeds");
  const dataFeeds: DataFeeds = await DataFeedsInstance.deploy();

  const TokenInstance = await ethers.getContractFactory("Token");
  const token: Token = await upgrades.deployProxy(TokenInstance, ["Test", "TST"]);
  await token.waitForDeployment();

  const TOKEN_ADMIN_ROLE = await token.TOKEN_ADMIN_ROLE();
  const CONTRACT_ROLE = await token.CONTRACT_ROLE();
  await token.connect(owner).grantRole(TOKEN_ADMIN_ROLE, tokenAdmin);
  await token.connect(tokenAdmin).mint(bob, ethers.parseUnits("100000", 18));
  await token.connect(tokenAdmin).mint(alice, ethers.parseUnits("100000", 18));
  await token.connect(tokenAdmin).mint(mike, ethers.parseUnits("100000", 18));

  const LotteryInstance = await ethers.getContractFactory("Lottery");
  const lottery: Lottery = await upgrades.deployProxy(LotteryInstance, [
    dataFeeds.target,
    token.target,
    ticketPrice,
    lotteryFee,
  ]);
  await lottery.waitForDeployment();

  await token.connect(owner).grantRole(CONTRACT_ROLE, lottery.target);

  const LOTTERY_ADMIN_ROLE = await lottery.LOTTERY_ADMIN_ROLE();
  await lottery.connect(owner).grantRole(LOTTERY_ADMIN_ROLE, lotteryAdmin);

  return {
    owner,
    lotteryAdmin,
    tokenAdmin,
    alice,
    bob,
    mike,
    dataFeeds,
    token,
    lottery,
    LOTTERY_ADMIN_ROLE,
    ticketPrice,
    lotteryFee,
  };
}

export enum LotteryType {
  Weekly = 0,
  Monthly = 1,
  Quarter = 2,
  Yearly = 3,
}

export enum LotteryStatus {
  NotExist = 0,
  Init = 1,
  Drawn = 2,
  Calculated = 3,
}

export enum WinType {
  None = 0,
  ThreeNum = 1,
  FourNum = 2,
  FiveNum = 3,
  SixNum = 4,
}

export async function buyTickets(buyer, amount, ticketPrice, token, lottery) {
  const totalPrice = ticketPrice * amount;
  await token.connect(buyer).approve(lottery.target, totalPrice);
  await lottery.connect(buyer).buyTickets(amount);
}

export function generationTickets(count) {
  const result: string[] = [];
  while (result.length < count) {
    const uniqueNumbers = new Set();
    while (uniqueNumbers.size < 6) {
      const num = (ethers.randomBytes(1)[0] % 48) + 1;
      uniqueNumbers.add(num);
    }
    result.push(
      "0x" +
        Array.from(uniqueNumbers)
          .map((decimalValue) => decimalValue.toString(16).padStart(2, "0"))
          .join("")
    );
  }
  return result;
}

function hexStringToByte(str) {
  const bytes = [];

  for (let i = 2; i < str.length; i += 2) {
    bytes.push(parseInt(str.substr(i, 2) as string, 16));
  }

  return bytes;
}

export function checkWinNumbers(b1, b2) {
  let win = 0n;
  let type = 0n;
  const arr1 = hexStringToByte(b1);
  const arr2 = hexStringToByte(b2);

  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < 6; j += 1) {
      if (arr1[i] == arr2[j]) win++;
    }
  }
  if (win == 6n) type = 4n;
  if (win == 5n) type = 3n;
  if (win == 4n) type = 2n;
  if (win == 3n) type = 1n;

  return type;
}

export function getUsersWinnerId(users, combinedTickets, winnerNumbers) {
  const usersWinnerId = Array.from({ length: users.length }, () => []);

  for (let i = 0; i < combinedTickets.length; i++) {
    if (checkWinNumbers(winnerNumbers, combinedTickets[i])) {
      for (let j = 0; j < users.length; j++) {
        if (users[j].includes(combinedTickets[i])) {
          usersWinnerId[j].push(i);
        }
      }
    }
  }

  return usersWinnerId;
}

export async function calculateLottery(lottery, lotteryAdmin, userNumbers) {
  const weeklyPercent = BigInt(350);
  const monthlyPercent = BigInt(1000);
  const quarterlyPercent = BigInt(2500);
  const yearlyPercent = BigInt(10000);
  const typeLotteryPercent = [weeklyPercent, monthlyPercent, quarterlyPercent, yearlyPercent];

  const jackpot = await lottery.totalJackpot();

  const preLotteryPool = (jackpot * typeLotteryPercent[0]) / BigInt(10000);

  const combinedTickets = userNumbers.flat();
  const lotteryData = await lottery.lotteries(0);
  const winnerNumbers = lotteryData[3];
  const winTickets = Array(5).fill(0n);

  for (let i = 0; i < combinedTickets.length; i++) {
    const winType = checkWinNumbers(winnerNumbers, combinedTickets[i]);
    winTickets[winType] = winTickets[winType] + 1n;
  }

  const winValuesPerNumber = Array(5).fill(0n);
  const num3Percent = 500n;
  const num4Percent = 1000n;
  const num5Percent = 2000n;
  const num6Percent = 6500n;
  winValuesPerNumber[1] = (preLotteryPool * num3Percent) / 10000n;
  winValuesPerNumber[2] = (preLotteryPool * num4Percent) / 10000n;
  winValuesPerNumber[3] = (preLotteryPool * num5Percent) / 10000n;
  winValuesPerNumber[4] = (preLotteryPool * num6Percent) / 10000n;

  const winValuesPerTicket = Array(5).fill(0n);
  for (let i = 1; i < 5; i++) {
    if (winTickets[i] > 0) winValuesPerTicket[i] = winValuesPerNumber[i] / winTickets[i];
  }

  let lotteryPool = BigInt(0);
  for (let i = 0; i < 5; i++) {
    lotteryPool += BigInt(winTickets[i] * winValuesPerTicket[i]);
  }

  getUsersWinnerId(userNumbers, combinedTickets, winnerNumbers);
  await lottery.connect(lotteryAdmin).calculateLottery(0, jackpot, lotteryPool, winTickets, winValuesPerTicket);

  return { winValuesPerTicket, lotteryPool };
}
