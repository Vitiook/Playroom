import { expect } from "chai";
import { loadFixture, time, setPrevRandao } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareLottery, buyTickets, LotteryType, LotteryStatus, generationTickets, WinType } from "../utils";
import crypto from "crypto";

describe("Method: drawnLottery", () => {
  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a lottery admin", async () => {
      const { lottery, bob, token, owner, lotteryAdmin, ticketPrice, LOTTERY_ADMIN_ROLE } = await loadFixture(
        standardPrepareLottery
      );

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);
      const numbersBob = generationTickets(100);

      await lottery.connect(bob).registerTickets(0, numbersBob);
      await time.increaseTo(lotteryTime);
      const salt = crypto.randomBytes(32);

      await expect(lottery.connect(owner).drawnLottery(0, salt))
        .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
        .withArgs(`${owner.address}`, `${LOTTERY_ADMIN_ROLE}`);
    });

    it("When the lottery time is not over", async () => {
      const { lottery, bob, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);
      const numbersBob = generationTickets(100);

      await lottery.connect(bob).registerTickets(0, numbersBob);
      const salt = crypto.randomBytes(32);

      await expect(lottery.connect(lotteryAdmin).drawnLottery(0, salt)).to.be.revertedWith(
        "Lottery: Lottery is not over"
      );
    });

    it("When the lottery is not init", async () => {
      const { lottery, lotteryAdmin } = await loadFixture(standardPrepareLottery);
      const salt = crypto.randomBytes(32);

      await expect(lottery.connect(lotteryAdmin).drawnLottery(0, salt)).to.be.revertedWith("Lottery: Lottery not init");
    });
  });

  describe("When all the parameters are correct", () => {
    let lottery: Lottery,
      token: Token,
      bob: SignerWithAddress,
      alice: SignerWithAddress,
      result: ContractTransaction,
      lotteryTime: number;

    const lotteryId = 0;
    const registeredTickets = 70;
    const ticketNumber = "0x230504090c01";

    before(async () => {
      const res = await loadFixture(standardPrepareLottery);
      lottery = res.lottery;
      token = res.token;
      bob = res.bob;
      alice = res.alice;
      lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(res.lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);

      await buyTickets(bob, BigInt(100), res.ticketPrice, token, lottery);
      const numbersBob = generationTickets(registeredTickets);
      await lottery.connect(bob).registerTickets(0, numbersBob);

      await buyTickets(res.alice, BigInt(100), res.ticketPrice, token, lottery);
      const numbersAlice = generationTickets(69);
      numbersAlice.push(ticketNumber);
      await lottery.connect(res.alice).registerTickets(0, numbersAlice);
      await time.increaseTo(lotteryTime);
      await setPrevRandao(1000);
      const salt = "0x5161718192021222324252627282930313201020304050607080910111213141";
      const increaseBlock = "0x" + (1000 - ((await ethers.provider.getBlockNumber()) + 1)).toString(16);
      await ethers.provider.send("hardhat_mine", [increaseBlock]);
      const desiredTimestamp = 1818263380;
      await ethers.provider.send("evm_setNextBlockTimestamp", [desiredTimestamp]);

      result = await lottery.connect(res.lotteryAdmin).drawnLottery(lotteryId, salt);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be set ticket data", async () => {
      const ticketData = await lottery.getTicket(lotteryId, 139, 139);

      expect(ticketData[0][0][0]).to.eq(true);
      expect(ticketData[0][0][1]).to.eq(false);
      expect(ticketData[0][0][2]).to.eq(ticketNumber);
      expect(ticketData[0][0][3]).to.eq(alice.address);
      expect(ticketData[0][1]).to.eq(WinType.FiveNum);
      expect(ticketData[0][2]).to.eq(0);
    });

    it("Should be set lottery data", async () => {
      const lotteryData = await lottery.lotteries(lotteryId);

      expect(lotteryData[0]).to.eq(LotteryStatus.Drawn);
      expect(lotteryData[1]).to.eq(LotteryType.Weekly);
      expect(lotteryData[2]).to.eq(lotteryTime);
      expect(lotteryData[3]).to.eq("0x230504090c06");
      expect(lotteryData[4]).to.eq(BigInt(registeredTickets) + BigInt(registeredTickets));
    });

    it("Should emit DrawnLottery event", async () => {
      await expect(result).to.emit(lottery, "DrawnLottery");
    });
  });
});
