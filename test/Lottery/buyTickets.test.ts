import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareLottery } from "../utils";

describe("Method: buyTickets", () => {
  describe("When one of parameters is incorrect", () => {
    it("When incorrect ticketsCount", async () => {
      const { lottery, bob } = await loadFixture(standardPrepareLottery);

      await expect(lottery.connect(bob).buyTickets(0)).to.be.revertedWithCustomError(lottery, "TicketZeroCount");
    });
  });

  describe("When all the parameters are correct", () => {
    let lottery: Lottery, token: Token, bob: SignerWithAddress, result: ContractTransaction;

    const amountOfTicket = BigInt(100);
    const ticketPrice = ethers.parseUnits("1", 18);
    const totalPrice = ticketPrice * amountOfTicket;

    before(async () => {
      const res = await loadFixture(standardPrepareLottery);
      lottery = res.lottery;
      token = res.token;
      bob = res.bob;

      await token.connect(bob).approve(lottery.target, totalPrice);
      result = await lottery.connect(bob).buyTickets(amountOfTicket);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be set amount of tickets for bob", async () => {
      expect(await lottery.tickets(bob)).to.eq(amountOfTicket);
    });

    it("Should be increase the jackpot", async () => {
      expect(await lottery.totalJackpot()).to.eq(totalPrice - (totalPrice * BigInt(1000)) / BigInt(10000));
    });

    it("Should be changed token balance after buying", async () => {
      await expect(() => result).to.changeTokenBalances(token, [bob, lottery.target], [-totalPrice, totalPrice]);
    });

    it("Should emit BuyTickets event", async () => {
      await expect(result).to.emit(lottery, "BuyTickets").withArgs(bob, amountOfTicket);
    });
  });
});
