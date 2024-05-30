const { ethers, upgrades } = require("hardhat");

const weeklyPercent = 350n;
const monthlyPercent = 1000n;
const quarterlyPercent = 2500n;
const yearlyPercent = 10000n;
const num3Percent = 500n;
const num4Percent = 1000n;
const num5Percent = 2000n;
const num6Percent = 6500n;
const typeLotteryPercent = [weeklyPercent, monthlyPercent, quarterlyPercent, yearlyPercent];

function calculateLottery(tickets, lotteryNumbers, loterryType, totalJackpot) {
  let lotteryPool = 0n;
  const winTickets = Array(5).fill(0n);
  const winValuesPerNumber = Array(5).fill(0n);
  const winValuesPerTicket = Array(5).fill(0n);

  for (let i = 0; i < tickets.length; i++) {
    const ticketNumber = tickets[i][0][2];
    const winType = checkWinNumbers(lotteryNumbers, ticketNumber);
    winTickets[winType] = winTickets[winType] + 1n;
  }

  const preLottteryPool = totalJackpot * typeLotteryPercent[loterryType] / 10000n;

  winValuesPerNumber[1] = preLottteryPool * num3Percent / 10000n;
  winValuesPerNumber[2] = preLottteryPool * num4Percent / 10000n;
  winValuesPerNumber[3] = preLottteryPool * num5Percent / 10000n;
  winValuesPerNumber[4] = preLottteryPool * num6Percent / 10000n;

  for (let i = 1; i < 5; i++) {
    if (winTickets[i] > 0) winValuesPerTicket[i] = winValuesPerNumber[i] / winTickets[i];
  }

  for (let i = 0; i < 5; i++) {
    lotteryPool += winTickets[i] * winValuesPerTicket[i];
  }

  return { totalJackpot, lotteryPool, winTickets, winValuesPerTicket };
}

function checkWinNumbers(b1, b2) {
  let win = 0n;
  let type = 0n;
  const arr1 = hexStringToByte(b1);
  const arr2 = hexStringToByte(b2);

  for(let i = 0; i < 6; i += 1) {
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

function hexStringToByte(str) {
  const bytes = [];

  for (let i = 2; i < str.length; i += 2) {
    bytes.push(parseInt(str.substr(i,2),16));
  }
  
  return bytes;
}

const main = async () => {
  const lotteryAddress = '0x42d44acFF552c6e269fA8dEFA6422C9B3D3d46E7';
  const artifact = require('../artifacts/contracts/Lottery.sol/Lottery.json');

  const lotteryContract = await ethers.getContractAt(artifact.abi, lotteryAddress);

  const calculateLotteryIndex = 7;
  const jackpot = await lotteryContract.totalJackpot();

  const [[[status, type, date, lotteryNumbers, ticketsCount,],]] = await lotteryContract.getLottery(calculateLotteryIndex, calculateLotteryIndex);

  const tickets = [];

  while (tickets.length < ticketsCount) {
    tickets.push(...(await lotteryContract.getTicket(calculateLotteryIndex, tickets.length, tickets.length + 499)));
    console.log(tickets.length);
  }

  const filterTickets = tickets.filter(t => t[0][0]);
  console.log('tickets', filterTickets);

  const result = calculateLottery(filterTickets, lotteryNumbers, type, jackpot);
  
  console.log('-----', status, type, date, ticketsCount, lotteryNumbers);
  console.log('jackpot', jackpot);
  console.log(result);

  await lotteryContract.calculateLottery(calculateLotteryIndex, result.totalJackpot, result.lotteryPool, result.winTickets, result.winValuesPerTicket);

  console.log(`Lottrry ${calculateLotteryIndex} calculated`);
};

main();