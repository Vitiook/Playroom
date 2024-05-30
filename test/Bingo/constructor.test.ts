import { expect } from "chai";
import { ethers } from "hardhat";
import { Bingo, Bingo__factory, DataFeeds, DataFeeds__factory } from "../../types/typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Method: initialize", () => {
  let BingoInstance: Bingo__factory, bingo: Bingo, dataFeeds: DataFeeds, owner: SignerWithAddress;

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    owner = signers[0];

    const DataFeedsInstance: DataFeeds__factory = await ethers.getContractFactory("DataFeeds", owner);

    dataFeeds = await DataFeedsInstance.deploy();
    BingoInstance = await ethers.getContractFactory("Bingo", owner);
  });

  describe("When one of parameters is incorrect", () => {
    it("When the contract has already been initialized", async () => {
      bingo = await upgrades.deployProxy(BingoInstance, [await dataFeeds.getAddress()]);
      await bingo.waitForDeployment();

      await expect(bingo.initialize(await dataFeeds.getAddress())).to.be.revertedWithCustomError(
        bingo,
        "InvalidInitialization"
      );
    });
  });

  describe("When all the parameters are correct", () => {
    before(async () => {
      bingo = await upgrades.deployProxy(BingoInstance, [await dataFeeds.getAddress()]);
      await bingo.waitForDeployment();
    });

    it("Should be deployed", () => {
      expect(bingo.target).to.be.properAddress;
    });

    it("Should be set DEFAULT_ADMIN_ROLE", async () => {
      const DEFAULT_ADMIN_ROLE = await bingo.DEFAULT_ADMIN_ROLE();
      expect(await bingo.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.eq(true);
    });

    it("Should be set dataFeeds address", async () => {
      expect(await bingo.dataFeeds()).to.eq(dataFeeds);
    });
  });
});
