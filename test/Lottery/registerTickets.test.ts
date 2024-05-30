import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareLottery, buyTickets, LotteryType, LotteryStatus, generationTickets } from "../utils";

describe("Method: registerTickets", () => {
  describe("When one of parameters is incorrect", () => {
    it("When the lottery is not init", async () => {
      const { lottery, bob, token, ticketPrice } = await loadFixture(standardPrepareLottery);

      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);
      const numbersBob = generationTickets(100);

      await expect(lottery.connect(bob).registerTickets(0, numbersBob)).to.be.revertedWith("Lottery: Lottery not init");
    });

    it("When the lottery time is over", async () => {
      const { lottery, bob, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await time.increaseTo(lotteryTime);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);
      const numbersBob = generationTickets(100);

      await expect(lottery.connect(bob).registerTickets(0, numbersBob)).to.be.revertedWith(
        "Lottery: Lottery time is over"
      );
    });

    it("When the ticket numbers are empty", async () => {
      const { lottery, bob, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);

      await expect(lottery.connect(bob).registerTickets(0, [])).to.be.revertedWithCustomError(
        lottery,
        "TicketZeroCount"
      );
    });

    it("When the ticket numbers are outside the acceptable range", async () => {
      const { lottery, bob, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);

      await expect(lottery.connect(bob).registerTickets(0, ["0x320102030405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x013202030405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010232030405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010203320405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010203043205"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010203040532"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );

      await expect(lottery.connect(bob).registerTickets(0, ["0x000102030405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010002030405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010200030405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010203000405"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010203040005"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010203040500"])).to.be.revertedWithCustomError(
        lottery,
        "TicketWrongNumber"
      );
    });

    it("When the ticket numbers are the same", async () => {
      const { lottery, bob, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);

      await expect(lottery.connect(bob).registerTickets(0, ["0x010103040506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010301040506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304010506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050106"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050601"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010303040506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304030506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050306"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050603"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304040506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050406"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050604"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050506"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304050605"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
      await expect(lottery.connect(bob).registerTickets(0, ["0x010304060505"])).to.be.revertedWithCustomError(
        lottery,
        "TicketSameNumbers"
      );
    });
    it("when the tickets for registration more then tickets purchased", async () => {
      const { lottery, bob, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      const lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(10), ticketPrice, token, lottery);
      const numbersBob = generationTickets(100);

      await expect(lottery.connect(bob).registerTickets(0, numbersBob)).to.be.revertedWith(
        "Lottery: Not enough tickets"
      );
    });
  });

  describe("When all the parameters are correct", () => {
    let lottery: Lottery,
      token: Token,
      bob: SignerWithAddress,
      result: ContractTransaction,
      numbersBob: string[],
      lotteryTime: number;

    const amountOfTicket = BigInt(100);
    const lotteryId = 0;
    const registeredTickets = 70;

    before(async () => {
      const res = await loadFixture(standardPrepareLottery);
      lottery = res.lottery;
      token = res.token;
      bob = res.bob;

      lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(res.lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), res.ticketPrice, token, lottery);
      numbersBob = generationTickets(registeredTickets);

      result = await lottery.connect(bob).registerTickets(lotteryId, numbersBob);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be set data for tickets", async () => {
      for (let i = 0; i < numbersBob.length; i++) {
        const ticketData = await lottery.activeTickets(lotteryId, i);

        expect(ticketData[0]).to.eq(true);
        expect(ticketData[1]).to.eq(false);
        expect(ticketData[2]).to.eq(numbersBob[i]);
        expect(ticketData[3]).to.eq(bob.address);
      }
    });

    it("Should be set lottery data", async () => {
      const lotteryData = await lottery.lotteries(lotteryId);

      expect(lotteryData[0]).to.eq(LotteryStatus.Init);
      expect(lotteryData[1]).to.eq(LotteryType.Weekly);
      expect(lotteryData[2]).to.eq(lotteryTime);
      expect(lotteryData[3]).to.eq("0x000000000000");
      expect(lotteryData[4]).to.eq(BigInt(registeredTickets));
    });

    it("Should be changed token balance after buying", async () => {
      expect(await lottery.tickets(bob.address)).to.eq(amountOfTicket - BigInt(registeredTickets));
    });

    it("Should emit RegisterTicket event", async () => {
      for (let i = 0; i < numbersBob.length; i++) {
        await expect(result).to.emit(lottery, "RegisterTicket").withArgs(lotteryId, i, bob.address, numbersBob[i]);
      }
    });
  });
});
