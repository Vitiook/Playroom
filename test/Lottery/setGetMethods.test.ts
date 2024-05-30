import { expect } from "chai";
import { loadFixture, time, setPrevRandao } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ZERO_ADDRESS } from "../utils/index";
import { ContractTransaction } from "ethers";
import {
  standardPrepareLottery,
  buyTickets,
  LotteryType,
  LotteryStatus,
  generationTickets,
  calculateLottery,
} from "../utils";

describe("Method: setGetMethods", () => {
  describe("Method: getLottery", () => {
    describe("When one of parameters is incorrect", () => {
      it("When incorrect indexes", async () => {
        const { lottery } = await loadFixture(standardPrepareLottery);

        await expect(lottery.getLottery(1, 0)).to.be.revertedWithCustomError(lottery, "WrongIndexes");
      });
    });

    describe("When all the parameters are correct", () => {
      let lottery: Lottery,
        token: Token,
        bob: SignerWithAddress,
        alice: SignerWithAddress,
        result: ContractTransaction,
        numbers: string[],
        lotteryTime: number,
        jackpot: number;

      const lotteryId = 0;
      const registeredTickets = 70;

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
        await lottery.connect(bob).registerTickets(lotteryId, numbersBob);

        await buyTickets(alice, BigInt(100), res.ticketPrice, token, lottery);
        const numbersAlice = generationTickets(69);
        numbersAlice.push("0x230504090c01");
        await lottery.connect(alice).registerTickets(lotteryId, numbersAlice);

        numbers = [...numbersBob, ...numbersAlice];
        await time.increaseTo(lotteryTime);

        await setPrevRandao(1000);
        const salt = "0x5161718192021222324252627282930313201020304050607080910111213141";
        const increaseBlock = "0x" + (1000 - ((await ethers.provider.getBlockNumber()) + 1)).toString(16);

        await ethers.provider.send("hardhat_mine", [increaseBlock]);
        const desiredTimestamp = 1818263380;
        await ethers.provider.send("evm_setNextBlockTimestamp", [desiredTimestamp]);

        await lottery.connect(res.lotteryAdmin).drawnLottery(lotteryId, salt);
        jackpot = await lottery.totalJackpot();
        await calculateLottery(lottery, res.lotteryAdmin, [numbersBob, numbersAlice]);

        result = await lottery.getLottery(0, 1);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set lottery data", () => {
        expect(result[0][0][0]).to.eq(LotteryStatus.Calculated);
        expect(result[0][0][1]).to.eq(LotteryType.Weekly);
        expect(result[0][0][2]).to.eq(lotteryTime);
        expect(result[0][0][3]).to.eq("0x230504090c06");
        expect(result[0][0][4]).to.eq(numbers.length);
        expect(result[0][0][5]).to.eq(jackpot);
        /// lottery not init
        expect(result[1][0][0]).to.eq(LotteryStatus.NotExist);
        expect(result[1][0][1]).to.eq(LotteryType.Weekly);
        expect(result[1][0][2]).to.eq(0);
        expect(result[1][0][3]).to.eq("0x000000000000");
        expect(result[1][0][4]).to.eq(0);
        expect(result[1][0][5]).to.eq(0);
      });
    });
  });

  describe("Method: getTicket", () => {
    describe("When one of parameters is incorrect", () => {
      it("When incorrect indexes", async () => {
        const { lottery } = await loadFixture(standardPrepareLottery);

        await expect(lottery.getTicket(0, 1, 0)).to.be.revertedWithCustomError(lottery, "WrongIndexes");
      });
    });
  });

  describe("Method: setTicketPrice", () => {
    describe("When one of parameters is incorrect", () => {
      it("When the caller is not a lottery admin", async () => {
        const { lottery, alice, ticketPrice, LOTTERY_ADMIN_ROLE } = await loadFixture(standardPrepareLottery);

        await expect(lottery.connect(alice).setTicketPrice(ticketPrice))
          .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
          .withArgs(`${alice.address}`, `${LOTTERY_ADMIN_ROLE}`);
      });

      it("When the ticket price is wrong", async () => {
        const { lottery, lotteryAdmin } = await loadFixture(standardPrepareLottery);

        await expect(lottery.connect(lotteryAdmin).setTicketPrice(0)).to.be.revertedWith("Lottery: Wrong ticket price");
      });
    });

    describe("When all the parameters are correct", () => {
      let lottery: Lottery, lotteryAdmin: SignerWithAddress, result: ContractTransaction;

      const newTicketPrice = ethers.parseUnits("10", 18);

      before(async () => {
        const res = await loadFixture(standardPrepareLottery);
        lottery = res.lottery;
        lotteryAdmin = res.lotteryAdmin;

        result = await lottery.connect(lotteryAdmin).setTicketPrice(newTicketPrice);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set new ticket price", async () => {
        expect(await lottery.ticketPrice()).to.eq(newTicketPrice);
      });

      it("Should emit SetFee event", async () => {
        await expect(result).to.emit(lottery, "SetFee").withArgs(lotteryAdmin, newTicketPrice);
      });
    });
  });

  describe("Method: setFee", () => {
    describe("When one of parameters is incorrect", () => {
      it("When the caller is not a lottery admin", async () => {
        const { lottery, alice, LOTTERY_ADMIN_ROLE } = await loadFixture(standardPrepareLottery);

        await expect(lottery.connect(alice).setFee(1500))
          .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
          .withArgs(`${alice.address}`, `${LOTTERY_ADMIN_ROLE}`);
      });

      it("When the fee is wrong", async () => {
        const { lottery, lotteryAdmin } = await loadFixture(standardPrepareLottery);

        await expect(lottery.connect(lotteryAdmin).setFee(5000)).to.be.revertedWith("Lottery: Wrong fee value");
      });
    });

    describe("When all the parameters are correct", () => {
      let lottery: Lottery, lotteryAdmin: SignerWithAddress, result: ContractTransaction;

      const newFee = 1500;

      before(async () => {
        const res = await loadFixture(standardPrepareLottery);
        lottery = res.lottery;
        lotteryAdmin = res.lotteryAdmin;

        result = await lottery.connect(lotteryAdmin).setFee(newFee);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set new fee", async () => {
        expect(await lottery.lotteryFee()).to.eq(newFee);
      });

      it("Should emit SetFee event", async () => {
        await expect(result).to.emit(lottery, "SetFee").withArgs(lotteryAdmin, newFee);
      });
    });
  });

  describe("Method: setDataFeeds", () => {
    describe("When one of parameters is incorrect", () => {
      it("When the caller is not a lottery admin", async () => {
        const { lottery, alice, LOTTERY_ADMIN_ROLE, dataFeeds } = await loadFixture(standardPrepareLottery);

        await expect(lottery.connect(alice).setDataFeeds(dataFeeds.target))
          .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
          .withArgs(`${alice.address}`, `${LOTTERY_ADMIN_ROLE}`);
      });

      it("When the fee is wrong", async () => {
        const { lottery, lotteryAdmin } = await loadFixture(standardPrepareLottery);

        await expect(lottery.connect(lotteryAdmin).setDataFeeds(ZERO_ADDRESS)).to.be.revertedWith(
          "Lottery: Wrong datafeeds address"
        );
      });
    });

    describe("When all the parameters are correct", () => {
      let lottery: Lottery, lotteryAdmin: SignerWithAddress, result: ContractTransaction;

      before(async () => {
        const res = await loadFixture(standardPrepareLottery);
        lottery = res.lottery;
        lotteryAdmin = res.lotteryAdmin;

        result = await lottery.connect(lotteryAdmin).setDataFeeds(lottery.target);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should emit SetDataFeeds event", async () => {
        await expect(result).to.emit(lottery, "SetDataFeeds").withArgs(lotteryAdmin, lottery.target);
      });
    });
  });
});
