const { ethers, upgrades } = require("hardhat");

const main = async () => {
  const lotteryAddress = '0x42d44acFF552c6e269fA8dEFA6422C9B3D3d46E7';
  const artifact = require('../artifacts/contracts/Lottery.sol/Lottery.json');

  const lotteryContract = await ethers.getContractAt(artifact.abi, lotteryAddress);

  const calculateLotteryIndex = 7;

  const [[[status, type, date, lotteryNumbers, ticketsCount, jackpot], result]] = await lotteryContract.getLottery(calculateLotteryIndex, calculateLotteryIndex);

  const tickets = [];

  while (tickets.length < ticketsCount) {
    tickets.push(...(await lotteryContract.getTicket(calculateLotteryIndex, tickets.length, tickets.length + 499)));
    console.log(tickets.length);
  }

  const filterTickets = tickets.filter(t => t[0][0]);

  if (status > 1) filterTickets.map((t, i) => {
    if (t[1] != 0n) {
      console.log('win ticket index =====>', i);
      console.log('---', t);
    }
  });

  console.log('Lottery info:');
  console.log(status, type, date, ticketsCount, lotteryNumbers, jackpot);

  if (status == 3)
  console.log(result);
};

main();