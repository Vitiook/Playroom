import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Bingo, DataFeeds } from "../../types/typechain-types";
import { ContractTransaction } from "ethers";
import { standardPrepareBingo } from "../utils";
import crypto from "crypto";

describe("Method: addTable", () => {
  let salt: string;

  describe("When one of parameters is incorrect", () => {
    it("When the caller is not a bingo admin", async () => {
      const { bingo, user, BINGO_ADMIN_ROLE } = await loadFixture(standardPrepareBingo);
      salt = crypto.randomBytes(32);

      await expect(bingo.connect(user).addTable(salt, 50))
        .to.be.revertedWithCustomError(bingo, "AccessControlUnauthorizedAccount")
        .withArgs(`${user.address}`, `${BINGO_ADMIN_ROLE}`);
    });

    it("When the value of a maxNumber is too much", async () => {
      const { bingo, bingoAdmin, dataFeeds } = await loadFixture(standardPrepareBingo);
      salt = crypto.randomBytes(32);

      await expect(bingo.connect(bingoAdmin).addTable(salt, 100)).to.be.revertedWithCustomError(
        dataFeeds,
        "WrongMaxNumber"
      );
    });

    it("When the value of a maxNumber is Zero", async () => {
      const { bingo, bingoAdmin, dataFeeds } = await loadFixture(standardPrepareBingo);
      salt = crypto.randomBytes(32);

      await expect(bingo.connect(bingoAdmin).addTable(salt, 0)).to.be.revertedWithCustomError(
        dataFeeds,
        "WrongMaxNumber"
      );
    });
  });

  describe("When all the parameters are correct", () => {
    let bingo: Bingo,
      dataFeeds: DataFeeds,
      bingoAdmin: SignerWithAddress,
      result: ContractTransaction,
      hexString: string,
      maxNumber: number;

    before(async () => {
      const res = await loadFixture(standardPrepareBingo);
      bingo = res.bingo;
      dataFeeds = res.dataFeeds;
      bingoAdmin = res.bingoAdmin;

      salt = crypto.randomBytes(32);
    });

    describe("When the maxNumber value is equal to the average value", () => {
      before(async () => {
        maxNumber = 48;

        result = await bingo.connect(bingoAdmin).addTable(salt, maxNumber);
        hexString = await bingo.tables(0);

        const decodedValues = [];
        for (let i = 2; i < hexString.length; i += 2) {
          decodedValues.push(parseInt(hexString.slice(i, i + 2), 16));
        }
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set bingo numbers", async () => {
        const bingoNums: number[] = await dataFeeds.getNumbersFromBytes(await bingo.tables(0));

        expect(bingoNums.length).to.equal(maxNumber);
        expect(new Set(bingoNums).size).to.equal(maxNumber);
      });

      it("Should be increase counter", async () => {
        expect(await bingo.tableCount()).to.equal(1);
      });

      it("Should emit AddTable event", async () => {
        await expect(result).to.emit(bingo, "AddTable").withArgs(bingoAdmin, 0, hexString);
      });
    });

    describe("When the maxNumber value is equal to the max value", () => {
      before(async () => {
        maxNumber = 96;

        result = await bingo.connect(bingoAdmin).addTable(salt, maxNumber);
        hexString = await bingo.tables(1);

        const decodedValues = [];
        for (let i = 2; i < hexString.length; i += 2) {
          decodedValues.push(parseInt(hexString.slice(i, i + 2), 16));
        }
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set bingo numbers", async () => {
        const bingoNums: number[] = await dataFeeds.getNumbersFromBytes(await bingo.tables(1));

        expect(bingoNums.length).to.equal(maxNumber);
        expect(new Set(bingoNums).size).to.equal(maxNumber);
      });

      it("Should be increase counter", async () => {
        expect(await bingo.tableCount()).to.equal(2);
      });

      it("Should emit AddTable event", async () => {
        await expect(result).to.emit(bingo, "AddTable").withArgs(bingoAdmin, 1, hexString);
      });
    });

    describe("When the maxNumber value is equal to the min value", () => {
      before(async () => {
        maxNumber = 3;

        result = await bingo.connect(bingoAdmin).addTable(salt, maxNumber);
        hexString = await bingo.tables(2);

        const decodedValues = [];
        for (let i = 2; i < hexString.length; i += 2) {
          decodedValues.push(parseInt(hexString.slice(i, i + 2), 16));
        }
      });

      it("Should not reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("Should be set bingo numbers", async () => {
        const bingoNums: number[] = await dataFeeds.getNumbersFromBytes(await bingo.tables(2));

        expect(bingoNums.length).to.equal(maxNumber);
        expect(new Set(bingoNums).size).to.equal(maxNumber);
      });

      it("Should be increase counter", async () => {
        expect(await bingo.tableCount()).to.equal(3);
      });

      it("Should emit AddTable event", async () => {
        await expect(result).to.emit(bingo, "AddTable").withArgs(bingoAdmin, 2, hexString);
      });
    });
  });
});
