const {
  time,
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const crypto = require("crypto");

describe("DataFeeds", function () {
  async function deployDataFeedsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const DataFeeds = await ethers.getContractFactory("DataFeeds");
    const dataFeeds = await DataFeeds.deploy();

    return { dataFeeds, owner, otherAccount };
  }

  describe("Bingo", function () {
    it("Should get bingo numbers", async function () {
      const { dataFeeds } = await loadFixture(deployDataFeedsFixture);

      const salt = crypto.randomBytes(32);

      const max1 = 96;
      const max2 = 51;
      const max3 = 5;

      const bytes1 = await dataFeeds.getRandomBingoNumbers(salt, max1);
      expect(bytes1.length).to.equal(max1 * 2 + 2);
      const nums1 = await dataFeeds.getNumbersFromBytes(bytes1);
      expect(nums1.length).to.equal(max1);
      expect(new Set(nums1).size).to.equal(max1);
      for (let i = 0; i < max1; i++) {
        expect(nums1[i] > 0 && nums1[i] <= max1).to.true;
      }

      const bytes2 = await dataFeeds.getRandomBingoNumbers(salt, max2);
      expect(bytes2.length).to.equal(max2 * 2 + 2);
      const nums2 = await dataFeeds.getNumbersFromBytes(bytes2);
      expect(nums2.length).to.equal(max2);
      expect(new Set(nums2).size).to.equal(max2);
      for (let i = 0; i < max2; i++) {
        expect(nums2[i] > 0 && nums2[i] <= max2).to.true;
      }

      const bytes3 = await dataFeeds.getRandomBingoNumbers(salt, max3);
      expect(bytes3.length).to.equal(max3 * 2 + 2);
      const nums3 = await dataFeeds.getNumbersFromBytes(bytes3);
      expect(nums3.length).to.equal(max3);
      expect(new Set(nums3).size).to.equal(max3);
      for (let i = 0; i < max3; i++) {
        expect(nums3[i] > 0 && nums3[i] <= max3).to.true;
      }
    });
  });

  describe("Lottery", function () {
    it("Should get lottery numbers", async function () {
      const { dataFeeds } = await loadFixture(deployDataFeedsFixture);

      const salt = crypto.randomBytes(32);

      const bytes = await dataFeeds.getRandomLotto_6_49(salt);
      expect(bytes.length).to.equal(14);
      const nums = await dataFeeds.getNumbersFromBytes(bytes);
      expect(nums.length).to.equal(6);
      expect(new Set(nums).size).to.equal(6);
      for (let i = 0; i < 6; i++) {
        expect(nums[i] > 0 && nums[i] <= 49).to.true;
      }
    });
  });

  describe("Arithmetic functions", function () {
    it("Should get array of ordered numbers", async function () {
      const { dataFeeds } = await loadFixture(deployDataFeedsFixture);

      const array0_93 = Array.from(Array(94), (e, i) => i);
      const array7_190 = Array.from(Array(184), (e, i) => i + 7);
      const array255_255 = [255];

      expect(await dataFeeds.getOrderedArray(0, 93)).to.deep.equal(array0_93);
      expect(await dataFeeds.getOrderedArray(7, 190)).to.deep.equal(array7_190);
      expect(await dataFeeds.getOrderedArray(255, 255)).to.deep.equal(
        array255_255
      );

      await expect(dataFeeds.getOrderedArray(1, 0)).to.revertedWith(
        "DataFeeds: Wrong borders"
      );
    });
  });

  // // this test takes a long time to process for more than 1000 'iterationCount'
  // describe('Distribution of numbers 6-49', function () {
  //   it("Should revert with the right error if called from another account", async function () {
  //     const { dataFeeds } = await loadFixture(deployDataFeedsFixture);
  //     const random = crypto.randomBytes(32);

  //     const iterationCount = 1000;

  //     const arr = [];

  //     for (let i = 0; i < iterationCount; i++) {
  //       await mine();
  //       const bytes = await dataFeeds.getRandomLotto_6_49(random);
  //       const numbers = await dataFeeds.getNumbersFromBytes(bytes);
  //       expect((new Set(numbers)).size).to.equal(6);
  //       arr.push(...numbers);
  //       console.log('iteration', i, '->', bytes, ...numbers);
  //     }

  //     for (let i = 0; i <= 50; i++) {
  //       const count = arr.filter(e => e == i).length;
  //       console.log('number', i, '->', count, '->', (100 * count) / (iterationCount * 6), '%');
  //     }
  //   }).timeout(10000000);;
  // })

  // // this test takes a long time to process for more than 1000 'iterationCount'
  // describe('Distribution of numbers for bingo', function () {
  //   it("Should revert with the right error if called from another account", async function () {
  //     const { dataFeeds, owner, otherAccount } = await loadFixture(deployDataFeedsFixture);

  //     const iterationCount = 1000;
  //     const maxNumber = 50;

  //     const sumArr = Array(maxNumber).fill(0n);

  //     for (let i = 0; i < iterationCount; i++) {
  //       await time.increase(1000);
  //       await mine();
  //       const bytes = await dataFeeds.getRandomBingoNumbers(crypto.randomBytes(32), maxNumber);
  //       const numbers = await dataFeeds.getNumbersFromBytes(bytes);
  //       console.log('iteration', i, '->', bytes, ...numbers);
  //       expect((new Set(numbers)).size).to.equal(maxNumber);
  //       for (let j = 0; j < maxNumber; j++) {
  //         sumArr[j] = sumArr[j] + numbers[j];
  //       }
  //     }

  //     const sumValue = sumArr.reduce((acc, n) => acc + n, 0n);

  //     for (let i = 0; i < maxNumber + 1; i++) {
  //       console.log('position', i, '->', sumArr[i], '->', Number(sumArr[i]) * maxNumber / Number(sumValue), '%');
  //     }
  //   }).timeout(10000000);;
  // })
});
