const {
  time,
  loadFixture,
  setPrevRandao,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const crypto = require("crypto");

describe("Lottery contract", function () {
  const ticketPrice = 10000n;
  const lotteryFee = 1000n;
  const tokenName = "Lotto Stable Token";
  const tokenSymbol = "LST";
  const zeroBytes6 = "0x000000000000";
  const weeklyPercent = 350n;
  const monthlyPercent = 1000n;
  const quarterlyPercent = 2500n;
  const yearlyPercent = 10000n;
  const num3Percent = 500n;
  const num4Percent = 1000n;
  const num5Percent = 2000n;
  const num6Percent = 6500n;
  const typeLotteryPercent = [
    weeklyPercent,
    monthlyPercent,
    quarterlyPercent,
    yearlyPercent,
  ];

  const zeroResults = [
    [0n, 0n],
    [0n, 0n],
    [0n, 0n],
    [0n, 0n],
    [0n, 0n],
  ];

  async function deployLotteryFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    const DataFeeds = await ethers.getContractFactory("DataFeeds");
    const dataFeeds = await DataFeeds.deploy();

    const Token = await ethers.getContractFactory("Token");
    const token = await await upgrades.deployProxy(Token, [
      tokenName,
      tokenSymbol,
    ]);
    await token.waitForDeployment();

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await upgrades.deployProxy(Lottery, [
      await dataFeeds.getAddress(),
      await token.getAddress(),
      ticketPrice,
      lotteryFee,
    ]);
    await lottery.waitForDeployment();

    return { token, dataFeeds, lottery, owner, otherAccount, otherAccount2 };
  }

  async function calculateLottery(lotteryContract, lotteryId) {
    const [lottery] = await lotteryContract.getLottery(lotteryId, lotteryId);
    const ticketsCount = lottery[0][4];
    const lotteryNumbers = lottery[0][3];
    const totalJackpot = await lotteryContract.totalJackpot();
    const winnings = await lotteryContract.unpaidWinnings();
    let lotteryPool = 0n;
    const winTickets = Array(5).fill(0n);
    const winValuesPerNumber = Array(5).fill(0n);
    const winValuesPerTicket = Array(5).fill(0n);
    for (let i = 0; i < ticketsCount; i++) {
      const [[[, , ticketNumber], ,]] = await lotteryContract.getTicket(
        lotteryId,
        i,
        i
      );
      const winType = checkWinNumbers(lotteryNumbers, ticketNumber);
      winTickets[winType] = winTickets[winType] + 1n;
    }

    const preLottteryPool =
      (totalJackpot * typeLotteryPercent[lottery[0][1]]) / 10000n;

    winValuesPerNumber[1] = (preLottteryPool * num3Percent) / 10000n;
    winValuesPerNumber[2] = (preLottteryPool * num4Percent) / 10000n;
    winValuesPerNumber[3] = (preLottteryPool * num5Percent) / 10000n;
    winValuesPerNumber[4] = (preLottteryPool * num6Percent) / 10000n;

    for (let i = 1; i < 5; i++) {
      if (winTickets[i] > 0)
        winValuesPerTicket[i] = winValuesPerNumber[i] / winTickets[i];
    }

    for (let i = 0; i < 5; i++) {
      lotteryPool += winTickets[i] * winValuesPerTicket[i];
    }

    await expect(
      lotteryContract.calculateLottery(
        lotteryId,
        totalJackpot,
        lotteryPool,
        winTickets,
        winValuesPerTicket
      )
    )
      .to.emit(lotteryContract, "CalculateLottery")
      .withArgs(
        lotteryId,
        totalJackpot,
        lotteryPool,
        winTickets,
        winValuesPerTicket
      );

    expect(await lotteryContract.totalJackpot()).to.equal(
      totalJackpot - lotteryPool
    );
    expect(await lotteryContract.unpaidWinnings()).to.equal(
      winnings + lotteryPool
    );

    const [updateLottery] = await lotteryContract.getLottery(
      lotteryId,
      lotteryId
    );

    expect(updateLottery[0][0]).to.equal(3n);
    expect(updateLottery[0][1]).to.equal(lottery[0][1]);
    expect(updateLottery[0][2]).to.equal(lottery[0][2]);
    expect(updateLottery[0][3]).to.equal(lottery[0][3]);
    expect(updateLottery[0][4]).to.equal(lottery[0][4]);
    expect(updateLottery[0][5]).to.equal(totalJackpot);
    expect(updateLottery[1]).to.deep.equal([
      [winTickets[0], winValuesPerTicket[0]],
      [winTickets[1], winValuesPerTicket[1]],
      [winTickets[2], winValuesPerTicket[2]],
      [winTickets[3], winValuesPerTicket[3]],
      [winTickets[4], winValuesPerTicket[4]],
    ]);
  }

  function checkWinNumbers(b1, b2) {
    let win = 0n;
    let type = 0n;
    const arr1 = hexStringToByte(b1);
    const arr2 = hexStringToByte(b2);

    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 6; j += 1) {
        if (arr1[i] == arr2[j]) win++;
      }
    }
    if (win == 6n) type = 4n;
    if (win == 5n) type = 3n;
    if (win == 4n) type = 2n;
    if (win == 3n) type = 1n;

    return type;
  }

  function hexStringToByte(str) {
    const bytes = [];

    for (let i = 2; i < str.length; i += 2) {
      bytes.push(parseInt(str.substr(i, 2), 16));
    }

    return bytes;
  }

  describe("Deployment", function () {
    it("Should set the", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
    });
  });

  describe("Lottery", function () {
    describe("InitLottery", function () {
      it("Should init lottery", async function () {
        const { lottery, owner } = await loadFixture(deployLotteryFixture);

        await expect(lottery.initLottery(0, 123456)).to.revertedWithCustomError(
          lottery,
          "AccessControlUnauthorizedAccount"
        );

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        let [l] = await lottery.getLottery(0, 0);
        expect(l[0]).to.deep.equal([0n, 0n, 0n, zeroBytes6, 0n, 0n]);
        expect(l[1]).to.deep.equal(zeroResults);

        await expect(lottery.initLottery(0, 123456))
          .to.emit(lottery, "InitLottery")
          .withArgs(0n, 0n, 123456);

        [l] = await lottery.getLottery(0, 0);
        expect(l[0]).to.deep.equal([1n, 0n, 123456n, zeroBytes6, 0n, 0n]);
        expect(l[1]).to.deep.equal(zeroResults);

        await expect(lottery.initLottery(2, 12345678))          
          .to.emit(lottery, "InitLottery")
          .withArgs(1n, 2n, 12345678);
      });
    });

    describe("DrawnLottery", function () {
      it("Should drawn lottery", async function () {
        const { lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        const salt =
          "0x0102030405060708091011121314151617181920212223242526272829303132";

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        await expect(lottery.initLottery(0, 123456))
          .to.emit(lottery, "InitLottery")
          .withArgs(0n, 0n, 123456);

        let [l] = await lottery.getLottery(0, 0);
        expect(l[0]).to.deep.equal([1n, 0n, 123456n, zeroBytes6, 0n, 0n]);
        expect(l[1]).to.deep.equal(zeroResults);

        await expect(
          lottery.connect(otherAccount).initLottery(0, 123456)
        ).to.revertedWithCustomError(
          lottery,
          "AccessControlUnauthorizedAccount"
        );

        await expect(lottery.drawnLottery(0, salt)).to.emit(
          lottery,
          "DrawnLottery"
        );

        [l] = await lottery.getLottery(0, 0);
        expect(l[0][0]).to.equal(2n);
      });
    });

    describe("CalculateLottery", function () {
      it("Should calculate lottery two user weekly", async function () {
        const { token, lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        const salt =
          "0x0102030405060708091011121314151617181920212223242526272829303132";
        const lotteryNums = "0x0905301e2d0c";
        const noWins = "0x010203040607";
        const win3Nums = "0x090530040607";
        const win4Nums = "0x301e06090507";
        const win5Nums = "0x2d070905301e";
        const win6Nums = "0x1e2d0c090530";

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        await lottery.initLottery(0, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(owner.address, 1010n * ticketPrice);
        await token.approve(await lottery.getAddress(), 1010n * ticketPrice);
        await token.mint(otherAccount.address, 20n * ticketPrice);
        await token
          .connect(otherAccount)
          .approve(await lottery.getAddress(), 20n * ticketPrice);

        await lottery.buyTickets(1010n);
        await lottery.connect(otherAccount).buyTickets(20n);

        const tickets1 = [
          noWins,
          noWins,
          noWins,
          noWins,
          noWins,
          win3Nums,
          win3Nums,
          win4Nums,
          win4Nums,
          win5Nums,
        ];

        const tickets2 = [
          noWins,
          noWins,
          noWins,
          noWins,
          noWins,
          noWins,
          win3Nums,
          win3Nums,
          win4Nums,
          win5Nums,
          win6Nums,
        ];

        await lottery.registerTickets(0, tickets1);

        await lottery.connect(otherAccount).registerTickets(0, tickets2);

        await time.increaseTo(lotteryTime);

        await lottery.drawnLottery(0, salt);

        await calculateLottery(lottery, 0);

        let [[[, , , nums, ,], results]] = await lottery.getLottery(0, 0);

        for (let i = 0; i < 10; i++) {
          const winType = checkWinNumbers(nums, tickets1[i]);
          expect(await lottery.getTicket(0, i, i)).to.deep.equal([
            [
              [true, false, tickets1[i], owner.address],
              winType,
              results[winType][1],
            ],
          ]);
        }
        for (let i = 0; i < 11; i++) {
          const winType = checkWinNumbers(nums, tickets2[i]);
          expect(await lottery.getTicket(0, i + 10, i + 10)).to.deep.equal([
            [
              [true, false, tickets2[i], otherAccount.address],
              winType,
              results[winType][1],
            ],
          ]);
        }
      });

      it("Should calculate lottery no wins monthly", async function () {
        const { token, lottery, owner } = await loadFixture(
          deployLotteryFixture
        );

        const salt =
          "0x0102030405060708091011121314151617181920212223242526272829303132";
        const lotteryNums = "0x051a1e25012f";
        const noWins = "0x080203040607";

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        await lottery.initLottery(1, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(owner.address, 1000n * ticketPrice);
        await token.approve(await lottery.getAddress(), 1000n * ticketPrice);

        await lottery.buyTickets(1000n);

        const tickets = Array(100).fill(noWins);

        await lottery.registerTickets(0, tickets);

        await time.increaseTo(lotteryTime);

        await lottery.drawnLottery(0, salt);

        await calculateLottery(lottery, 0);

        let [[[, , , nums, ,], results]] = await lottery.getLottery(0, 0);

        for (let i = 0; i < 100; i++) {
          const winType = checkWinNumbers(nums, tickets[i]);
          expect(await lottery.getTicket(0, i, i)).to.deep.equal([
            [
              [true, false, tickets[i], owner.address],
              winType,
              results[winType][1],
            ],
          ]);
        }
      });

      it("Should calculate lottery part of numbers quarter", async function () {
        const { token, lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        const salt =
          "0x0102030405060708091011121314151617181920212223242526272829303132";
        const lotteryNums = "0x051a1e25012f";
        const noWins = "0x080203040607";
        const win3Nums = "0x051a1e040607";
        const win4Nums = "0x30111e25012f";

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        await lottery.initLottery(2, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(otherAccount.address, 20n * ticketPrice);
        await token
          .connect(otherAccount)
          .approve(await lottery.getAddress(), 20n * ticketPrice);

        await lottery.connect(otherAccount).buyTickets(20n);

        const tickets = [win3Nums, win3Nums, win4Nums, noWins, noWins];

        await lottery.connect(otherAccount).registerTickets(0, tickets);

        await time.increaseTo(lotteryTime);

        await lottery.drawnLottery(0, salt);

        await calculateLottery(lottery, 0);

        let [[[, , , nums, ,], results]] = await lottery.getLottery(0, 0);

        for (let i = 0; i < 5; i++) {
          const winType = checkWinNumbers(nums, tickets[i]);
          expect(await lottery.getTicket(0, i, i)).to.deep.equal([
            [
              [true, false, tickets[i], otherAccount.address],
              winType,
              results[winType][1],
            ],
          ]);
        }
      });

      it("Should calculate lottery all numbers yearly", async function () {
        const { token, lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        const salt =
          "0x0102030405060708091011121314151617181920212223242526272829303132";
        const lotteryNums = "0x051a1e25012f";
        const win3Nums = "0x051a1e040607";
        const win4Nums = "0x30111e25012f";
        const win5Nums = "0x051a1e25011d";
        const win6Nums = "0x25012f051a1e";

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        await lottery.initLottery(3, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(otherAccount.address, 20n * ticketPrice);
        await token
          .connect(otherAccount)
          .approve(await lottery.getAddress(), 20n * ticketPrice);

        await lottery.connect(otherAccount).buyTickets(20n);

        const tickets = [win3Nums, win4Nums, win5Nums, win6Nums];

        await lottery.connect(otherAccount).registerTickets(0, tickets);

        await time.increaseTo(lotteryTime);

        await lottery.drawnLottery(0, salt);

        await calculateLottery(lottery, 0);

        let [[[, , , nums, ,], results]] = await lottery.getLottery(0, 0);

        for (let i = 0; i < 4; i++) {
          const winType = checkWinNumbers(nums, tickets[i]);
          expect(await lottery.getTicket(0, i, i)).to.deep.equal([
            [
              [true, false, tickets[i], otherAccount.address],
              winType,
              results[winType][1],
            ],
          ]);
        }
      });
    });
  });

  describe("Ticket", function () {
    describe("SetTicketPrice", function () {
      it("Should set ticket price", async function () {
        const { lottery, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        expect(await lottery.ticketPrice()).to.equal(ticketPrice);

        await expect(
          lottery.connect(otherAccount).setTicketPrice(200000n)
        ).to.revertedWithCustomError(
          lottery,
          "AccessControlUnauthorizedAccount"
        );
        expect(await lottery.ticketPrice()).to.equal(ticketPrice);

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          otherAccount.address
        );

        await expect(lottery.connect(otherAccount).setTicketPrice(200000n))
          .to.emit(lottery, "SetFee")
          .withArgs(otherAccount.address, 200000n);
        expect(await lottery.ticketPrice()).to.equal(200000n);

        await expect(lottery.connect(otherAccount).setTicketPrice(300n))
          .to.emit(lottery, "SetFee")
          .withArgs(otherAccount.address, 300n);
        expect(await lottery.ticketPrice()).to.equal(300n);

        await expect(
          lottery.connect(otherAccount).setTicketPrice(0n)
        ).to.revertedWith("Lottery: Wrong ticket price");
        expect(await lottery.ticketPrice()).to.equal(300n);
      });
    });

    describe("BuyTickets", function () {
      it("Should buy ticket", async function () {
        const { token, lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(owner.address, 50n * ticketPrice);
        await token.approve(await lottery.getAddress(), 50n * ticketPrice);
        await token.mint(otherAccount.address, 10n * ticketPrice);
        await token
          .connect(otherAccount)
          .approve(await lottery.getAddress(), 10n * ticketPrice);

        expect(await token.balanceOf(owner.address)).to.equal(
          50n * ticketPrice
        );
        expect(await token.balanceOf(otherAccount.address)).to.equal(
          10n * ticketPrice
        );
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(0n);
        expect(await lottery.totalJackpot()).to.equal(0n);

        await expect(lottery.buyTickets(1))
          .to.emit(lottery, "BuyTickets")
          .withArgs(owner.address, 1);

        expect(await token.balanceOf(owner.address)).to.equal(
          49n * ticketPrice
        );
        expect(await token.balanceOf(otherAccount.address)).to.equal(
          10n * ticketPrice
        );
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(
          1n * ticketPrice
        );
        expect(await lottery.totalJackpot()).to.equal(
          1n * ticketPrice - (1n * ticketPrice * lotteryFee) / 10000n
        );

        await expect(lottery.buyTickets(49))
          .to.emit(lottery, "BuyTickets")
          .withArgs(owner.address, 49);

        expect(await token.balanceOf(owner.address)).to.equal(0n);
        expect(await token.balanceOf(otherAccount.address)).to.equal(
          10n * ticketPrice
        );
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(
          50n * ticketPrice
        );
        expect(await lottery.totalJackpot()).to.equal(
          50n * ticketPrice - (50n * ticketPrice * lotteryFee) / 10000n
        );

        await expect(lottery.buyTickets(1)).to.revertedWithCustomError(
          token,
          "ERC20InsufficientAllowance"
        );
        await expect(
          lottery.connect(otherAccount).buyTickets(20)
        ).to.revertedWithCustomError(token, "ERC20InsufficientAllowance");
        await expect(
          lottery.connect(otherAccount).buyTickets(0)
        ).to.revertedWithCustomError(lottery, "TicketZeroCount");

        expect(await token.balanceOf(owner.address)).to.equal(0n);
        expect(await token.balanceOf(otherAccount.address)).to.equal(
          10n * ticketPrice
        );
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(
          50n * ticketPrice
        );
        expect(await lottery.totalJackpot()).to.equal(
          50n * ticketPrice - (50n * ticketPrice * lotteryFee) / 10000n
        );

        await expect(lottery.connect(otherAccount).buyTickets(10))
          .to.emit(lottery, "BuyTickets")
          .withArgs(otherAccount.address, 10);

        expect(await token.balanceOf(owner.address)).to.equal(0n);
        expect(await token.balanceOf(otherAccount.address)).to.equal(0n);
        expect(await token.balanceOf(await lottery.getAddress())).to.equal(
          60n * ticketPrice
        );
        expect(await lottery.totalJackpot()).to.equal(
          60n * ticketPrice - (60n * ticketPrice * lotteryFee) / 10000n
        );
      });
    });

    describe("RegisterTicket", function () {
      it("Should register ticket", async function () {
        const { token, lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        const lotteryType = 1n;

        const bytesArray50 = new Array(50).fill("0x101112131415");
        const bytesArray100 = new Array(100).fill("0x010203040506");
        const bytesArray10 = new Array(10).fill("0x313029282726");

        expect(await lottery.getTicket(0, 0, 0)).to.deep.equal([
          [[false, false, zeroBytes6, ethers.ZeroAddress], 0n, 0n],
        ]);

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.initLottery(lotteryType, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(owner.address, 60n * ticketPrice);
        await token.approve(await lottery.getAddress(), 60n * ticketPrice);
        await token.mint(otherAccount.address, 110n * ticketPrice);
        await token
          .connect(otherAccount)
          .approve(await lottery.getAddress(), 110n * ticketPrice);

        await lottery.buyTickets(60n);
        await lottery.connect(otherAccount).buyTickets(110n);

        expect(await lottery.tickets(owner.address)).to.equal(60n);
        expect(await lottery.tickets(otherAccount.address)).to.equal(110n);
        let [l] = await lottery.getLottery(0, 0);
        expect(l[0]).to.deep.equal([
          1n,
          lotteryType,
          lotteryTime,
          zeroBytes6,
          0n,
          0n,
        ]);
        expect(l[1]).to.deep.equal(zeroResults);

        await expect(lottery.registerTickets(0, bytesArray50))
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 0n, owner.address, bytesArray50[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 49n, owner.address, bytesArray50[0]);

        expect(await lottery.tickets(owner.address)).to.equal(10n);
        expect(await lottery.tickets(otherAccount.address)).to.equal(110n);
        [l] = await lottery.getLottery(0, 0);
        expect(l[0]).to.deep.equal([
          1n,
          lotteryType,
          lotteryTime,
          zeroBytes6,
          50n,
          0n,
        ]);
        expect(l[1]).to.deep.equal(zeroResults);

        await expect(lottery.registerTickets(0, bytesArray10))
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 50n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 51n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 52n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 53n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 54n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 55n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 56n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 57n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 58n, owner.address, bytesArray10[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 59n, owner.address, bytesArray10[0]);
        await expect(
          lottery.connect(otherAccount).registerTickets(0, bytesArray100)
        )
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 60n, otherAccount.address, bytesArray100[0])
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 159n, otherAccount.address, bytesArray100[0]);
        await expect(
          lottery.connect(otherAccount).registerTickets(0, ["0x212223242526"])
        )
          .to.emit(lottery, "RegisterTicket")
          .withArgs(0n, 160n, otherAccount.address, "0x212223242526");

        expect(await lottery.tickets(owner.address)).to.equal(0n);
        expect(await lottery.tickets(otherAccount.address)).to.equal(9n);
        [l] = await lottery.getLottery(0, 0);
        expect(l[0]).to.deep.equal([
          1n,
          lotteryType,
          lotteryTime,
          zeroBytes6,
          161n,
          0n,
        ]);
        expect(l[1]).to.deep.equal(zeroResults);

        expect(await lottery.getTicket(0, 0, 0)).to.deep.equal([
          [[true, false, bytesArray50[0], owner.address], 0n, 0n],
        ]);
        expect(await lottery.getTicket(0, 50, 50)).to.deep.equal([
          [[true, false, bytesArray10[0], owner.address], 0n, 0n],
        ]);
        expect(await lottery.getTicket(0, 60, 60)).to.deep.equal([
          [[true, false, bytesArray100[0], otherAccount.address], 0n, 0n],
        ]);
        expect(await lottery.getTicket(0, 160, 160)).to.deep.equal([
          [[true, false, "0x212223242526", otherAccount.address], 0n, 0n],
        ]);
      });

      it("Should NOT register ticket if wrong ticket number", async function () {
        const { token, lottery, owner } = await loadFixture(
          deployLotteryFixture
        );

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.initLottery(0, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(owner.address, 60 * 10000);
        await token.approve(await lottery.getAddress(), 60 * 10000);

        await lottery.buyTickets(60n);

        await expect(
          lottery.registerTickets(0, ["0x010203040566"])
        ).to.revertedWithCustomError(lottery, "TicketWrongNumber");
        await expect(
          lottery.registerTickets(0, ["0x000203040506"])
        ).to.revertedWithCustomError(lottery, "TicketWrongNumber");
        await expect(
          lottery.registerTickets(0, ["0x010232040506"])
        ).to.revertedWithCustomError(lottery, "TicketWrongNumber");
        await expect(
          lottery.registerTickets(0, ["0x999999999999"])
        ).to.revertedWithCustomError(lottery, "TicketWrongNumber");
      });

      it("Should NOT register ticket if ticket has same numbers", async function () {
        const { token, lottery, owner } = await loadFixture(
          deployLotteryFixture
        );

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.initLottery(0, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(owner.address, 60 * 10000);
        await token.approve(await lottery.getAddress(), 60 * 10000);

        await lottery.buyTickets(60n);

        await expect(
          lottery.registerTickets(0, ["0x010203040501"])
        ).to.revertedWithCustomError(lottery, "TicketSameNumbers");
        await expect(
          lottery.registerTickets(0, ["0x313029283026"])
        ).to.revertedWithCustomError(lottery, "TicketSameNumbers");
      });
    });

    describe("ClaimTicket", function () {
      it("Should claim ticket", async function () {
        const { token, lottery, owner, otherAccount } = await loadFixture(
          deployLotteryFixture
        );

        const salt =
          "0x5161718192021222324252627282930313201020304050607080910111213141";
        const lotteryNums = "0x230504090c06";
        const noWins = "0x010203040508";
        const win3Nums = "0x2305040b192a";
        const win4Nums = "0x23050409192a";
        const win5Nums = "0x230504090c2a";
        const win6Nums = "0x230504090c06";

        await lottery.grantRole(
          await lottery.LOTTERY_ADMIN_ROLE(),
          owner.address
        );

        const lotteryTime = (await time.latest()) + 3600;

        await lottery.initLottery(3, lotteryTime);

        await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
        await token.grantRole(
          await token.CONTRACT_ROLE(),
          await lottery.getAddress()
        );

        await token.mint(otherAccount.address, 5n * ticketPrice);
        await token
          .connect(otherAccount)
          .approve(await lottery.getAddress(), 5n * ticketPrice);

        await lottery.connect(otherAccount).buyTickets(5n);

        const tickets = [noWins, win3Nums, win4Nums, win5Nums, win6Nums];

        await lottery.connect(otherAccount).registerTickets(0, tickets);

        await time.increaseTo(lotteryTime);

        expect(await lottery.getTicket(0, 0, 4)).to.deep.equal([
          [[true, false, tickets[0], otherAccount.address], 0, 0],
          [[true, false, tickets[1], otherAccount.address], 0, 0],
          [[true, false, tickets[2], otherAccount.address], 0, 0],
          [[true, false, tickets[3], otherAccount.address], 0, 0],
          [[true, false, tickets[4], otherAccount.address], 0, 0],
        ]);

        await setPrevRandao(1000);
        let increaseBlock =
          "0x" +
          (1000 - ((await ethers.provider.getBlockNumber()) + 1)).toString(16);

        await ethers.provider.send("hardhat_mine", [increaseBlock]);
        const desiredTimestamp = 1818263380;
        await ethers.provider.send("evm_setNextBlockTimestamp", [
          desiredTimestamp,
        ]);
        await lottery.drawnLottery(0, salt); //0x230504090c06

        expect(await lottery.getTicket(0, 0, 4)).to.deep.equal([
          [[true, false, tickets[0], otherAccount.address], 0, 0],
          [[true, false, tickets[1], otherAccount.address], 1, 0],
          [[true, false, tickets[2], otherAccount.address], 2, 0],
          [[true, false, tickets[3], otherAccount.address], 3, 0],
          [[true, false, tickets[4], otherAccount.address], 4, 0],
        ]);

        await calculateLottery(lottery, 0);

        let [[, results]] = await lottery.getLottery(0, 0);

        const balanceLottery = await token.balanceOf(
          await lottery.getAddress()
        );
        const balanceTicketsOwner = await token.balanceOf(otherAccount.address);
        const lottreyUnpaidWinnigs = await lottery.unpaidWinnings();

        expect(await lottery.getTicket(0, 0, 4)).to.deep.equal([
          [[true, false, tickets[0], otherAccount.address], 0, results[0][1]],
          [[true, false, tickets[1], otherAccount.address], 1, results[1][1]],
          [[true, false, tickets[2], otherAccount.address], 2, results[2][1]],
          [[true, false, tickets[3], otherAccount.address], 3, results[3][1]],
          [[true, false, tickets[4], otherAccount.address], 4, results[4][1]],
        ]);

        await expect(
          lottery.connect(otherAccount).claimTickket(1, [1, 2, 4])
        ).to.revertedWith("Lottery: Lottery not calculated");
        await expect(
          lottery.connect(otherAccount).claimTickket(0, [])
        ).to.revertedWithCustomError(lottery, "TicketZeroCount");
        await expect(
          lottery.connect(otherAccount).claimTickket(0, [1, 2, 4, 5])
        ).to.revertedWith("Lottery: Ticket not active");
        await expect(lottery.claimTickket(0, [1, 2, 4])).to.revertedWith(
          "Lottery: Wrong ticket owner"
        );
        await expect(
          lottery.connect(otherAccount).claimTickket(0, [1, 2, 4, 0])
        ).to.revertedWith("Lottery: Ticket is not winning");

        await expect(lottery.connect(otherAccount).claimTickket(0, [1, 2, 4]))
          .to.emit(lottery, "ClaimTicket")
          .withArgs(0, 1, results[1][1])
          .to.emit(lottery, "ClaimTicket")
          .withArgs(0, 2, results[2][1])
          .to.emit(lottery, "ClaimTicket")
          .withArgs(0, 4, results[4][1]);

        const paid1 = results[1][1] + results[2][1] + results[4][1];

        expect(balanceLottery - paid1).to.equal(
          await token.balanceOf(await lottery.getAddress())
        );
        expect(balanceTicketsOwner + paid1).to.equal(
          await token.balanceOf(otherAccount.address)
        );
        expect(lottreyUnpaidWinnigs - paid1).to.equal(
          await lottery.unpaidWinnings()
        );

        await expect(
          lottery.connect(otherAccount).claimTickket(0, [1, 2, 4])
        ).to.revertedWith("Lottery: Ticket is already paid");

        expect(await lottery.getTicket(0, 0, 4)).to.deep.equal([
          [[true, false, tickets[0], otherAccount.address], 0, results[0][1]],
          [[true, true, tickets[1], otherAccount.address], 1, results[1][1]],
          [[true, true, tickets[2], otherAccount.address], 2, results[2][1]],
          [[true, false, tickets[3], otherAccount.address], 3, results[3][1]],
          [[true, true, tickets[4], otherAccount.address], 4, results[4][1]],
        ]);

        await expect(lottery.connect(otherAccount).claimTickket(0, [3]))
          .to.emit(lottery, "ClaimTicket")
          .withArgs(0, 3, results[3][1]);

        expect(balanceLottery - paid1 - results[3][1]).to.equal(
          await token.balanceOf(await lottery.getAddress())
        );
        expect(balanceTicketsOwner + paid1 + results[3][1]).to.equal(
          await token.balanceOf(otherAccount.address)
        );
        expect(lottreyUnpaidWinnigs - paid1 - results[3][1]).to.equal(
          await lottery.unpaidWinnings()
        );

        expect(await lottery.getTicket(0, 0, 4)).to.deep.equal([
          [[true, false, tickets[0], otherAccount.address], 0, results[0][1]],
          [[true, true, tickets[1], otherAccount.address], 1, results[1][1]],
          [[true, true, tickets[2], otherAccount.address], 2, results[2][1]],
          [[true, true, tickets[3], otherAccount.address], 3, results[3][1]],
          [[true, true, tickets[4], otherAccount.address], 4, results[4][1]],
        ]);
      });
    });
  });

  describe("Fee", function () {
    it("Should set fee", async function () {
      const { lottery, otherAccount } = await loadFixture(deployLotteryFixture);

      expect(await lottery.lotteryFee()).to.equal(lotteryFee);

      await expect(
        lottery.connect(otherAccount).setFee(2000n)
      ).to.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount");
      expect(await lottery.lotteryFee()).to.equal(lotteryFee);

      await lottery.grantRole(
        await lottery.LOTTERY_ADMIN_ROLE(),
        otherAccount.address
      );

      await expect(lottery.connect(otherAccount).setFee(2000n))
        .to.emit(lottery, "SetFee")
        .withArgs(otherAccount.address, 2000n);
      expect(await lottery.lotteryFee()).to.equal(2000n);

      await expect(lottery.connect(otherAccount).setFee(3000n)).to.revertedWith(
        "Lottery: Wrong fee value"
      );
      expect(await lottery.lotteryFee()).to.equal(2000n);

      await expect(lottery.connect(otherAccount).setFee(100n))
        .to.emit(lottery, "SetFee")
        .withArgs(otherAccount.address, 100n);
      expect(await lottery.lotteryFee()).to.equal(100n);
    });

    it("Should withdraw fee", async function () {
      const { token, lottery, owner, otherAccount, otherAccount2 } =
        await loadFixture(deployLotteryFixture);

      await lottery.grantRole(
        await lottery.LOTTERY_ADMIN_ROLE(),
        owner.address
      );

      const feePercentInit = await lottery.lotteryFee();
      const feePercent2 = 1555n; //15.55%

      await token.grantRole(await token.TOKEN_ADMIN_ROLE(), owner.address);
      await token.grantRole(
        await token.CONTRACT_ROLE(),
        await lottery.getAddress()
      );

      await token.mint(owner.address, 1010n * ticketPrice);
      await token.approve(await lottery.getAddress(), 1010n * ticketPrice);
      await token.mint(otherAccount.address, 200n * ticketPrice);
      await token
        .connect(otherAccount)
        .approve(await lottery.getAddress(), 200n * ticketPrice);

      await expect(lottery.withdrawFee(otherAccount2.address)).to.revertedWith(
        "Lottery: No fee"
      );
      await expect(
        lottery.connect(otherAccount).withdrawFee(otherAccount2.address)
      ).to.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount");

      await lottery.buyTickets(1000n);
      await lottery.connect(otherAccount).buyTickets(20n);

      let totalJackpot = await lottery.totalJackpot();
      let unpaidWinnings = await lottery.unpaidWinnings();
      let lotteryBalance = await token.balanceOf(await lottery.getAddress());
      let recieverBalance = await token.balanceOf(otherAccount2.address);

      let fee1 = (1020n * ticketPrice * feePercentInit) / 10000n;
      let fee2 = lotteryBalance - totalJackpot - unpaidWinnings;

      expect(fee1).to.equal(fee2);

      await expect(
        lottery.connect(otherAccount).withdrawFee(otherAccount2.address)
      ).to.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount");
      await expect(lottery.withdrawFee(otherAccount2.address))
        .to.emit(lottery, "WithdrawFee")
        .withArgs(otherAccount2.address, fee1);

      expect(await token.balanceOf(await lottery.getAddress())).to.equal(
        lotteryBalance - fee1
      );
      expect(await token.balanceOf(otherAccount2.address)).to.equal(
        recieverBalance + fee1
      );

      await lottery.setFee(feePercent2);

      await lottery.buyTickets(10n);
      await lottery.connect(otherAccount).buyTickets(180n);

      totalJackpot = await lottery.totalJackpot();
      unpaidWinnings = await lottery.unpaidWinnings();
      lotteryBalance = await token.balanceOf(await lottery.getAddress());
      recieverBalance = await token.balanceOf(otherAccount2.address);

      fee1 = (190n * ticketPrice * feePercent2) / 10000n;
      fee2 = lotteryBalance - totalJackpot - unpaidWinnings;

      expect(fee1).to.equal(fee2);

      await expect(
        lottery.connect(otherAccount).withdrawFee(otherAccount2.address)
      ).to.revertedWithCustomError(lottery, "AccessControlUnauthorizedAccount");
      await expect(lottery.withdrawFee(otherAccount2.address))
        .to.emit(lottery, "WithdrawFee")
        .withArgs(otherAccount2.address, fee1);

      expect(await token.balanceOf(await lottery.getAddress())).to.equal(
        lotteryBalance - fee1
      );
      expect(await token.balanceOf(otherAccount2.address)).to.equal(
        recieverBalance + fee1
      );
    });
  });
});
