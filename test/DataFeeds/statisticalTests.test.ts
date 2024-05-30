// import { expect } from "chai";
// import {
//   loadFixture,
//   time,
//   mine,
// } from "@nomicfoundation/hardhat-network-helpers";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { Bingo, DataFeeds } from "../../types/typechain-types";
// import { ContractTransaction } from "ethers";
// import { standardPrepareBingo } from "../utils";
// import crypto from "crypto";

// describe("Methods", () => {
//   let random: string;
//   const iterationCount = 1000;
//   // this test takes a long time to process for more than 1000 'iterationCount'
//   describe("Distribution of numbers 6-49", function () {
//     it("Should revert with the right error if called from another account", async function () {
//       const { dataFeeds } = await loadFixture(standardPrepareBingo);
//       random = crypto.randomBytes(32);

//       // const iterationCount = 1000;

//       const arr = [];

//       for (let i = 0; i < iterationCount; i++) {
//         await mine();
//         const bytes = await dataFeeds.getRandomLotto_6_49(random);
//         const numbers = await dataFeeds.getNumbersFromBytes(bytes);
//         expect(new Set(numbers).size).to.equal(6);
//         arr.push(...numbers);
//         console.log("iteration", i, "->", bytes, ...numbers);
//       }

//       for (let i = 0; i <= 50; i++) {
//         const count = arr.filter((e) => e == i).length;
//         console.log(
//           "number",
//           i,
//           "->",
//           count,
//           "->",
//           (100 * count) / (iterationCount * 6),
//           "%"
//         );
//       }
//     }).timeout(10000000);
//   });

//   // this test takes a long time to process for more than 1000 'iterationCount'
//   describe("Distribution of numbers for bingo", function () {
//     it("Should revert with the right error if called from another account", async function () {
//       const { dataFeeds, owner } = await loadFixture(standardPrepareBingo);

//       // const iterationCount = 1000;
//       const maxNumber = 50;

//       const sumArr = Array(maxNumber).fill(0n);

//       for (let i = 0; i < iterationCount; i++) {
//         await time.increase(1000);
//         await mine();
//         const bytes = await dataFeeds.getRandomBingoNumbers(
//           crypto.randomBytes(32),
//           maxNumber
//         );
//         const numbers = await dataFeeds.getNumbersFromBytes(bytes);
//         console.log("iteration", i, "->", bytes, ...numbers);
//         expect(new Set(numbers).size).to.equal(maxNumber);
//         for (let j = 0; j < maxNumber; j++) {
//           sumArr[j] = sumArr[j] + numbers[j];
//         }
//       }

//       const sumValue = sumArr.reduce((acc, n) => acc + n, 0n);

//       for (let i = 0; i < maxNumber + 1; i++) {
//         console.log(
//           "position",
//           i,
//           "->",
//           sumArr[i],
//           "->",
//           (Number(sumArr[i]) * maxNumber) / Number(sumValue),
//           "%"
//         );
//       }
//     }).timeout(10000000);
//   });
// });
