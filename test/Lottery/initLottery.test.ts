import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareLottery, LotteryType, LotteryStatus } from "../utils";

describe("Method: initLottery", () => {
  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a lottery admin", async () => {
      const { lottery, owner, LOTTERY_ADMIN_ROLE } = await loadFixture(standardPrepareLottery);
      const lotteryTime = (await time.latest()) + 3600;

      await expect(lottery.connect(owner).initLottery(LotteryType.Weekly, lotteryTime))
        .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
        .withArgs(`${owner.address}`, `${LOTTERY_ADMIN_ROLE}`);
    });
  });

  describe("When all the parameters are correct", () => {
    let lottery: Lottery, lotteryAdmin: SignerWithAddress, result: ContractTransaction, lotteryTime: number;

    before(async () => {
      const res = await loadFixture(standardPrepareLottery);
      lottery = res.lottery;
      lotteryAdmin = res.lotteryAdmin;
      lotteryTime = (await time.latest()) + 3600;

      result = await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be set lottery data", async () => {
      const lotteryData = await lottery.lotteries(0);

      expect(lotteryData[0]).to.eq(LotteryStatus.Init);
      expect(lotteryData[1]).to.eq(LotteryType.Weekly);
      expect(lotteryData[2]).to.eq(lotteryTime);
    });

    it("Should emit InitLottery event", async () => {
      await expect(result).to.emit(lottery, "InitLottery").withArgs(0, LotteryType.Weekly, lotteryTime);
    });

    it("Should init more lotteries", async () => {
      const { lottery, lotteryAdmin } = await loadFixture(standardPrepareLottery);
      const lotteryTime = (await time.latest()) + 3600;

      await expect(lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime))
        .to.emit(lottery, "InitLottery")
        .withArgs(0, LotteryType.Weekly, lotteryTime);
      
      await expect(lottery.connect(lotteryAdmin).initLottery(LotteryType.Monthly, lotteryTime))
        .to.emit(lottery, "InitLottery")
        .withArgs(1, LotteryType.Monthly, lotteryTime);

      await expect(lottery.connect(lotteryAdmin).initLottery(LotteryType.Quarter, lotteryTime))
        .to.emit(lottery, "InitLottery")
        .withArgs(2, LotteryType.Quarter, lotteryTime);

      await expect(lottery.connect(lotteryAdmin).initLottery(LotteryType.Yearly, lotteryTime))
        .to.emit(lottery, "InitLottery")
        .withArgs(3, LotteryType.Yearly, lotteryTime);
    });
  });
});
