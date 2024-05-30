import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import {
  standardPrepareLottery,
  buyTickets,
  LotteryType,
  LotteryStatus,
  generationTickets,
  getUsersWinnerId,
  checkWinNumbers,
  WinType,
} from "../utils";
import crypto from "crypto";

describe("Method: calculateLottery", () => {
  let lottery: Lottery,
    bob: SignerWithAddress,
    token: Token,
    alice: SignerWithAddress,
    owner: SignerWithAddress,
    lotteryAdmin: SignerWithAddress,
    ticketPrice: number,
    LOTTERY_ADMIN_ROLE: string,
    jackpot: number,
    lotteryPool: bigint;

  const lotteryID = 0;
  const winTickets = Array(5).fill(0n);
  const winValuesPerTicket = Array(5).fill(0n);

  before(async () => {
    const res = await loadFixture(standardPrepareLottery);
    lottery = res.lottery;
    bob = res.bob;
    token = res.token;
    alice = res.alice;
    owner = res.owner;
    lotteryAdmin = res.lotteryAdmin;
    ticketPrice = res.ticketPrice;
    LOTTERY_ADMIN_ROLE = res.LOTTERY_ADMIN_ROLE;
    lottery = lottery;

    const lotteryTime = (await time.latest()) + 3600;
    await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
    await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);
    const numbersBob = generationTickets(100);
    await buyTickets(alice, BigInt(100), ticketPrice, token, lottery);
    const numbersAlice = generationTickets(50);

    await lottery.connect(bob).registerTickets(0, numbersBob);
    await lottery.connect(alice).registerTickets(0, numbersAlice);
    await time.increaseTo(lotteryTime);
    const salt = crypto.randomBytes(32);

    await lottery.connect(lotteryAdmin).drawnLottery(0, salt);
    const weeklyPercent = BigInt(350);
    const monthlyPercent = BigInt(1000);
    const quarterlyPercent = BigInt(2500);
    const yearlyPercent = BigInt(10000);
    const typeLotteryPercent = [weeklyPercent, monthlyPercent, quarterlyPercent, yearlyPercent];

    jackpot = await lottery.totalJackpot();

    const preLotteryPool = (jackpot * typeLotteryPercent[0]) / BigInt(10000);

    const combinedTickets = [...numbersBob, ...numbersAlice];
    const lotteryData = await lottery.lotteries(0);
    const winnerNumbers = lotteryData[3];
    for (let i = 0; i < combinedTickets.length; i++) {
      const winType = await checkWinNumbers(winnerNumbers, combinedTickets[i]);
      winTickets[winType] = winTickets[winType] + 1n;
    }

    const winValuesPerNumber = Array(5).fill(0n);
    const num3Percent = 500n;
    const num4Percent = 1000n;
    const num5Percent = 2000n;
    const num6Percent = 6500n;
    winValuesPerNumber[1] = (preLotteryPool * num3Percent) / 10000n;
    winValuesPerNumber[2] = (preLotteryPool * num4Percent) / 10000n;
    winValuesPerNumber[3] = (preLotteryPool * num5Percent) / 10000n;
    winValuesPerNumber[4] = (preLotteryPool * num6Percent) / 10000n;

    for (let i = 1; i < 5; i++) {
      if (winTickets[i] > 0) winValuesPerTicket[i] = winValuesPerNumber[i] / winTickets[i];
    }

    lotteryPool = BigInt(0);
    for (let i = 0; i < 5; i++) {
      lotteryPool += BigInt(winTickets[i] * winValuesPerTicket[i]);
    }

    await getUsersWinnerId([numbersBob, numbersAlice], combinedTickets, winnerNumbers);
  });

  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a lottery admin", async () => {
      await expect(
        lottery.connect(owner).calculateLottery(lotteryID, jackpot, lotteryPool, winTickets, winValuesPerTicket)
      )
        .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
        .withArgs(`${owner.address}`, `${LOTTERY_ADMIN_ROLE}`);
    });

    it("When the lottery is not drawn", async () => {
      await expect(
        lottery.connect(lotteryAdmin).calculateLottery(1, jackpot, lotteryPool, winTickets, winValuesPerTicket)
      ).to.be.revertedWith("Lottery: Lottery not drawn");
    });

    it("When the pool value is wrong", async () => {
      await expect(
        lottery
          .connect(lotteryAdmin)
          .calculateLottery(
            lotteryID,
            ethers.parseUnits("100", 18),
            ethers.parseUnits("10", 18),
            winTickets,
            winValuesPerTicket
          )
      ).to.be.revertedWith("Lottery: Wrong pool value");
    });

    it("When the lottery pool is too much", async () => {
      await expect(
        lottery
          .connect(lotteryAdmin)
          .calculateLottery(lotteryID, jackpot, ethers.parseUnits("1000", 18), winTickets, winValuesPerTicket)
      ).to.be.revertedWith("Lottery: Lottery pool is too much");
    });

    it("When the lottery pool is too much", async () => {
      await expect(
        lottery
          .connect(lotteryAdmin)
          .calculateLottery(
            lotteryID,
            ethers.parseUnits("10", 18),
            ethers.parseUnits("100", 18),
            winTickets,
            winValuesPerTicket
          )
      ).to.be.revertedWith("Lottery: Lottery pool is too much");
    });

    it("When incorrect amount of ticket", async () => {
      const wrongWinTickets = ["1", "2", "3", "4", "5"];

      await expect(
        lottery
          .connect(lotteryAdmin)
          .calculateLottery(lotteryID, jackpot, lotteryPool, wrongWinTickets, winValuesPerTicket)
      ).to.be.revertedWith("Lottery: Wrong tickets count");
    });
  });

  describe("When all the parameters are correct", () => {
    let result: ContractTransaction;

    before(async () => {
      result = await lottery
        .connect(lotteryAdmin)
        .calculateLottery(lotteryID, jackpot, lotteryPool, winTickets, winValuesPerTicket);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be set lottery results data", async () => {
      const lotteryLoser = await lottery.lotteryResults(lotteryID, WinType.None);
      expect(lotteryLoser[0]).to.eq(winTickets[0]);
      expect(lotteryLoser[1]).to.eq(winValuesPerTicket[0]);

      const lottery3Num = await lottery.lotteryResults(lotteryID, WinType.ThreeNum);
      expect(lottery3Num[0]).to.eq(winTickets[1]);
      expect(lottery3Num[1]).to.eq(winValuesPerTicket[1]);

      const lottery4Num = await lottery.lotteryResults(lotteryID, WinType.FourNum);
      expect(lottery4Num[0]).to.eq(winTickets[2]);
      expect(lottery4Num[1]).to.eq(winValuesPerTicket[2]);

      const lottery5Num = await lottery.lotteryResults(lotteryID, WinType.FiveNum);
      expect(lottery5Num[0]).to.eq(winTickets[3]);
      expect(lottery5Num[1]).to.eq(winValuesPerTicket[3]);

      const lottery6Num = await lottery.lotteryResults(lotteryID, WinType.SixNum);
      expect(lottery6Num[0]).to.eq(winTickets[4]);
      expect(lottery6Num[1]).to.eq(winValuesPerTicket[4]);
    });

    it("Should be set lottery data", async () => {
      const lotteryInfo = await lottery.lotteries(lotteryID);

      expect(lotteryInfo[0]).to.eq(LotteryStatus.Calculated);
      expect(lotteryInfo[1]).to.eq(LotteryType.Weekly);
      expect(lotteryInfo[5]).to.eq(jackpot);
    });

    it("Should emit CalculateLottery event", async () => {
      await expect(result)
        .to.emit(lottery, "CalculateLottery")
        .withArgs(lotteryID, jackpot, lotteryPool, winTickets, winValuesPerTicket);
    });
  });
});
