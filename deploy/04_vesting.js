const { ethers } = require("hardhat");

module.exports = async ({deployments}) => {
  const { deploy } = deployments;
  const [deployer, owner, usd, marketing, team, reserve, liquidity, advisors, gamersRewards, development, treasury] = await ethers.getSigners();

  const roomCoin = await deploy('RoomCoin', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
    ],
    log: true
  });

  const strategicRoundLock = await deploy('StrategicRoundLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_USD_ADDRESS || usd.address,
      process.env.VESTING_MARKETING_ADDRESS || marketing.address,
      process.env.VESTING_TEAM_ADDRESS || team.address,
      process.env.VESTING_RESERVE_ADDRESS || reserve.address,
      process.env.VESTING_LIQUIDITY_ADDRESS || liquidity.address,
    ],
    log: true
  });

  const seedRoundLock = await deploy('SeedRoundLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_USD_ADDRESS || usd.address,
      process.env.VESTING_MARKETING_ADDRESS || marketing.address,
      process.env.VESTING_TEAM_ADDRESS || team.address,
      process.env.VESTING_RESERVE_ADDRESS || reserve.address,
      process.env.VESTING_LIQUIDITY_ADDRESS || liquidity.address,
    ],
    log: true
  });

  const privateRoundStage1Lock = await deploy('PrivateRoundStage1Lock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_USD_ADDRESS || usd.address,
      process.env.VESTING_MARKETING_ADDRESS || marketing.address,
      process.env.VESTING_TEAM_ADDRESS || team.address,
      process.env.VESTING_RESERVE_ADDRESS || reserve.address,
      process.env.VESTING_LIQUIDITY_ADDRESS || liquidity.address,
    ],
    log: true
  });

  const privateRoundStage2Lock = await deploy('PrivateRoundStage2Lock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_USD_ADDRESS || usd.address,
      process.env.VESTING_MARKETING_ADDRESS || marketing.address,
      process.env.VESTING_TEAM_ADDRESS || team.address,
      process.env.VESTING_RESERVE_ADDRESS || reserve.address,
      process.env.VESTING_LIQUIDITY_ADDRESS || liquidity.address,
    ],
    log: true
  });

  const tgeLock = await deploy('TGELock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_USD_ADDRESS || usd.address,
      process.env.VESTING_MARKETING_ADDRESS || marketing.address,
      process.env.VESTING_TEAM_ADDRESS || team.address,
      process.env.VESTING_RESERVE_ADDRESS || reserve.address,
      process.env.VESTING_LIQUIDITY_ADDRESS || liquidity.address,
    ],
    log: true
  });

  const foundersAndTeamLock = await deploy('FoundersAndTeamLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_TEAM_ADDRESS || team.address
    ],
    log: true
  });

  const advisorsLock = await deploy('AdvisorsLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_ADVISORS_ADDRESS || advisors.address
    ],
    log: true
  });

  const marketingLock = await deploy('MarketingLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_MARKETING_ADDRESS || marketing.address
    ],
    log: true
  });

  const gamersRewardsLock = await deploy('GamersRewardsLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_GAMERS_REWARDS_ADDRESS || gamersRewards.address
    ],
    log: true
  });

  const developmentLock = await deploy('DevelopmentLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_DEVELOPMENT_ADDRESS || development.address
    ],
    log: true
  });

  const treasuryLock = await deploy('TreasuryLock', {
    from: deployer.address,
    args: [
      process.env.VESTING_OWNER_ADDRESS || owner.address,
      roomCoin.address,
      process.env.VESTING_TREASURY_ADDRESS || treasury.address
    ],
    log: true
  });
};

module.exports.tags = ['RoomCoin'];
