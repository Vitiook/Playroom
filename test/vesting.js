const {
  time,
  mine,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vesting", function () {
  const unlockPeriod = 60n * 60n * 24n * 30n;
  const percentDeniminator = 10000n;
  const priceDeniminator = 100n;
  const totalSupply = 10_000_000n * 10n ** 18n;

  const strategicLockOptions = {
    vesting: 24,
    cliff: 4,
    unlockTGE: 500,
    allocation: 1000,
    price: 40,
    maxUsdAmount: 2000000,
    minUsdAmount: 500000,
    marketingPercent: 2500,
    teamPercent: 1670,
    reservePercent: 1670,
    liquidityPercent: 4160,
  };

  const seedLockOptions = {
    vesting: 20,
    cliff: 3,
    unlockTGE: 500,
    allocation: 600,
    price: 50,
    maxUsdAmount: 2000000,
    minUsdAmount: 500000,
    marketingPercent: 2500,
    teamPercent: 1670,
    reservePercent: 1670,
    liquidityPercent: 4160,
  };

  const private1LockOptions = {
    vesting: 20,
    cliff: 3,
    unlockTGE: 500,
    allocation: 1500,
    price: 60,
    maxUsdAmount: 2000000,
    minUsdAmount: 500000,
    marketingPercent: 2500,
    teamPercent: 1670,
    reservePercent: 1670,
    liquidityPercent: 4160,
  };

  const private2LockOptions = {
    vesting: 20,
    cliff: 3,
    unlockTGE: 500,
    allocation: 375,
    price: 80,
    maxUsdAmount: 2000000,
    minUsdAmount: 500000,
    marketingPercent: 2500,
    teamPercent: 1670,
    reservePercent: 1670,
    liquidityPercent: 4160,
  };

  const tgeLockOptions = {
    vesting: 12,
    cliff: 6,
    unlockTGE: 500,
    allocation: 350,
    price: 90,
    maxUsdAmount: 2000000,
    minUsdAmount: 500000,
    marketingPercent: 2500,
    teamPercent: 1670,
    reservePercent: 1670,
    liquidityPercent: 4160,
  };

  const foundersAndTeamLockOptions = {
    vesting: 24,
    cliff: 9,
    unlockTGE: 0,
    allocation: 1200,
  };

  const advisorsLockOptions = {
    vesting: 20,
    cliff: 9,
    unlockTGE: 0,
    allocation: 200,
  };

  const marketingLockOptions = {
    vesting: 36,
    cliff: 0,
    unlockTGE: 0,
    allocation: 600,
  };

  const gamersRewardsLockOptions = {
    vesting: 24,
    cliff: 0,
    unlockTGE: 200,
    allocation: 1000,
  };

  const developmentLockOptions = {
    vesting: 30,
    cliff: 6,
    unlockTGE: 0,
    allocation: 600,
  };

  const treasuryLockOptions = {
    vesting: 24,
    cliff: 6,
    unlockTGE: 0,
    allocation: 1425,
  };

  const commonOptions = {
    marketingPercent: 2500,
    teamPercent: 1670,
    reservePercent: 1670,
    liquidityPercent: 4160,
    maxUsdAmount: 2000000,
    minUsdAmount: 500000,
  };

  async function deployRoomCoinFixture() {
    const [
      deployer,
      owner,
      marketing,
      team,
      reserve,
      liquidity,
      advisors,
      gamersRewards,
      development,
      treasury,
      otherAccount1,
      otherAccount2,
    ] = await ethers.getSigners();

    const RMC = await ethers.getContractFactory("RoomCoin");
    const rmc = await RMC.deploy(owner.address);

    const USDMock6 = await ethers.getContractFactory("USDMock6");
    const usd = await USDMock6.deploy();

    // const USDMock18 = await ethers.getContractFactory("USDMock18");
    // const usd = await USDMock18.deploy();

    const StrategicRoundLock = await ethers.getContractFactory(
      "StrategicRoundLock"
    );
    const strategicLock = await StrategicRoundLock.deploy(
      owner.address,
      await rmc.getAddress(),
      await usd.getAddress(),
      marketing.address,
      team.address,
      reserve.address,
      liquidity.address
    );

    const SeedRoundLock = await ethers.getContractFactory("SeedRoundLock");
    const seedLock = await SeedRoundLock.deploy(
      owner.address,
      await rmc.getAddress(),
      await usd.getAddress(),
      marketing.address,
      team.address,
      reserve.address,
      liquidity.address
    );

    const PrivateRoundStage1Lock = await ethers.getContractFactory(
      "PrivateRoundStage1Lock"
    );
    const private1Lock = await PrivateRoundStage1Lock.deploy(
      owner.address,
      await rmc.getAddress(),
      await usd.getAddress(),
      marketing.address,
      team.address,
      reserve.address,
      liquidity.address
    );

    const PrivateRoundStage2Lock = await ethers.getContractFactory(
      "PrivateRoundStage2Lock"
    );
    const private2Lock = await PrivateRoundStage2Lock.deploy(
      owner.address,
      await rmc.getAddress(),
      await usd.getAddress(),
      marketing.address,
      team.address,
      reserve.address,
      liquidity.address
    );

    const TGELock = await ethers.getContractFactory("TGELock");
    const tgeLock = await TGELock.deploy(
      owner.address,
      await rmc.getAddress(),
      await usd.getAddress(),
      marketing.address,
      team.address,
      reserve.address,
      liquidity.address
    );

    const FoundersAndTeamLock = await ethers.getContractFactory(
      "FoundersAndTeamLock"
    );
    const foundersAndTeamLock = await FoundersAndTeamLock.deploy(
      owner.address,
      await rmc.getAddress(),
      team.address
    );

    const AdvisorsLock = await ethers.getContractFactory("AdvisorsLock");
    const advisorsLock = await AdvisorsLock.deploy(
      owner.address,
      await rmc.getAddress(),
      advisors.address
    );

    const MarketingLock = await ethers.getContractFactory("MarketingLock");
    const marketingLock = await MarketingLock.deploy(
      owner.address,
      await rmc.getAddress(),
      marketing.address
    );

    const GamersRewardsLock = await ethers.getContractFactory(
      "GamersRewardsLock"
    );
    const gamersRewardsLock = await GamersRewardsLock.deploy(
      owner.address,
      await rmc.getAddress(),
      gamersRewards.address
    );

    const DevelopmentLock = await ethers.getContractFactory("DevelopmentLock");
    const developmentLock = await DevelopmentLock.deploy(
      owner.address,
      await rmc.getAddress(),
      development.address
    );

    const TreasuryLock = await ethers.getContractFactory("TreasuryLock");
    const treasuryLock = await TreasuryLock.deploy(
      owner.address,
      await rmc.getAddress(),
      treasury.address
    );

    return {
      deployer,
      owner,
      usd,
      marketing,
      team,
      reserve,
      liquidity,
      advisors,
      gamersRewards,
      development,
      treasury,
      rmc,
      strategicLock,
      seedLock,
      private1Lock,
      private2Lock,
      tgeLock,
      foundersAndTeamLock,
      advisorsLock,
      marketingLock,
      gamersRewardsLock,
      developmentLock,
      treasuryLock,
      otherAccount1,
      otherAccount2,
      usd,
    };
  }

  const checkPresale = async (contract, options, owner) => {
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.unlockPeriod()).to.equal(unlockPeriod);
    expect(await contract.percentDeniminator()).to.equal(percentDeniminator);
    expect(await contract.priceDeniminator()).to.equal(priceDeniminator);
    expect(await contract.tgePercent()).to.equal(options.unlockTGE);
    expect(await contract.unlockPercent()).to.equal(getUnlockPercent(options));
    expect(await contract.cliff()).to.equal(options.cliff);
    expect(await contract.tokenPriceUSD()).to.equal(options.price);
    expect(await contract.maxUsdAmount()).to.equal(options.maxUsdAmount);
    expect(await contract.minUsdAmount()).to.equal(options.minUsdAmount);
    expect(await contract.marketingPercent()).to.equal(
      options.marketingPercent
    );
    expect(await contract.teamPercent()).to.equal(options.teamPercent);
    expect(await contract.reservePercent()).to.equal(options.reservePercent);
    expect(await contract.liquidityPercent()).to.equal(
      options.liquidityPercent
    );
  };

  const checkVesting = async (contract, options, owner, recipient) => {
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.unlockPeriod()).to.equal(unlockPeriod);
    expect(await contract.percentDeniminator()).to.equal(percentDeniminator);
    expect(await contract.tgePercent()).to.equal(options.unlockTGE);
    expect(await contract.unlockPercent()).to.equal(getUnlockPercent(options));
    expect(await contract.cliff()).to.equal(options.cliff);
    expect(await contract.recipientAddress()).to.equal(recipient.address);
  };

  const runPresale = async (
    contract,
    usd,
    rmc,
    owner,
    otherAccount1,
    otherAccount2,
    options
  ) => {
    const usdDecimals = 10n ** (await usd.decimals());
    const rmcDecimals = 10n ** (await rmc.decimals());

    const allocation =
      (totalSupply * BigInt(options.allocation)) / percentDeniminator;
    const usdMax =
      (BigInt(options.maxUsdAmount) * usdDecimals) / priceDeniminator;
    const usdMin =
      (BigInt(options.minUsdAmount) * usdDecimals) / priceDeniminator;

    await expect(contract.startSeed()).to.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );

    await expect(contract.connect(owner).startSeed()).to.reverted;

    await rmc.connect(owner).transfer(await contract.getAddress(), allocation);
    await usd.mint(otherAccount1.address, usdMax);
    await usd.mint(otherAccount2.address, usdMax);

    expect(await contract.avalableToClaimGlobal()).to.equal(0);
    expect(await contract.tokensSoldAmountMax()).to.equal(0);
    expect(await contract.tokensSoldAmount()).to.equal(0);
    expect(await contract.nextUnlock()).to.equal(0);
    expect(await contract.startUnlock()).to.equal(0);
    expect(await contract.seedIsStarted()).to.false;
    expect(await contract.vestingIsStarted()).to.false;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await usd.balanceOf(await contract.getAddress())).to.equal(0);
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount1.address)).to.equal(usdMax);
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount2.address)).to.equal(usdMax);

    await expect(contract.connect(owner).startSeed())
      .to.emit(contract, "Phase")
      .withArgs(owner.address, "start");

    expect(await contract.avalableToClaimGlobal()).to.equal(0);
    expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
    expect(await contract.tokensSoldAmount()).to.equal(0);
    expect(await contract.nextUnlock()).to.equal(0);
    expect(await contract.startUnlock()).to.equal(0);
    expect(await contract.seedIsStarted()).to.true;
    expect(await contract.vestingIsStarted()).to.false;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await usd.balanceOf(await contract.getAddress())).to.equal(0);
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount1.address)).to.equal(usdMax);
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount2.address)).to.equal(usdMax);
    expect(await contract.balance(otherAccount1.address)).to.equal(0);
    expect(await contract.balance(otherAccount2.address)).to.equal(0);
    expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(0);
    expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(0);

    const tokensAmount1 =
      (usdMin * rmcDecimals * priceDeniminator) /
      (BigInt(options.price) * usdDecimals);
    await usd
      .connect(otherAccount1)
      .approve(await contract.getAddress(), usdMin);

    await expect(contract.connect(otherAccount1).buy(usdMin))
      .to.emit(contract, "Buy")
      .withArgs(otherAccount1.address, tokensAmount1, usdMin);

    expect(await contract.avalableToClaimGlobal()).to.equal(0);
    expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
    expect(await contract.tokensSoldAmount()).to.equal(tokensAmount1);
    expect(await contract.nextUnlock()).to.equal(0);
    expect(await contract.startUnlock()).to.equal(0);
    expect(await contract.seedIsStarted()).to.true;
    expect(await contract.vestingIsStarted()).to.false;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await usd.balanceOf(await contract.getAddress())).to.equal(usdMin);
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount1.address)).to.equal(
      usdMax - usdMin
    );
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount2.address)).to.equal(usdMax);
    expect(await contract.balance(otherAccount1.address)).to.equal(
      tokensAmount1
    );
    expect(await contract.balance(otherAccount2.address)).to.equal(0);
    expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(usdMin);
    expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(0);

    await expect(contract.stopSeed()).to.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await expect(contract.connect(owner).stopSeed())
      .to.emit(contract, "Phase")
      .withArgs(owner.address, "stop");

    expect(await contract.seedIsStarted()).to.false;
    expect(await contract.vestingIsStarted()).to.false;

    await expect(contract.connect(otherAccount1).buy(usdMax)).to.reverted;

    await expect(contract.connect(otherAccount2).buy(usdMin)).to.reverted;

    await expect(contract.resumeSeed()).to.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await expect(contract.connect(owner).resumeSeed())
      .to.emit(contract, "Phase")
      .withArgs(owner.address, "resume");

    expect(await contract.seedIsStarted()).to.true;
    expect(await contract.vestingIsStarted()).to.false;

    const tokensAmount2 =
      (usdMax * rmcDecimals * priceDeniminator) /
      (BigInt(options.price) * usdDecimals);
    await usd
      .connect(otherAccount2)
      .approve(await contract.getAddress(), usdMax);

    await expect(contract.connect(otherAccount2).buy(usdMax))
      .to.emit(contract, "Buy")
      .withArgs(otherAccount2.address, tokensAmount2, usdMax);

    expect(await contract.avalableToClaimGlobal()).to.equal(0);
    expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
    expect(await contract.tokensSoldAmount()).to.equal(
      tokensAmount1 + tokensAmount2
    );
    expect(await contract.nextUnlock()).to.equal(0);
    expect(await contract.startUnlock()).to.equal(0);
    expect(await contract.seedIsStarted()).to.true;
    expect(await contract.vestingIsStarted()).to.false;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await usd.balanceOf(await contract.getAddress())).to.equal(
      usdMin + usdMax
    );
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount1.address)).to.equal(
      usdMax - usdMin
    );
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await contract.balance(otherAccount1.address)).to.equal(
      tokensAmount1
    );
    expect(await contract.balance(otherAccount2.address)).to.equal(
      tokensAmount2
    );
    expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(usdMin);
    expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(usdMax);

    const tokensAmount3 =
      (usdMin * 2n * rmcDecimals * priceDeniminator) /
      (BigInt(options.price) * usdDecimals);
    await usd
      .connect(otherAccount1)
      .approve(await contract.getAddress(), usdMin * 2n);

    await expect(contract.connect(otherAccount1).buy(usdMin * 2n))
      .to.emit(contract, "Buy")
      .withArgs(otherAccount1.address, tokensAmount3, usdMin * 2n);

    expect(await contract.avalableToClaimGlobal()).to.equal(0);
    expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
    expect(await contract.tokensSoldAmount()).to.equal(
      tokensAmount1 + tokensAmount2 + tokensAmount3
    );
    expect(await contract.nextUnlock()).to.equal(0);
    expect(await contract.startUnlock()).to.equal(0);
    expect(await contract.seedIsStarted()).to.true;
    expect(await contract.vestingIsStarted()).to.false;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await usd.balanceOf(await contract.getAddress())).to.equal(
      usdMin * 3n + usdMax
    );
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount1.address)).to.equal(
      usdMax - usdMin * 3n
    );
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await contract.balance(otherAccount1.address)).to.equal(
      tokensAmount1 + tokensAmount3
    );
    expect(await contract.balance(otherAccount2.address)).to.equal(
      tokensAmount2
    );
    expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(
      usdMin * 3n
    );
    expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(usdMax);

    await usd
      .connect(otherAccount1)
      .approve(await contract.getAddress(), usdMax);
    await expect(contract.connect(otherAccount1).buy(usdMax)).to.reverted;

    await usd
      .connect(otherAccount2)
      .approve(await contract.getAddress(), usdMin);
    await expect(contract.connect(otherAccount2).buy(usdMin)).to.reverted;

    await expect(contract.startVesting()).to.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await expect(contract.connect(owner).startVesting()).to.reverted;

    await expect(contract.connect(owner).stopSeed())
      .to.emit(contract, "Phase")
      .withArgs(owner.address, "stop");

    expect(await contract.seedIsStarted()).to.false;
    expect(await contract.vestingIsStarted()).to.false;

    await expect(contract.connect(owner).startVesting())
      .to.emit(contract, "Phase")
      .withArgs(owner.address, "startVesting")
      .to.emit(rmc, "Transfer")
      .withArgs(
        await contract.getAddress(),
        ethers.ZeroAddress,
        allocation - tokensAmount1 - tokensAmount2 - tokensAmount3
      );
    await expect(contract.connect(owner).startVesting()).to.reverted;

    const startUnlock = BigInt(await time.latest()) - 1n;

    expect(await contract.avalableToClaimGlobal()).to.equal(options.unlockTGE);
    expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
    expect(await contract.tokensSoldAmount()).to.equal(
      tokensAmount1 + tokensAmount2 + tokensAmount3
    );
    expect(await contract.nextUnlock()).to.equal(
      startUnlock + unlockPeriod * BigInt(options.cliff)
    );
    expect(await contract.startUnlock()).to.equal(startUnlock);
    expect(await contract.seedIsStarted()).to.false;
    expect(await contract.vestingIsStarted()).to.true;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      tokensAmount1 + tokensAmount2 + tokensAmount3
    );
    expect(await usd.balanceOf(await contract.getAddress())).to.equal(
      usdMin * 3n + usdMax
    );
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount1.address)).to.equal(
      usdMax - usdMin * 3n
    );
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await usd.balanceOf(otherAccount2.address)).to.equal(0);
    expect(await contract.balance(otherAccount1.address)).to.equal(
      tokensAmount1 + tokensAmount3
    );
    expect(await contract.balance(otherAccount2.address)).to.equal(
      tokensAmount2
    );
    expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(
      usdMin * 3n
    );
    expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(usdMax);

    await rmc
      .connect(owner)
      .setIsWhitelisted(await contract.getAddress(), true);

    let percent = BigInt(options.unlockTGE);
    let prevPercent = 0n;
    let amount1 = tokensAmount1 + tokensAmount3;
    let amount2 = tokensAmount2;
    let claimed1 = 0n;
    let claimed2 = 0n;
    let addPercent = BigInt(getUnlockPercent(options));

    expect(await contract.claimedByUser(otherAccount1.address)).to.equal(0);
    expect(await contract.claimedByUser(otherAccount2.address)).to.equal(0);

    for (let i = 0; i < options.vesting + options.cliff; i++) {
      const mount = i - options.cliff;

      if (mount >= 0) percent += addPercent;
      if (percent > 10000n) percent = 10000n;

      if (percent > prevPercent) {
        const avalableToClaim1 = (amount1 * percent) / percentDeniminator;
        const avalableToClaim2 = (amount2 * percent) / percentDeniminator;
        const claim1 = avalableToClaim1 - claimed1;
        const claim2 = avalableToClaim2 - claimed2;

        claimed1 += claim1;

        await expect(contract.connect(otherAccount1).claim())
          .to.emit(contract, "Claim")
          .withArgs(otherAccount1.address, claim1);

        expect(await contract.avalableToClaimGlobal()).to.equal(percent);
        expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
        expect(await contract.tokensSoldAmount()).to.equal(
          tokensAmount1 + tokensAmount2 + tokensAmount3
        );
        expect(await contract.startUnlock()).to.equal(startUnlock);
        expect(await contract.seedIsStarted()).to.false;
        expect(await contract.vestingIsStarted()).to.true;
        expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
          tokensAmount1 + tokensAmount2 + tokensAmount3 - claimed1 - claimed2
        );
        expect(await usd.balanceOf(await contract.getAddress())).to.equal(
          usdMin * 3n + usdMax
        );
        expect(await rmc.balanceOf(otherAccount1.address)).to.equal(claimed1);
        expect(await usd.balanceOf(otherAccount1.address)).to.equal(
          usdMax - usdMin * 3n
        );
        expect(await rmc.balanceOf(otherAccount2.address)).to.equal(claimed2);
        expect(await usd.balanceOf(otherAccount2.address)).to.equal(0);
        expect(await contract.balance(otherAccount1.address)).to.equal(
          tokensAmount1 + tokensAmount3
        );
        expect(await contract.balance(otherAccount2.address)).to.equal(
          tokensAmount2
        );
        expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(
          usdMin * 3n
        );
        expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(
          usdMax
        );
        expect(await contract.claimedByUser(otherAccount1.address)).to.equal(
          claimed1
        );
        expect(await contract.claimedByUser(otherAccount2.address)).to.equal(
          claimed2
        );

        claimed2 += claim2;

        await expect(contract.connect(otherAccount2).claim())
          .to.emit(contract, "Claim")
          .withArgs(otherAccount2.address, claim2);

        expect(await contract.avalableToClaimGlobal()).to.equal(percent);
        expect(await contract.tokensSoldAmountMax()).to.equal(allocation);
        expect(await contract.tokensSoldAmount()).to.equal(
          tokensAmount1 + tokensAmount2 + tokensAmount3
        );
        expect(await contract.startUnlock()).to.equal(startUnlock);
        expect(await contract.seedIsStarted()).to.false;
        expect(await contract.vestingIsStarted()).to.true;
        expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
          tokensAmount1 + tokensAmount2 + tokensAmount3 - claimed1 - claimed2
        );
        expect(await usd.balanceOf(await contract.getAddress())).to.equal(
          usdMin * 3n + usdMax
        );
        expect(await rmc.balanceOf(otherAccount1.address)).to.equal(claimed1);
        expect(await usd.balanceOf(otherAccount1.address)).to.equal(
          usdMax - usdMin * 3n
        );
        expect(await rmc.balanceOf(otherAccount2.address)).to.equal(claimed2);
        expect(await usd.balanceOf(otherAccount2.address)).to.equal(0);
        expect(await contract.balance(otherAccount1.address)).to.equal(
          tokensAmount1 + tokensAmount3
        );
        expect(await contract.balance(otherAccount2.address)).to.equal(
          tokensAmount2
        );
        expect(await contract.balanceInUSD(otherAccount1.address)).to.equal(
          usdMin * 3n
        );
        expect(await contract.balanceInUSD(otherAccount2.address)).to.equal(
          usdMax
        );
        expect(await contract.claimedByUser(otherAccount1.address)).to.equal(
          claimed1
        );
        expect(await contract.claimedByUser(otherAccount2.address)).to.equal(
          claimed2
        );

        prevPercent = percent;
      } else {
        await expect(contract.connect(otherAccount1).claim()).to.reverted;
        await expect(contract.connect(otherAccount2).claim()).to.reverted;
      }

      await time.increase(unlockPeriod);
    }

    await expect(contract.connect(otherAccount1).claim()).to.reverted;

    await expect(contract.connect(otherAccount2).claim()).to.reverted;

    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(0);
    expect(await rmc.balanceOf(otherAccount1.address)).to.equal(
      tokensAmount1 + tokensAmount3
    );
    expect(await rmc.balanceOf(otherAccount2.address)).to.equal(tokensAmount2);
    expect(await contract.claimedByUser(otherAccount1.address)).to.equal(
      tokensAmount1 + tokensAmount3
    );
    expect(await contract.claimedByUser(otherAccount2.address)).to.equal(
      tokensAmount2
    );

    const usdAmout = usdMin * 3n + usdMax;

    await expect(contract.distributionBUSD()).to.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await expect(contract.connect(owner).distributionBUSD())
      .to.emit(contract, "Phase")
      .withArgs(owner.address, "distributionBUSD")
      .to.emit(usd, "Transfer")
      .withArgs(
        await contract.getAddress(),
        await contract.marketingAddress(),
        (usdAmout * BigInt(options.marketingPercent)) / percentDeniminator
      )
      .to.emit(usd, "Transfer")
      .withArgs(
        await contract.getAddress(),
        await contract.teamAddress(),
        (usdAmout * BigInt(options.teamPercent)) / percentDeniminator
      )
      .to.emit(usd, "Transfer")
      .withArgs(
        await contract.getAddress(),
        await contract.reserveAddress(),
        (usdAmout * BigInt(options.reservePercent)) / percentDeniminator
      )
      .to.emit(usd, "Transfer")
      .withArgs(
        await contract.getAddress(),
        await contract.liquidityAddress(),
        (usdAmout * BigInt(options.liquidityPercent)) / percentDeniminator
      );

    expect(await usd.balanceOf(await contract.getAddress())).to.equal(0);
    expect(await usd.balanceOf(await contract.marketingAddress())).to.equal(
      (usdAmout * BigInt(options.marketingPercent)) / percentDeniminator
    );
    expect(await usd.balanceOf(await contract.teamAddress())).to.equal(
      (usdAmout * BigInt(options.teamPercent)) / percentDeniminator
    );
    expect(await usd.balanceOf(await contract.reserveAddress())).to.equal(
      (usdAmout * BigInt(options.reservePercent)) / percentDeniminator
    );
    expect(await usd.balanceOf(await contract.liquidityAddress())).to.equal(
      (usdAmout * BigInt(options.liquidityPercent)) / percentDeniminator
    );
  };

  const runVesting = async (contract, rmc, owner, recipient, options) => {
    const allocation =
      (totalSupply * BigInt(options.allocation)) / percentDeniminator;

    await rmc.connect(owner).transfer(await contract.getAddress(), allocation);

    expect(await contract.avalableToClaimGlobal()).to.equal(0);
    expect(await contract.claimed()).to.equal(0);
    expect(await contract.distributionAmount()).to.equal(0);
    expect(await contract.nextUnlock()).to.equal(0);
    expect(await contract.startUnlock()).to.equal(0);
    expect(await contract.vestingIsStarted()).to.false;
    expect(await contract.recipientAddress()).to.equal(recipient.address);
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await rmc.balanceOf(recipient.address)).to.equal(0);

    await expect(contract.startVesting()).to.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
    await contract.connect(owner).startVesting();
    await expect(contract.connect(owner).startVesting()).to.reverted;

    const startUnlock = BigInt(await time.latest()) - 1n;

    expect(await contract.avalableToClaimGlobal()).to.equal(options.unlockTGE);
    expect(await contract.claimed()).to.equal(0);
    expect(await contract.distributionAmount()).to.equal(allocation);
    expect(await contract.nextUnlock()).to.equal(
      startUnlock + unlockPeriod * BigInt(options.cliff)
    );
    expect(await contract.startUnlock()).to.equal(startUnlock);
    expect(await contract.vestingIsStarted()).to.true;
    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
      allocation
    );
    expect(await rmc.balanceOf(recipient.address)).to.equal(0);

    await rmc
      .connect(owner)
      .setIsWhitelisted(await contract.getAddress(), true);

    let percent = BigInt(options.unlockTGE);
    let prevPercent = 0n;
    let claimed = 0n;
    let addPercent = BigInt(getUnlockPercent(options));

    for (let i = 0; i < options.vesting + options.cliff; i++) {
      const mount = i - options.cliff;

      if (mount >= 0) percent += addPercent;
      if (percent > 10000n) percent = 10000n;

      if (percent > prevPercent) {
        const avalableToClaim = (allocation * percent) / percentDeniminator;
        const claim = avalableToClaim - claimed;

        claimed += claim;

        await expect(contract.claim())
          .to.emit(rmc, "Transfer")
          .withArgs(await contract.getAddress(), recipient.address, claim);
        expect(await contract.claimed()).to.equal(claimed);
        expect(await rmc.balanceOf(await contract.getAddress())).to.equal(
          allocation - claimed
        );
        expect(await rmc.balanceOf(recipient.address)).to.equal(claimed);

        prevPercent = percent;
      } else {
        await expect(contract.claim()).to.reverted;
      }

      await time.increase(unlockPeriod);
    }

    await expect(contract.claim()).to.reverted;

    expect(await rmc.balanceOf(await contract.getAddress())).to.equal(0);
    expect(await rmc.balanceOf(recipient.address)).to.equal(allocation);
    expect(await contract.claimed()).to.equal(allocation);
  };

  const getUnlockPercent = (options) =>
    Math.ceil((10000 - options.unlockTGE) / options.vesting);

  describe("Deployment", function () {
    it("StrategicRoundLock", async function () {
      const { strategicLock, owner } = await loadFixture(deployRoomCoinFixture);

      await checkPresale(strategicLock, strategicLockOptions, owner);
    });

    it("SeedRoundLock", async function () {
      const { seedLock, owner } = await loadFixture(deployRoomCoinFixture);

      await checkPresale(seedLock, seedLockOptions, owner);
    });

    it("PrivateRoundStage1Lock", async function () {
      const { private1Lock, owner } = await loadFixture(deployRoomCoinFixture);

      await checkPresale(private1Lock, private1LockOptions, owner);
    });

    it("PrivateRoundStage2Lock", async function () {
      const { private2Lock, owner } = await loadFixture(deployRoomCoinFixture);

      await checkPresale(private2Lock, private2LockOptions, owner);
    });

    it("TGELock", async function () {
      const { tgeLock, owner } = await loadFixture(deployRoomCoinFixture);

      await checkPresale(tgeLock, tgeLockOptions, owner);
    });

    it("FoundersAndTeamLock", async function () {
      const { foundersAndTeamLock, owner, team } = await loadFixture(
        deployRoomCoinFixture
      );

      await checkVesting(
        foundersAndTeamLock,
        foundersAndTeamLockOptions,
        owner,
        team
      );
    });

    it("AdvisorsLock", async function () {
      const { advisorsLock, owner, advisors } = await loadFixture(
        deployRoomCoinFixture
      );

      await checkVesting(advisorsLock, advisorsLockOptions, owner, advisors);
    });

    it("MarketingLock", async function () {
      const { marketingLock, owner, marketing } = await loadFixture(
        deployRoomCoinFixture
      );

      await checkVesting(marketingLock, marketingLockOptions, owner, marketing);
    });

    it("GamersRewardsLock", async function () {
      const { gamersRewardsLock, owner, gamersRewards } = await loadFixture(
        deployRoomCoinFixture
      );

      await checkVesting(
        gamersRewardsLock,
        gamersRewardsLockOptions,
        owner,
        gamersRewards
      );
    });

    it("DevelopmentLock", async function () {
      const { developmentLock, owner, development } = await loadFixture(
        deployRoomCoinFixture
      );

      await checkVesting(
        developmentLock,
        developmentLockOptions,
        owner,
        development
      );
    });

    it("TreasuryLock", async function () {
      const { treasuryLock, owner, treasury } = await loadFixture(
        deployRoomCoinFixture
      );

      await checkVesting(treasuryLock, treasuryLockOptions, owner, treasury);
    });
  });

  describe("Presale", function () {
    it("StrategicRoundLock", async function () {
      const { strategicLock, owner, otherAccount1, otherAccount2, rmc, usd } =
        await loadFixture(deployRoomCoinFixture);

      await runPresale(
        strategicLock,
        usd,
        rmc,
        owner,
        otherAccount1,
        otherAccount2,
        strategicLockOptions
      );
    });

    it("SeedRoundLock", async function () {
      const { seedLock, owner, otherAccount1, otherAccount2, rmc, usd } =
        await loadFixture(deployRoomCoinFixture);

      await runPresale(
        seedLock,
        usd,
        rmc,
        owner,
        otherAccount1,
        otherAccount2,
        seedLockOptions
      );
    });

    it("PrivateRoundStage1Lock", async function () {
      const { private1Lock, owner, otherAccount1, otherAccount2, rmc, usd } =
        await loadFixture(deployRoomCoinFixture);

      await runPresale(
        private1Lock,
        usd,
        rmc,
        owner,
        otherAccount1,
        otherAccount2,
        private1LockOptions
      );
    });

    it("PrivateRoundStage2Lock", async function () {
      const { private2Lock, owner, otherAccount1, otherAccount2, rmc, usd } =
        await loadFixture(deployRoomCoinFixture);

      await runPresale(
        private2Lock,
        usd,
        rmc,
        owner,
        otherAccount1,
        otherAccount2,
        private2LockOptions
      );
    });

    it("TGELock", async function () {
      const { tgeLock, owner, otherAccount1, otherAccount2, rmc, usd } =
        await loadFixture(deployRoomCoinFixture);

      await runPresale(
        tgeLock,
        usd,
        rmc,
        owner,
        otherAccount1,
        otherAccount2,
        tgeLockOptions
      );
    });
  });

  describe("Vesting", function () {
    it("FoundersAndTeamLock", async function () {
      const { foundersAndTeamLock, owner, rmc, team } = await loadFixture(
        deployRoomCoinFixture
      );

      await runVesting(
        foundersAndTeamLock,
        rmc,
        owner,
        team,
        foundersAndTeamLockOptions
      );
    });

    it("AdvisorsLock", async function () {
      const { advisorsLock, owner, rmc, advisors } = await loadFixture(
        deployRoomCoinFixture
      );

      await runVesting(advisorsLock, rmc, owner, advisors, advisorsLockOptions);
    });

    it("MarketingLock", async function () {
      const { marketingLock, owner, rmc, marketing } = await loadFixture(
        deployRoomCoinFixture
      );

      await runVesting(
        marketingLock,
        rmc,
        owner,
        marketing,
        marketingLockOptions
      );
    });

    it("GamersRewardsLock", async function () {
      const { gamersRewardsLock, owner, rmc, gamersRewards } =
        await loadFixture(deployRoomCoinFixture);

      await runVesting(
        gamersRewardsLock,
        rmc,
        owner,
        gamersRewards,
        gamersRewardsLockOptions
      );
    });

    it("DevelopmentLock", async function () {
      const { developmentLock, owner, rmc, development } = await loadFixture(
        deployRoomCoinFixture
      );

      await runVesting(
        developmentLock,
        rmc,
        owner,
        development,
        developmentLockOptions
      );
    });

    it("TreasuryLock", async function () {
      const { treasuryLock, owner, rmc, treasury } = await loadFixture(
        deployRoomCoinFixture
      );

      await runVesting(treasuryLock, rmc, owner, treasury, treasuryLockOptions);
    });
  });
});
