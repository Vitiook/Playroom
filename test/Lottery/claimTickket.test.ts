import { expect } from "chai";
import { loadFixture, time, setPrevRandao } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import {
  standardPrepareLottery,
  buyTickets,
  LotteryType,
  generationTickets,
  calculateLottery,
  WinType,
} from "../utils";

describe("Method: claimTickket", () => {
  describe("When one of parameters is incorrect", () => {
    let lottery: Lottery,
      token: Token,
      bob: SignerWithAddress,
      alice: SignerWithAddress,
      lotteryAdmin: SignerWithAddress,
      lotteryTime: number,
      numbersBob,
      numbersAlice;

    const lotteryId = 0;
    const registeredTickets = 70;
    const salt = "0x5161718192021222324252627282930313201020304050607080910111213141";

    before(async () => {
      const res = await loadFixture(standardPrepareLottery);
      lottery = res.lottery;
      token = res.token;
      bob = res.bob;
      alice = res.alice;
      lotteryAdmin = res.lotteryAdmin;
      lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(res.lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);

      await buyTickets(bob, BigInt(100), res.ticketPrice, token, lottery);
      numbersBob = generationTickets(registeredTickets);
      await lottery.connect(bob).registerTickets(0, numbersBob);

      await buyTickets(alice, BigInt(100), res.ticketPrice, token, lottery);
      numbersAlice = generationTickets(68);
      numbersAlice.push("0x010203070809");
      numbersAlice.push("0x230504090c01");
      await lottery.connect(alice).registerTickets(0, numbersAlice);

      await time.increaseTo(lotteryTime);

      await setPrevRandao(1000);
      const increaseBlock = "0x" + (1000 - ((await ethers.provider.getBlockNumber()) + 1)).toString(16);

      await ethers.provider.send("hardhat_mine", [increaseBlock]);
      const desiredTimestamp = 1818263380;
      await ethers.provider.send("evm_setNextBlockTimestamp", [desiredTimestamp]);

      await lottery.connect(res.lotteryAdmin).drawnLottery(lotteryId, salt);
    });

    it("When the lottery not calculated", async () => {
      await expect(lottery.connect(alice).claimTickket(0, [139])).to.be.revertedWith("Lottery: Lottery not calculated");
    });

    it("When the ticket id is empty", async () => {
      await calculateLottery(lottery, lotteryAdmin, [numbersBob, numbersAlice]);

      await expect(lottery.connect(alice).claimTickket(0, [])).to.be.revertedWithCustomError(
        lottery,
        "TicketZeroCount"
      );
    });

    it("When incorrect ticket id", async () => {
      await expect(lottery.connect(alice).claimTickket(0, [150])).to.be.revertedWith("Lottery: Ticket not active");
    });

    it("When the user is not the owner of the ticket", async () => {
      await expect(lottery.connect(bob).claimTickket(0, [139])).to.be.revertedWith("Lottery: Wrong ticket owner");
    });

    it("When the ticket is not winning", async () => {
      await expect(lottery.connect(alice).claimTickket(0, [138])).to.be.revertedWith("Lottery: Ticket is not winning");
    });

    it("When the winnings are paid out", async () => {
      await lottery.connect(alice).claimTickket(0, [139]);

      await expect(lottery.connect(alice).claimTickket(0, [139])).to.be.revertedWith("Lottery: Ticket is already paid");
    });
  });

  describe("When all the parameters are correct", () => {
    let lottery: Bingo,
      token: Token,
      bob: SignerWithAddress,
      alice: SignerWithAddress,
      result: ContractTransaction,
      lotteryTime: number,
      winValuesPerTicket;

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
      await lottery.connect(bob).registerTickets(0, numbersBob);

      await buyTickets(alice, BigInt(100), res.ticketPrice, token, lottery);
      const numbersAlice = generationTickets(66);
      numbersAlice.push("0x230504010203");
      numbersAlice.push("0x230504090102");
      numbersAlice.push("0x230504090c06");
      numbersAlice.push("0x230504090c01");
      await lottery.connect(alice).registerTickets(0, numbersAlice);

      await time.increaseTo(lotteryTime);

      await setPrevRandao(1000);
      const salt = "0x5161718192021222324252627282930313201020304050607080910111213141";
      const increaseBlock = "0x" + (1000 - ((await ethers.provider.getBlockNumber()) + 1)).toString(16);

      await ethers.provider.send("hardhat_mine", [increaseBlock]);
      const desiredTimestamp = 1818263380;
      await ethers.provider.send("evm_setNextBlockTimestamp", [desiredTimestamp]);

      await lottery.connect(res.lotteryAdmin).drawnLottery(lotteryId, salt);

      const response = await calculateLottery(lottery, res.lotteryAdmin, [numbersBob, numbersAlice]);
      winValuesPerTicket = response.winValuesPerTicket;
    });

    describe("when the five numbers match", () => {
      before(async () => {
        result = await lottery.connect(alice).claimTickket(0, [139]);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set ticket data", async () => {
        const ticketData = await lottery.getTicket(lotteryId, 139, 139);

        expect(ticketData[0][0][0]).to.eq(true);
        expect(ticketData[0][0][1]).to.eq(true);
        expect(ticketData[0][0][2]).to.eq("0x230504090c01");
        expect(ticketData[0][0][3]).to.eq(alice.address);
        expect(ticketData[0][1]).to.eq(WinType.FiveNum);
        expect(ticketData[0][2]).to.eq(winValuesPerTicket[3]);
      });

      it("Should be changed token balance after claiming", async () => {
        await expect(() => result).to.changeTokenBalances(
          token,
          [alice, lottery.target],
          [winValuesPerTicket[3], -winValuesPerTicket[3]]
        );
      });

      it("Should emit ClaimTicket event", async () => {
        await expect(result).to.emit(lottery, "ClaimTicket").withArgs(0, 139, winValuesPerTicket[3]);
      });
    });

    describe("when the six numbers match", () => {
      before(async () => {
        result = await lottery.connect(alice).claimTickket(0, [138]);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set ticket data", async () => {
        const ticketData = await lottery.getTicket(lotteryId, 138, 138);

        expect(ticketData[0][0][0]).to.eq(true);
        expect(ticketData[0][0][1]).to.eq(true);
        expect(ticketData[0][0][2]).to.eq("0x230504090c06");
        expect(ticketData[0][0][3]).to.eq(alice.address);
        expect(ticketData[0][1]).to.eq(WinType.SixNum);
        expect(ticketData[0][2]).to.eq(winValuesPerTicket[4]);
      });

      it("Should be changed token balance after claiming", async () => {
        await expect(() => result).to.changeTokenBalances(
          token,
          [alice, lottery.target],
          [winValuesPerTicket[4], -winValuesPerTicket[4]]
        );
      });

      it("Should emit ClaimTicket event", async () => {
        await expect(result).to.emit(lottery, "ClaimTicket").withArgs(0, 138, winValuesPerTicket[4]);
      });
    });

    describe("when the four numbers match", () => {
      before(async () => {
        result = await lottery.connect(alice).claimTickket(0, [137]);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set ticket data", async () => {
        const ticketData = await lottery.getTicket(lotteryId, 137, 137);

        expect(ticketData[0][0][0]).to.eq(true);
        expect(ticketData[0][0][1]).to.eq(true);
        expect(ticketData[0][0][2]).to.eq("0x230504090102");
        expect(ticketData[0][0][3]).to.eq(alice.address);
        expect(ticketData[0][1]).to.eq(WinType.FourNum);
        expect(ticketData[0][2]).to.eq(winValuesPerTicket[2]);
      });

      it("Should be changed token balance after claiming", async () => {
        await expect(() => result).to.changeTokenBalances(
          token,
          [alice, lottery.target],
          [winValuesPerTicket[2], -winValuesPerTicket[2]]
        );
      });

      it("Should emit ClaimTicket event", async () => {
        await expect(result).to.emit(lottery, "ClaimTicket").withArgs(0, 137, winValuesPerTicket[2]);
      });
    });

    describe("when the three numbers match", () => {
      before(async () => {
        result = await lottery.connect(alice).claimTickket(0, [136]);
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set ticket data", async () => {
        const ticketData = await lottery.getTicket(lotteryId, 136, 136);

        expect(ticketData[0][0][0]).to.eq(true);
        expect(ticketData[0][0][1]).to.eq(true);
        expect(ticketData[0][0][2]).to.eq("0x230504010203");
        expect(ticketData[0][0][3]).to.eq(alice.address);
        expect(ticketData[0][1]).to.eq(WinType.ThreeNum);
        expect(ticketData[0][2]).to.eq(winValuesPerTicket[1]);
      });

      it("Should be changed token balance after claiming", async () => {
        await expect(() => result).to.changeTokenBalances(
          token,
          [alice, lottery.target],
          [winValuesPerTicket[1], -winValuesPerTicket[1]]
        );
      });

      it("Should emit ClaimTicket event", async () => {
        await expect(result).to.emit(lottery, "ClaimTicket").withArgs(0, 136, winValuesPerTicket[1]);
      });
    });
  });
});
