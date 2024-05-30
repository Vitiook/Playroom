import { expect } from "chai";
import { ethers } from "hardhat";
import { Token, Token__factory } from "../../types/typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Method: initialize", () => {
  let TokenInstance: Token__factory, token: Token, owner: SignerWithAddress;
  const name = "Lotto Stable Token";
  const symbol = "LST";
  const decimals = 18;

  before(async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    owner = signers[0];

    TokenInstance = await ethers.getContractFactory("Token", owner);
  });

  describe("When one of parameters is incorrect", () => {
    it("When the contract has already been initialized", async () => {
      token = await upgrades.deployProxy(TokenInstance, [name, symbol]);
      await token.waitForDeployment();

      await expect(token.initialize(name, symbol)).to.be.revertedWithCustomError(token, "InvalidInitialization");
    });
  });

  describe("When all the parameters are correct", () => {
    before(async () => {
      token = await upgrades.deployProxy(TokenInstance, [name, symbol]);
      await token.waitForDeployment();
    });

    it("Should be deployed", () => {
      expect(token.target).to.be.properAddress;
    });

    it("Should be set DEFAULT_ADMIN_ROLE", async () => {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.eq(true);
    });

    it("Should be set token name", async () => {
      expect(await token.name()).to.eq(name);
    });

    it("Should be set token symbol", async () => {
      expect(await token.symbol()).to.eq(symbol);
    });

    it("Should be set token decimals", async () => {
      expect(await token.decimals()).to.equal(decimals);
    });
  });
});
