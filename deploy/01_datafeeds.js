const { ethers } = require("hardhat");

module.exports = async ({deployments}) => {
  const { log } = deployments;

  const { deploy } = deployments;
  const [ owner ] = await ethers.getSigners();

  const deployResult = await deploy('DataFeeds', {
    from: owner.address,
  });

  log(`DataFeeds deployed at ${deployResult.address}`);
};

module.exports.tags = ['DataFeeds'];