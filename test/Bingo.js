const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const crypto = require("crypto");
const { ethers } = require("hardhat");

describe("Bingo", function () {
  async function deployLotteryFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    const DataFeeds = await ethers.getContractFactory("DataFeeds");
    const dataFeeds = await DataFeeds.deploy();

    const Bingo = await ethers.getContractFactory("Bingo");
    const bingo = await upgrades.deployProxy(Bingo, [
      await dataFeeds.getAddress(),
    ]);
    await bingo.waitForDeployment();

    return { dataFeeds, bingo, owner, otherAccount, otherAccount2 };
  }

  function hexStringToByte(str) {
    const bytes = [];

    for (let i = 2; i < str.length; i += 2) {
      bytes.push(parseInt(str.substr(i, 2), 16));
    }

    return bytes;
  }

  describe("SetDatafeeds", function () {
    it("Should set datafeeds", async function () {
      const { bingo, dataFeeds, owner, otherAccount } = await loadFixture(
        deployLotteryFixture
      );

      expect(await bingo.dataFeeds()).to.equal(await dataFeeds.getAddress());

      await expect(
        bingo.setDataFeeds(otherAccount.address)
      ).to.revertedWithCustomError(bingo, "AccessControlUnauthorizedAccount");

      await bingo.grantRole(await bingo.BINGO_ADMIN_ROLE(), owner.address);

      await expect(bingo.setDataFeeds(otherAccount.address))
        .to.emit(bingo, "SetDataFeeds")
        .withArgs(owner.address, otherAccount.address);

      expect(await bingo.dataFeeds()).to.equal(otherAccount.address);

      await expect(bingo.setDataFeeds(ethers.ZeroAddress)).to.revertedWith(
        "Bingo: Wrong datafeeds address"
      );
    });
  });

  describe("Add table", function () {
    it("Should add table", async function () {
      const { bingo, dataFeeds, owner, otherAccount } = await loadFixture(
        deployLotteryFixture
      );

      const salt = crypto.randomBytes(32);
      await expect(bingo.addTable(salt, 90)).to.revertedWithCustomError(
        bingo,
        "AccessControlUnauthorizedAccount"
      );

      await expect(
        bingo.connect(otherAccount).addTable(salt, 90)
      ).to.revertedWithCustomError(bingo, "AccessControlUnauthorizedAccount");

      await bingo.grantRole(
        await bingo.BINGO_ADMIN_ROLE(),
        otherAccount.address
      );

      await expect(
        bingo.connect(otherAccount).addTable(salt, 97)
      ).to.revertedWithCustomError(dataFeeds, "WrongMaxNumber");

      await expect(
        bingo.connect(otherAccount).addTable(salt, 0)
      ).to.revertedWithCustomError(dataFeeds, "WrongMaxNumber");

      expect(await bingo.tableCount()).to.equal(0n);

      await expect(bingo.connect(otherAccount).addTable(salt, 90))
        .to.emit(bingo, "AddTable")
        .withArgs(otherAccount.address, 0, anyValue);

      let nums = await dataFeeds.getNumbersFromBytes(await bingo.tables(0));
      expect(nums.length).to.equal(90);
      expect(new Set(nums).size).to.equal(90);

      expect(await bingo.tableCount()).to.equal(1n);

      await expect(bingo.connect(otherAccount).addTable(salt, 1))
        .to.emit(bingo, "AddTable")
        .withArgs(otherAccount.address, 1, anyValue);

      expect(await bingo.tableCount()).to.equal(2n);

      await expect(bingo.connect(otherAccount).addTable(salt, 96))
        .to.emit(bingo, "AddTable")
        .withArgs(otherAccount.address, 2, anyValue);

      expect(await bingo.tableCount()).to.equal(3n);
    });
  });
});
