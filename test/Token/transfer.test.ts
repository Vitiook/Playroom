import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareToken } from "../utils";

describe("Method: transfer", () => {
  const amount = ethers.parseUnits("10", 18);

  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a token admin", async () => {
      const { user, owner, token } = await loadFixture(standardPrepareToken);

      await expect(token.connect(user).transfer(owner, amount)).to.be.revertedWith("Token: Forbidden transfer");
    });
  });

  describe("When all the parameters are correct", () => {
    let token: Token, user: SignerWithAddress, user2: SignerWithAddress, result: ContractTransaction;

    describe("When the recipient has a CONTRACT_ROLE", () => {
      before(async () => {
        const res = await loadFixture(standardPrepareToken);
        token = res.token;
        user = res.user;
        user2 = res.user2;

        result = await token.connect(user).transfer(user2, amount);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("The token balance should be changed", async () => {
        await expect(() => result).to.changeTokenBalances(token, [user, user2], [-amount, amount]);
      });
    });

    describe("When the sender has a CONTRACT_ROLE", () => {
      before(async () => {
        const res = await loadFixture(standardPrepareToken);
        token = res.token;
        user = res.user;
        user2 = res.user2;

        result = await token.connect(user2).transfer(user, amount);
      });
      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("The token balance should be changed", async () => {
        await expect(() => result).to.changeTokenBalances(token, [user2, user], [-amount, amount]);
      });
    });
  });
});
