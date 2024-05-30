const { ethers, upgrades } = require("hardhat");

module.exports = async ({deployments}) => {
  const { log } = deployments;

  const dataFeeds = await deployments.get('DataFeeds');

  const Bingo = await ethers.getContractFactory("Bingo");

  const bingo = await upgrades.deployProxy(Bingo, [
    dataFeeds.address
  ]);
  await bingo.waitForDeployment();

  log(`Bingo deployed at ${await bingo.getAddress()}`);
};

module.exports.dependencies = ['DataFeeds'];

module.exports.tags = ['Bingo'];