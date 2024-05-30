import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { standardPrepareBingo } from "../utils";
import crypto from "crypto";

describe("Methods", () => {
  let salt: string, maxValue: number;

  describe("Method: getRandomLotto_6_49", () => {
    it("Should get lottery numbers", async function () {
      const { dataFeeds } = await loadFixture(standardPrepareBingo);

      salt = crypto.randomBytes(32);

      const bytes = await dataFeeds.getRandomLotto_6_49(salt);
      expect(bytes.length).to.equal(14);
      const nums: number[] = await dataFeeds.getNumbersFromBytes(bytes);
      expect(nums.length).to.equal(6);
      expect(new Set(nums).size).to.equal(6);
      for (let i = 0; i < 6; i++) {
        expect(nums[i] > 0 && nums[i] <= 49).to.true;
      }
    });
  });

  describe("Method: getRandomBingoNumbers", () => {
    describe("When one of parameters is incorrect", () => {
      it("When the value of a maxNumber is too much", async () => {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);
        salt = crypto.randomBytes(32);

        await expect(dataFeeds.getRandomBingoNumbers(salt, 100)).to.be.revertedWithCustomError(
          dataFeeds,
          "WrongMaxNumber"
        );
      });

      it("When the value of a maxNumber is Zero", async () => {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);
        salt = crypto.randomBytes(32);

        await expect(dataFeeds.getRandomBingoNumbers(salt, 0)).to.be.revertedWithCustomError(
          dataFeeds,
          "WrongMaxNumber"
        );
      });
    });

    describe("When all the parameters are correct", () => {
      it("Should be get bingo numbers when the maxValue is an average value", async function () {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);
        salt = crypto.randomBytes(32);
        maxValue = 50;

        const nums = await dataFeeds.getRandomBingoNumbers(salt, maxValue);
        const decodedValues = [];
        for (let i = 2; i < nums.length; i += 2) {
          decodedValues.push(parseInt(nums.slice(i, i + 2), 16));
        }

        const decodedWithContract = await dataFeeds.getNumbersFromBytes(nums);

        expect(decodedValues.length).to.equal(maxValue);
        expect(new Set(decodedValues).size).to.equal(maxValue);

        for (let i = 0; i < maxValue; i++) {
          expect(decodedWithContract[i]).to.eq(decodedValues[i]);
          expect(decodedValues[i] > 0 && decodedValues[i] <= maxValue).to.true;
        }
      });

      it("Should be get bingo numbers when the maxValue is an max value", async function () {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);
        salt = crypto.randomBytes(32);
        maxValue = 96;

        const nums = await dataFeeds.getRandomBingoNumbers(salt, maxValue);
        const decodedValues = [];
        for (let i = 2; i < nums.length; i += 2) {
          decodedValues.push(parseInt(nums.slice(i, i + 2), 16));
        }

        const decodedWithContract = await dataFeeds.getNumbersFromBytes(nums);

        expect(decodedValues.length).to.equal(maxValue);
        expect(new Set(decodedValues).size).to.equal(maxValue);

        for (let i = 0; i < maxValue; i++) {
          expect(decodedWithContract[i]).to.eq(decodedValues[i]);
          expect(decodedValues[i] > 0 && decodedValues[i] <= maxValue).to.true;
        }
      });

      it("Should be get bingo numbers when the maxValue is an min value", async function () {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);
        salt = crypto.randomBytes(32);
        maxValue = 3;

        const nums = await dataFeeds.getRandomBingoNumbers(salt, maxValue);
        const decodedValues = [];
        for (let i = 2; i < nums.length; i += 2) {
          decodedValues.push(parseInt(nums.slice(i, i + 2), 16));
        }

        const decodedWithContract = await dataFeeds.getNumbersFromBytes(nums);

        expect(decodedValues.length).to.equal(maxValue);
        expect(new Set(decodedValues).size).to.equal(maxValue);

        for (let i = 0; i < maxValue; i++) {
          expect(decodedWithContract[i]).to.eq(decodedValues[i]);
          expect(decodedValues[i] > 0 && decodedValues[i] <= maxValue).to.true;
        }
      });

      it("Should be get bingo numbers when the maxValue is an min value", async function () {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);
        salt = crypto.randomBytes(32);
        maxValue = 1;

        const nums = await dataFeeds.getRandomBingoNumbers(salt, maxValue);
        const decodedValues = [];
        for (let i = 2; i < nums.length; i += 2) {
          decodedValues.push(parseInt(nums.slice(i, i + 2), 16));
        }

        const decodedWithContract = await dataFeeds.getNumbersFromBytes(nums);

        expect(decodedValues.length).to.equal(maxValue);
        expect(new Set(decodedValues).size).to.equal(maxValue);

        for (let i = 0; i < maxValue; i++) {
          expect(decodedWithContract[i]).to.eq(decodedValues[i]);
          expect(decodedValues[i] > 0 && decodedValues[i] <= maxValue).to.true;
        }
      });
    });
  });

  describe("Method: getOrderedArray", () => {
    describe("When one of parameters is incorrect", () => {
      it("When incorrect borders (from > to)", async () => {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);

        await expect(dataFeeds.getOrderedArray(100, 10)).to.be.revertedWith("DataFeeds: Wrong borders");
      });
    });

    describe("When all the parameters are correct", () => {
      it("Should get array of ordered numbers", async function () {
        const { dataFeeds } = await loadFixture(standardPrepareBingo);

        const array0_93 = Array.from(Array(94), (e, i) => i);
        const array7_190 = Array.from(Array(184), (e, i) => i + 7);
        const array255_255 = [255];

        expect(await dataFeeds.getOrderedArray(0, 93)).to.deep.equal(array0_93);
        expect(await dataFeeds.getOrderedArray(7, 190)).to.deep.equal(array7_190);
        expect(await dataFeeds.getOrderedArray(255, 255)).to.deep.equal(array255_255);

        await expect(dataFeeds.getOrderedArray(1, 0)).to.revertedWith("DataFeeds: Wrong borders");
      });
    });
  });
});
