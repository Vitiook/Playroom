import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareToken } from "../utils";

describe("Method: mint", () => {
  const amount = ethers.parseUnits("10", 18);

  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a token admin", async () => {
      const { owner, user, token, TOKEN_ADMIN_ROLE } = await loadFixture(standardPrepareToken);

      await expect(token.connect(owner).mint(user, amount))
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(`${owner.address}`, `${TOKEN_ADMIN_ROLE}`);
    });
  });

  describe("When all the parameters are correct", () => {
    let token: Token, user: SignerWithAddress, result: ContractTransaction;

    before(async () => {
      const res = await loadFixture(standardPrepareToken);
      token = res.token;
      user = res.user;

      await token.connect(res.owner).grantRole(res.TOKEN_ADMIN_ROLE, res.tokenAdmin);

      result = await token.connect(res.tokenAdmin).mint(user, amount);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("The token balance should be increased", async () => {
      await expect(() => result).to.changeTokenBalances(token, [user], [amount]);
    });
  });
});
