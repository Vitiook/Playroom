const { time, mine, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("RoomCoin", function () {
  const name = 'Room Coin';
  const symbol = 'RMC';
  const decimals = 18n;
  const totalSupply = 10_000_000n * 10n ** decimals;
  const fee = 2n;
  const blockTimeout = 10n;
  const deadBlocks = 5n;
  const maxTxAmount = 1_000_000n * 10n ** decimals;

  async function deployRoomCoinFixture() {
    const [deployer, owner, otherAccount1, otherAccount2, pair] = await ethers.getSigners();

    const RMC = await ethers.getContractFactory("RoomCoin");
    const rmc = await RMC.deploy(owner.address);

    const ownerRole = await rmc.DEFAULT_ADMIN_ROLE();
    const pairRole = await rmc.RMC_PAIR_ROLE()

    return { rmc, deployer, owner, otherAccount1, otherAccount2, pair, ownerRole, pairRole };
  }

  describe("Deployment", function () {
    it("Should set name, symbol and decimals", async function () {
      const { rmc, owner, ownerRole } = await loadFixture(deployRoomCoinFixture);

      expect(await rmc.name()).to.equal(name);
      expect(await rmc.symbol()).to.equal(symbol);
      expect(await rmc.decimals()).to.equal(decimals);
      expect(await rmc.totalSupply()).to.equal(totalSupply);
      expect(await rmc.hasRole(ownerRole, owner.address)).to.true;
      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply);
      expect(await rmc.startBlock()).to.equal(0n);
      expect(await rmc.fee()).to.equal(fee);
      expect(await rmc.blockTimeout()).to.equal(blockTimeout);
      expect(await rmc.deadBlocks()).to.equal(deadBlocks);
      expect(await rmc.maxTxAmount()).to.equal(maxTxAmount);
      expect(await rmc.isTradingEnabled()).to.equal(false);
      expect(await rmc.antibot()).to.equal(true);
    });
  });

  describe("OpenTrade", function () {
    it("Should open trade", async function () {
      const { rmc, owner } = await loadFixture(deployRoomCoinFixture);

      await expect(rmc.openTrade())
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      const block = await time.latestBlock();

      await expect(rmc.connect(owner).openTrade())
        .to.emit(rmc, "OpenTrade").withArgs(block + 1);

      expect(await rmc.startBlock()).to.equal(block + 1);

      await expect(rmc.connect(owner).openTrade())
        .to.revertedWith("RoomCoin: Trading is already enabled");
    });
  });

  describe("Set Parameters", function () {
    it("Should set fee", async function () {
      const { rmc, owner } = await loadFixture(deployRoomCoinFixture);

      const newFee = 5;

      await expect(rmc.setFee(newFee))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.fee()).to.equal(fee);

      await expect(rmc.connect(owner).setFee(newFee))
        .to.emit(rmc, "SetFee").withArgs(newFee);

      expect(await rmc.fee()).to.equal(newFee);

      await expect(rmc.connect(owner).setFee(0))
        .to.emit(rmc, "SetFee").withArgs(0);

      expect(await rmc.fee()).to.equal(0);

      await expect(rmc.connect(owner).setFee(6))
        .to.revertedWith("RoomCoin: Wronf fee amount");
    });

    it("Should set block timeout", async function () {
      const { rmc, owner } = await loadFixture(deployRoomCoinFixture);

      const newBlockTimeout = await rmc.MAX_BLOCK_TIMEOUT();

      await expect(rmc.setBlockTimeout(newBlockTimeout))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.blockTimeout()).to.equal(blockTimeout);

      await expect(rmc.connect(owner).setBlockTimeout(newBlockTimeout))
        .to.emit(rmc, "SetBlockTimeout").withArgs(newBlockTimeout);

      expect(await rmc.blockTimeout()).to.equal(newBlockTimeout);

      await expect(rmc.connect(owner).setBlockTimeout(0))
        .to.emit(rmc, "SetBlockTimeout").withArgs(0);

      expect(await rmc.blockTimeout()).to.equal(0);

      await expect(rmc.connect(owner).setBlockTimeout(86401))
        .to.revertedWith("RoomCoin: Block timeout can't be more when 1 day");
    });

    it("Should set dead block", async function () {
      const { rmc, owner } = await loadFixture(deployRoomCoinFixture);

      const newDeadBlocks = 1000;

      await expect(rmc.setDeadBlocks(newDeadBlocks))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.deadBlocks()).to.equal(deadBlocks);

      await expect(rmc.connect(owner).setDeadBlocks(newDeadBlocks))
        .to.emit(rmc, "SetDeadBlocks").withArgs(newDeadBlocks);

      expect(await rmc.deadBlocks()).to.equal(newDeadBlocks);

      await expect(rmc.connect(owner).setDeadBlocks(0))
        .to.emit(rmc, "SetDeadBlocks").withArgs(0);

      expect(await rmc.deadBlocks()).to.equal(0);
    });

    it("Should set max tx amount", async function () {
      const { rmc, owner } = await loadFixture(deployRoomCoinFixture);

      const newMaxTxAmount = totalSupply;

      await expect(rmc.setMaxTxAmount(newMaxTxAmount))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.maxTxAmount()).to.equal(maxTxAmount);

      await expect(rmc.connect(owner).setMaxTxAmount(newMaxTxAmount))
        .to.emit(rmc, "SetMaxTxAmount").withArgs(newMaxTxAmount);

      expect(await rmc.maxTxAmount()).to.equal(newMaxTxAmount);

      await expect(rmc.connect(owner).setMaxTxAmount(1))
        .to.emit(rmc, "SetMaxTxAmount").withArgs(1);

      expect(await rmc.maxTxAmount()).to.equal(1);

      await expect(rmc.connect(owner).setMaxTxAmount(totalSupply + 1n))
        .to.revertedWith("RoomCoin: Max tx amount can't be more than total supply");

      await expect(rmc.connect(owner).setMaxTxAmount(0))
        .to.revertedWith("RoomCoin: Max tx amount can't be zero");
    });

    it("Should add pair", async function () {
      const { rmc, owner, otherAccount1, pairRole } = await loadFixture(deployRoomCoinFixture);
      
      expect(await rmc.getRoleMemberCount(pairRole)).to.equal(0);

      await rmc.connect(owner).grantRole(pairRole, otherAccount1.address);

      expect(await rmc.getRoleMemberCount(pairRole)).to.equal(1);
      expect(await rmc.hasRole(pairRole, otherAccount1.address)).to.true;

      await rmc.connect(owner).revokeRole(pairRole, otherAccount1.address);

      expect(await rmc.getRoleMemberCount(pairRole)).to.equal(0);
      expect(await rmc.hasRole(pairRole, otherAccount1.address)).to.false;
    });

    it("Should set antibot", async function () {
      const { rmc, owner } = await loadFixture(deployRoomCoinFixture);

      await expect(rmc.setAntibot(false))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.antibot()).to.equal(true);

      await expect(rmc.connect(owner).setAntibot(false))
        .to.emit(rmc, "SetAntibot").withArgs(false);

      expect(await rmc.antibot()).to.equal(false);

      await expect(rmc.connect(owner).setAntibot(true))
        .to.emit(rmc, "SetAntibot").withArgs(true);

      expect(await rmc.antibot()).to.equal(true);
    });

    it("Should set isWhitelisted", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      await expect(rmc.setIsWhitelisted(otherAccount1.address, true))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.isWhitelisted(otherAccount1.address)).to.equal(false);

      await expect(rmc.connect(owner).setIsWhitelisted(otherAccount1.address, true))
        .to.emit(rmc, "SetIsWhitelisted").withArgs(otherAccount1.address, true);

      expect(await rmc.isWhitelisted(otherAccount1.address)).to.equal(true);

      await expect(rmc.connect(owner).setIsWhitelisted(otherAccount1.address, false))
        .to.emit(rmc, "SetIsWhitelisted").withArgs(otherAccount1.address, false);

      expect(await rmc.isWhitelisted(otherAccount1.address)).to.equal(false);


      await expect(rmc.setBanchIsWhitelisted([otherAccount1.address, otherAccount2.address], true))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.isWhitelisted(otherAccount1.address)).to.equal(false);
      expect(await rmc.isWhitelisted(otherAccount2.address)).to.equal(false);

      await expect(rmc.connect(owner).setBanchIsWhitelisted([otherAccount1.address, otherAccount2.address], true))
        .to.emit(rmc, "SetIsWhitelisted").withArgs(otherAccount1.address, true)
        .to.emit(rmc, "SetIsWhitelisted").withArgs(otherAccount2.address, true);

      expect(await rmc.isWhitelisted(otherAccount1.address)).to.equal(true);
      expect(await rmc.isWhitelisted(otherAccount2.address)).to.equal(true);
    });

    it("Should set isBlacklisted", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      await expect(rmc.setIsBlacklisted(otherAccount1.address, true))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.equal(false);

      await expect(rmc.connect(owner).setIsBlacklisted(otherAccount1.address, true))
        .to.emit(rmc, "SetIsBlacklisted").withArgs(otherAccount1.address, true);

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.equal(true);

      await expect(rmc.connect(owner).setIsBlacklisted(otherAccount1.address, false))
        .to.emit(rmc, "SetIsBlacklisted").withArgs(otherAccount1.address, false);

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.equal(false);


      await expect(rmc.setBanchIsBlacklisted([otherAccount1.address, otherAccount2.address], true))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.equal(false);
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.equal(false);

      await expect(rmc.connect(owner).setBanchIsBlacklisted([otherAccount1.address, otherAccount2.address], true))
        .to.emit(rmc, "SetIsBlacklisted").withArgs(otherAccount1.address, true)
        .to.emit(rmc, "SetIsBlacklisted").withArgs(otherAccount2.address, true);

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.equal(true);
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.equal(true);
    });

    it("Should set isDisabledFee", async function () {
      const { rmc, owner, otherAccount1 } = await loadFixture(deployRoomCoinFixture);

      await expect(rmc.setIsDisabledFee(otherAccount1.address, true))
        .to.revertedWithCustomError(rmc, "AccessControlUnauthorizedAccount");

      expect(await rmc.isDisabledFee(otherAccount1.address)).to.equal(false);

      await expect(rmc.connect(owner).setIsDisabledFee(otherAccount1.address, true))
        .to.emit(rmc, "SetIsDisabledFee").withArgs(otherAccount1.address, true);

      expect(await rmc.isDisabledFee(otherAccount1.address)).to.equal(true);

      await expect(rmc.connect(owner).setIsDisabledFee(otherAccount1.address, false))
        .to.emit(rmc, "SetIsDisabledFee").withArgs(otherAccount1.address, false);

      expect(await rmc.isDisabledFee(otherAccount1.address)).to.equal(false);
    });
  });

  describe("Burn", function () {
    it("Should be burn tokens", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      const value1 = 10n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await rmc.connect(owner).transfer(otherAccount1.address, value2);

      expect(await rmc.totalSupply()).to.equal(totalSupply);
      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value2);
      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2);

      await expect(rmc.connect(otherAccount1).burn(value1))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, ethers.ZeroAddress, value1);

      expect(await rmc.totalSupply()).to.equal(totalSupply - value1);
      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value2);
      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - value1);

      await expect(rmc.connect(owner).burn(value1))
        .to.emit(rmc, "Transfer").withArgs(owner.address, ethers.ZeroAddress, value1);

      expect(await rmc.totalSupply()).to.equal(totalSupply - value1 - value1);
      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value2 - value1);
      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - value1);

      await expect(rmc.connect(otherAccount1).burn(value2))
        .to.revertedWithCustomError(rmc, "ERC20InsufficientBalance");

      expect(await rmc.totalSupply()).to.equal(totalSupply - value1 - value1);
      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value2 - value1);
      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - value1);
    });
  });

  describe("Transfer", function () {
    it("Should be transfer tokens if whitelisted ", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      const value1 = 10n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await expect(rmc.connect(owner).transfer(otherAccount1.address, value1))
        .to.emit(rmc, "Transfer").withArgs(owner.address, otherAccount1.address, value1);

      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value1);
      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value1);

      await expect(rmc.connect(owner).transfer(otherAccount2.address, value2))
        .to.emit(rmc, "Transfer").withArgs(owner.address, otherAccount2.address, value2);

      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value1 - value2);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value2);

      await expect(rmc.connect(otherAccount1).transfer(owner.address, value1 / 2n))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, owner.address, value1 / 2n);

      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value1 - value2 + (value1 / 2n));
      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value1 / 2n);

      await expect(rmc.connect(otherAccount2).transfer(owner.address, value2 / 2n))
        .to.emit(rmc, "Transfer").withArgs(otherAccount2.address, owner.address, value2 / 2n);

      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - value1 - value2 + (value1 / 2n) + (value2 / 2n));
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value2 / 2n);

      await rmc.connect(otherAccount1).approve(otherAccount2.address, value1 / 2n);
      await rmc.connect(otherAccount2).approve(otherAccount1.address, value2 / 2n);

      await expect(rmc.connect(otherAccount1).transferFrom(otherAccount2.address, owner.address, value2 / 2n))
        .to.emit(rmc, "Transfer").withArgs(otherAccount2.address, owner.address, value2 / 2n);

      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply - (value1 / 2n));
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0n);

      await expect(rmc.connect(otherAccount2).transferFrom(otherAccount1.address, owner.address, value1 / 2n))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, owner.address, value1 / 2n);

      expect(await rmc.balanceOf(owner.address)).to.equal(totalSupply);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0n);
    });


    it("Should be NOT transfer tokens if trading is disabled", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      const value1 = 10n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await rmc.connect(owner).transfer(otherAccount1.address, value1);
      await rmc.connect(owner).transfer(otherAccount2.address, value2);

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, value1))
        .to.revertedWith("RoomCoin: Trading is disabled");
      
      await expect(rmc.connect(otherAccount2).transfer(otherAccount1.address, value2))
        .to.revertedWith("RoomCoin: Trading is disabled");

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value1);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value2);
    });

    it("Should be NOT transfer tokens if blacklisted", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      const value1 = 10n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await rmc.connect(owner).transfer(otherAccount1.address, value1);
      await rmc.connect(owner).transfer(otherAccount2.address, value2);

      await rmc.connect(owner).openTrade();

      await mine(deadBlocks);

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.false;

      await rmc.connect(owner).setBanchIsBlacklisted([otherAccount1.address, otherAccount2.address], true);

      expect(await rmc.isBlacklisted(otherAccount1.address)).to.true;
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.true;

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, value1))
        .to.revertedWith("RoomCoin: Blacklisted address");
    
      await expect(rmc.connect(otherAccount2).transfer(otherAccount1.address, value2))
        .to.revertedWith("RoomCoin: Blacklisted address");
    });

    it("Should be transfer tokens if tx bigger then max tx", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      await rmc.connect(owner).transfer(otherAccount1.address, maxTxAmount + 1n);
      await rmc.connect(owner).transfer(otherAccount2.address, maxTxAmount + 1n);

      await rmc.connect(owner).openTrade();
      await mine(deadBlocks);

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, maxTxAmount + 1n))
        .to.revertedWith("RoomCoin: Amount must be lower maxTxAmount");

      await expect(rmc.connect(otherAccount2).transfer(otherAccount1.address, maxTxAmount + 1n))
        .to.revertedWith("RoomCoin: Amount must be lower maxTxAmount");
    });


    it("Should be transfer tokens if starting blocks(antibot enabled)", async function () {
      const { rmc, owner, otherAccount1, otherAccount2, pair, pairRole } = await loadFixture(deployRoomCoinFixture);

      const value1 = 1n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await rmc.connect(owner).grantRole(pairRole, pair.address);

      await rmc.connect(owner).transfer(otherAccount1.address, value1);
      await rmc.connect(owner).transfer(pair.address, value2);

      await rmc.connect(owner).openTrade();

      const fee1 = value1 * fee / 100n;
      const fee2 = value2 * fee / 100n;

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value1);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0n);
      expect(await rmc.balanceOf(pair.address)).to.equal(value2);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, value1))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, ethers.ZeroAddress, fee1)
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, otherAccount2.address, value1 - fee1);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0n);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value1 - fee1);
      expect(await rmc.balanceOf(pair.address)).to.equal(value2);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;

      await expect(rmc.connect(otherAccount2).transfer(pair.address, value1 / 2n))
        .to.emit(rmc, "Transfer").withArgs(otherAccount2.address, ethers.ZeroAddress, fee1 / 2n)
        .to.emit(rmc, "Transfer").withArgs(otherAccount2.address, pair.address, (value1 - fee1) / 2n)
        .to.emit(rmc, "SetIsBlacklisted").withArgs(otherAccount2.address, true);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0n);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value1 - fee1 - (value1 / 2n));
      expect(await rmc.balanceOf(pair.address)).to.equal(value2 + ((value1 - fee1) / 2n));
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.true;
      expect(await rmc.isBlacklisted(pair.address)).to.false;

      await expect(rmc.connect(pair).transfer(otherAccount1.address, value2))
        .to.emit(rmc, "Transfer").withArgs(pair.address, ethers.ZeroAddress, fee2)
        .to.emit(rmc, "Transfer").withArgs(pair.address, otherAccount1.address, value2 - fee2)
        .to.emit(rmc, "SetIsBlacklisted").withArgs(otherAccount1.address, true);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - fee2);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value1 - fee1 - (value1 / 2n));
      expect(await rmc.balanceOf(pair.address)).to.equal((value1 - fee1) / 2n);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.true;
      expect(await rmc.isBlacklisted(otherAccount2.address)).to.true;
      expect(await rmc.isBlacklisted(pair.address)).to.false;
    });

    it("Should be transfer tokens to/from pair (blockTimeout)", async function () {
      const { rmc, owner, otherAccount1, pair, pairRole } = await loadFixture(deployRoomCoinFixture);

      const value1 = 1n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await rmc.connect(owner).grantRole(pairRole, pair.address);

      await rmc.connect(owner).transfer(otherAccount1.address, value1);
      await rmc.connect(owner).transfer(pair.address, value2);

      await rmc.connect(owner).openTrade();

      await mine(deadBlocks);

      await rmc.connect(owner).setFee(0);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value1);
      expect(await rmc.balanceOf(pair.address)).to.equal(value2);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;
      expect(await rmc.lastTransfer(otherAccount1.address)).to.equal(0n);

      await expect(rmc.connect(otherAccount1).transfer(pair.address, value1))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, pair.address, value1);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0n);
      expect(await rmc.balanceOf(pair.address)).to.equal(value2 + value1);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;
      expect(await rmc.lastTransfer(otherAccount1.address)).to.equal(0n);

      await expect(rmc.connect(pair).transfer(otherAccount1.address, value2))
        .to.emit(rmc, "Transfer").withArgs(pair.address, otherAccount1.address, value2);

      let block = await time.latestBlock();

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2);
      expect(await rmc.balanceOf(pair.address)).to.equal(value1);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;
      expect(await rmc.lastTransfer(otherAccount1.address)).to.equal(block);

      await expect(rmc.connect(otherAccount1).transfer(pair.address, value1))
        .to.revertedWith("RoomCoin: Not time yet");

      await mine(blockTimeout - 3n);

      await expect(rmc.connect(otherAccount1).transfer(pair.address, value1))
        .to.revertedWith("RoomCoin: Not time yet");

      await expect(rmc.connect(otherAccount1).transfer(pair.address, value2))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, pair.address, value2);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(0n);
      expect(await rmc.balanceOf(pair.address)).to.equal(value2 + value1);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;
      expect(await rmc.lastTransfer(otherAccount1.address)).to.equal(block);

      await expect(rmc.connect(pair).transfer(otherAccount1.address, value1))
        .to.emit(rmc, "Transfer").withArgs(pair.address, otherAccount1.address, value1);

      block = await time.latestBlock();

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value1);
      expect(await rmc.balanceOf(pair.address)).to.equal(value2);
      expect(await rmc.isBlacklisted(otherAccount1.address)).to.false;
      expect(await rmc.isBlacklisted(pair.address)).to.false;
      expect(await rmc.lastTransfer(otherAccount1.address)).to.equal(block);
    });

    it("Should be transfer tokens with different fees", async function () {
      const { rmc, owner, otherAccount1, otherAccount2 } = await loadFixture(deployRoomCoinFixture);

      const getFeeAmount = (value, fee) => value * fee / 100;

      const value1 = 1n * 10n ** decimals;
      const value2 = maxTxAmount / 2n;

      await rmc.connect(owner).transfer(otherAccount1.address, value2);

      await rmc.connect(owner).openTrade();
      await mine(deadBlocks);

      const fee1 = 5n;
      const fee2 = 0n;

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(0n);

      const feeAmount = value1 * await rmc.fee() / 100n;

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, value1))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, ethers.ZeroAddress, feeAmount)
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, otherAccount2.address, value1 - feeAmount);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - value1);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value1 - feeAmount);

      expect(await rmc.totalSupply()).to.equal(totalSupply - feeAmount);

      await rmc.connect(owner).setFee(fee1);
      const feeAmount1 = value1 * await rmc.fee() / 100n;

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, value1))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, ethers.ZeroAddress, feeAmount1)
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, otherAccount2.address, value1 - feeAmount1);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - value1 - value1);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value1 * 2n - feeAmount - feeAmount1);
  
      expect(await rmc.totalSupply()).to.equal(totalSupply - feeAmount - feeAmount1);

      await rmc.connect(owner).setFee(fee2);

      await expect(rmc.connect(otherAccount1).transfer(otherAccount2.address, value1))
        .to.emit(rmc, "Transfer").withArgs(otherAccount1.address, otherAccount2.address, value1);

      expect(await rmc.balanceOf(otherAccount1.address)).to.equal(value2 - value1 * 3n);
      expect(await rmc.balanceOf(otherAccount2.address)).to.equal(value1 * 3n - feeAmount - feeAmount1);
  
      expect(await rmc.totalSupply()).to.equal(totalSupply - feeAmount - feeAmount1);
    });
  });
});
