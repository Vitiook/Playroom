import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery, Token } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareLottery, buyTickets, LotteryType } from "../utils";

describe("Method: withdrawFee", () => {
  describe("When one of parameters is incorrect", () => {
    it("When no fee", async () => {
      const { lottery, bob, alice, token, lotteryAdmin, ticketPrice } = await loadFixture(standardPrepareLottery);

      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);
      await lottery.connect(lotteryAdmin).withdrawFee(alice.address);

      await expect(lottery.connect(lotteryAdmin).withdrawFee(alice.address)).to.be.revertedWith("Lottery: No fee");
    });

    it("When the caller is not a lottery admin", async () => {
      const { lottery, bob, alice, token, ticketPrice, LOTTERY_ADMIN_ROLE } = await loadFixture(standardPrepareLottery);
      await buyTickets(bob, BigInt(100), ticketPrice, token, lottery);

      await expect(lottery.connect(alice).withdrawFee(alice.address))
        .to.be.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount")
        .withArgs(`${alice.address}`, `${LOTTERY_ADMIN_ROLE}`);
    });
  });

  describe("When all the parameters are correct", () => {
    let lottery: Lottery,
      token: Token,
      bob: SignerWithAddress,
      alice: SignerWithAddress,
      result: ContractTransaction,
      fee: number,
      lotteryTime: number;

    before(async () => {
      const res = await loadFixture(standardPrepareLottery);
      lottery = res.lottery;
      token = res.token;
      bob = res.bob;
      alice = res.alice;

      lotteryTime = (await time.latest()) + 3600;
      await lottery.connect(res.lotteryAdmin).initLottery(LotteryType.Weekly, lotteryTime);
      await buyTickets(bob, BigInt(100), res.ticketPrice, token, lottery);
      fee = (await token.balanceOf(lottery.target)) - (await lottery.totalJackpot());

      result = await lottery.connect(res.lotteryAdmin).withdrawFee(alice.address);
    });

    it("Should not reverted", async () => {
      await expect(result).to.be.not.reverted;
    });

    it("Should be changed token balance after withdrawing", async () => {
      await expect(() => result).to.changeTokenBalances(token, [alice, lottery.target], [fee, -fee]);
    });

    it("Should emit WithdrawFee event", async () => {
      await expect(result).to.emit(lottery, "WithdrawFee").withArgs(alice.address, fee);
    });
  });
});
