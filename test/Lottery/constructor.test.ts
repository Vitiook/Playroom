import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery, Lottery__factory, DataFeeds, Token } from "../../types/typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Method: initialize", () => {
  let LotteryInstance: Lottery__factory, lottery: Lottery, dataFeeds: DataFeeds, token: Token, owner: SignerWithAddress;
  const ticketPrice: number = 10000;
  const lotteryFee: number = 1000;

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    owner = signers[0];

    const DataFeedsInstance: DataFeeds__factory = await ethers.getContractFactory("DataFeeds", owner);
    dataFeeds = await DataFeedsInstance.deploy();

    const TokenInstance = await ethers.getContractFactory("Token", owner);
    token = await upgrades.deployProxy(TokenInstance, ["Test", "TST"]);
    await token.waitForDeployment();

    LotteryInstance = await ethers.getContractFactory("Lottery", owner);
  });

  describe("When one of parameters is incorrect", () => {
    it("When the contract has already been initialized", async () => {
      lottery = await upgrades.deployProxy(LotteryInstance, [dataFeeds.target, token.target, ticketPrice, lotteryFee]);
      await lottery.waitForDeployment();

      await expect(
        lottery.initialize(dataFeeds.target, token.target, ticketPrice, lotteryFee)
      ).to.be.revertedWithCustomError(lottery, "InvalidInitialization");
    });
  });

  describe("When all the parameters are correct", () => {
    before(async () => {
      lottery = await upgrades.deployProxy(LotteryInstance, [dataFeeds.target, token.target, ticketPrice, lotteryFee]);
      await lottery.waitForDeployment();
    });

    it("Should be deployed", () => {
      expect(lottery.target).to.be.properAddress;
    });

    it("Should be set DEFAULT_ADMIN_ROLE", async () => {
      const DEFAULT_ADMIN_ROLE = await lottery.DEFAULT_ADMIN_ROLE();
      expect(await lottery.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.eq(true);
    });

    it("Should be set ticketPrice", async () => {
      expect(await lottery.ticketPrice()).to.eq(ticketPrice);
    });

    it("Should be set lotteryFee", async () => {
      expect(await lottery.lotteryFee()).to.eq(lotteryFee);
    });
  });
});
