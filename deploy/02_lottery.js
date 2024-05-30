const { ethers, upgrades } = require("hardhat");

module.exports = async ({deployments}) => {
  const { log } = deployments;

  const dataFeeds = await deployments.get('DataFeeds');

  const Token = await ethers.getContractFactory("Token");
  const token = await upgrades.deployProxy(Token, [process.env.TOKEN_NAME, process.env.TOKEN_SYMBOL]);
  await token.waitForDeployment();

  log(`Token ${process.env.TOKEN_NAME} deployed at ${await token.getAddress()} `);

  const Lottery = await ethers.getContractFactory("Lottery");

  const lottery = await upgrades.deployProxy(Lottery, [
    dataFeeds.address,
    await token.getAddress(),
    process.env.TICKET_PRICE,
    process.env.LOTTERY_FEE
  ]);
  await lottery.waitForDeployment();

  log(`Lottery deployed at ${await lottery.getAddress()}`);
};

module.exports.dependencies = ['DataFeeds'];

module.exports.tags = ['Lottery'];