const { ethers, upgrades } = require("hardhat");
const crypto = require('crypto');

const main = async () => {
  const lotteryAddress = '0x42d44acFF552c6e269fA8dEFA6422C9B3D3d46E7';
  const dataFeedsAddress = '0x973b0dF6aA45f78AbFa594Acb0F213e7a6E58440';
  const lotteryArtifact = require('../artifacts/contracts/Lottery.sol/Lottery.json');
  const datafeedsArtifact = require('../artifacts/contracts/DataFeeds.sol/DataFeeds.json');

  const lotteryContract = await ethers.getContractAt(lotteryArtifact.abi, lotteryAddress);
  const dataFeedContract = await ethers.getContractAt(datafeedsArtifact.abi, dataFeedsAddress);

  const lotteryIndex = 7;
  const ticketsPerIteration = 11;
  const iterationCount = 3;

  for (let i = 0; i < iterationCount; i++) {
    const numbers = [];
    for (let j = 0; j < ticketsPerIteration; j++) {
      numbers.push(await dataFeedContract.getRandomLotto_6_49(crypto.randomBytes(32)));
    }
    await lotteryContract.registerTickets(lotteryIndex, numbers);
    console.log('--->register tickets, iteration', i);
    console.log(numbers);
  };

  console.log('======> All tickets registered', - ticketsPerIteration * iterationCount);
};

main();