import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Bingo, DataFeeds } from "../../types/typechain-types";
import { ZERO_ADDRESS } from "../utils/index";
import { ContractTransaction } from "ethers";
import { standardPrepareBingo } from "../utils";

describe("Method: setDataFeeds", () => {
  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a bingo admin", async () => {
      const { bingo, user, dataFeeds, BINGO_ADMIN_ROLE } = await loadFixture(standardPrepareBingo);

      await expect(bingo.connect(user).setDataFeeds(dataFeeds))
        .to.be.revertedWithCustomError(bingo, "AccessControlUnauthorizedAccount")
        .withArgs(`${user.address}`, `${BINGO_ADMIN_ROLE}`);
    });

    it("When new dataFeeds is zero address", async () => {
      const { bingo, bingoAdmin } = await loadFixture(standardPrepareBingo);

      await expect(bingo.connect(bingoAdmin).setDataFeeds(ZERO_ADDRESS)).to.be.revertedWith(
        "Bingo: Wrong datafeeds address"
      );
    });
  });

  describe("When all the parameters are correct", () => {
    let bingo: Bingo, reserveDataFeeds: DataFeeds, bingoAdmin: SignerWithAddress, result: ContractTransaction;

    before(async () => {
      const res = await loadFixture(standardPrepareBingo);
      bingo = res.bingo;
      reserveDataFeeds = res.reserveDataFeeds;
      bingoAdmin = res.bingoAdmin;

      result = await bingo.connect(bingoAdmin).setDataFeeds(reserveDataFeeds);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be set new dataFeeds address", async () => {
      expect(await bingo.dataFeeds()).to.eq(reserveDataFeeds);
    });

    it("Should emit SetDataFeeds event", async () => {
      await expect(result).to.emit(bingo, "SetDataFeeds").withArgs(bingoAdmin, reserveDataFeeds);
    });
  });
});
