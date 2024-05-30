const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  const name = "Lotto Stable Token";
  const symbol = "LST";
  const decimals = 18n;

  async function deployTokenFixture() {
    const [owner, account1, account2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await await upgrades.deployProxy(Token, [name, symbol]);
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const ADMIN_ROLE = await token.TOKEN_ADMIN_ROLE();
    const CONTRACT_ROLE = await token.CONTRACT_ROLE();

    return {
      token,
      owner,
      account1,
      account2,
      DEFAULT_ADMIN_ROLE,
      ADMIN_ROLE,
      CONTRACT_ROLE,
    };
  }

  describe("Deployment", function () {
    it("Should set name, symbol and decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
      expect(await token.decimals()).to.equal(decimals);
    });

    it("Should set the owner", async function () {
      const { token, owner, DEFAULT_ADMIN_ROLE } = await loadFixture(
        deployTokenFixture
      );

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.true;
    });
  });

  describe("Roles", function () {
    it("Should grant and revoke admin and contract roles for other accounts with owner", async function () {
      const { token, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      await token.grantRole(ADMIN_ROLE, account1.address);
      await token.grantRole(CONTRACT_ROLE, account2.address);

      expect(await token.hasRole(ADMIN_ROLE, account1.address)).to.true;
      expect(await token.hasRole(CONTRACT_ROLE, account2.address)).to.true;

      await token.revokeRole(ADMIN_ROLE, account1.address);
      await token.revokeRole(CONTRACT_ROLE, account2.address);

      expect(await token.hasRole(ADMIN_ROLE, account1.address)).to.false;
      expect(await token.hasRole(CONTRACT_ROLE, account2.address)).to.false;
    });

    it("Should NOT grant and revoke admin and contract roles for other accounts with NOT owner", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      await expect(
        token.connect(account1).grantRole(ADMIN_ROLE, account2.address)
      ).to.be.reverted;
      await expect(
        token.connect(account2).grantRole(CONTRACT_ROLE, account1.address)
      ).to.be.reverted;

      await expect(
        token.connect(account1).revokeRole(ADMIN_ROLE, owner.address)
      ).to.be.reverted;
      await expect(
        token.connect(account2).revokeRole(CONTRACT_ROLE, owner.address)
      ).to.be.reverted;
    });
  });

  describe("Mint", function () {
    it("Should mint tokens by sender with ADMIN_ROLE", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 1n * 10n ** decimals;
      const amount2 = 10000n * 10n ** decimals;
      const amount3 = 1000000000n * 10n ** decimals;

      expect(await token.balanceOf(owner.address)).to.equal(0);
      expect(await token.balanceOf(account1.address)).to.equal(0);
      expect(await token.balanceOf(account2.address)).to.equal(0);

      await token.grantRole(ADMIN_ROLE, account1.address);

      await token.connect(account1).mint(owner.address, amount1);
      await token.connect(account1).mint(account1.address, amount2);
      await token.connect(account1).mint(account2.address, amount3);

      expect(await token.balanceOf(owner.address)).to.equal(amount1);
      expect(await token.balanceOf(account1.address)).to.equal(amount2);
      expect(await token.balanceOf(account2.address)).to.equal(amount3);
    });

    it("Should NOT mint tokens by sender with NOT ADMIN_ROLE", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployTokenFixture
      );

      const amount1 = 1n * 10n ** decimals;
      const amount2 = 10000n * 10n ** decimals;
      const amount3 = 1000000000n * 10n ** decimals;

      await expect(
        token.connect(owner).mint(account2.address, amount1)
      ).to.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
      await expect(
        token.connect(account1).mint(account2.address, amount2)
      ).to.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
      await expect(
        token.connect(account2).mint(owner.address, amount3)
      ).to.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Burn", function () {
    it("Should burn tokens by sender with ADMIN_ROLE", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 1n * 10n ** decimals;
      const amount2 = 10000n * 10n ** decimals;
      const amount3 = 1000000000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);

      await token.connect(account1).mint(owner.address, amount1);
      await token.connect(account1).mint(account1.address, amount2);
      await token.connect(account1).mint(account2.address, amount3);

      expect(await token.balanceOf(owner.address)).to.equal(amount1);
      expect(await token.balanceOf(account1.address)).to.equal(amount2);
      expect(await token.balanceOf(account2.address)).to.equal(amount3);

      await token.connect(account1).burn(owner.address, amount1 - 100n);
      await token.connect(account1).burn(account1.address, amount2);
      await token.connect(account1).burn(account2.address, amount3 - 1000000n);

      expect(await token.balanceOf(owner.address)).to.equal(100n);
      expect(await token.balanceOf(account1.address)).to.equal(0n);
      expect(await token.balanceOf(account2.address)).to.equal(1000000n);
    });

    it("Should NOT burn tokens by sender with NOT ADMIN_ROLE", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 1n * 10n ** decimals;
      const amount2 = 10000n * 10n ** decimals;
      const amount3 = 1000000000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);

      await token.connect(account1).mint(owner.address, amount1);
      await token.connect(account1).mint(account1.address, amount2);
      await token.connect(account1).mint(account2.address, amount3);

      await expect(
        token.connect(account2).burn(owner.address, amount1)
      ).to.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
      await expect(
        token.connect(owner).burn(account1.address, amount2)
      ).to.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
      await expect(
        token.connect(owner).burn(account2.address, amount3)
      ).to.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Transfer", function () {
    it("Should be transfer tokens if sender with CONTRACT_ROLE ", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 10n * 10n ** decimals;
      const amount2 = 1000n * 10n ** decimals;
      const amount3 = 100000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);
      await token.grantRole(CONTRACT_ROLE, account2.address);

      await token.connect(account1).mint(account2.address, amount3);

      await token.connect(account2).transfer(owner.address, amount1);
      await token.connect(account2).transfer(account1.address, amount2);

      expect(await token.balanceOf(owner.address)).to.equal(amount1);
      expect(await token.balanceOf(account1.address)).to.equal(amount2);
      expect(await token.balanceOf(account2.address)).to.equal(
        amount3 - amount1 - amount2
      );
    });

    it("Should be transfer tokens if recipient with CONTRACT_ROLE ", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 10n * 10n ** decimals;
      const amount2 = 1000n * 10n ** decimals;
      const amount3 = 100000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);
      await token.grantRole(CONTRACT_ROLE, account2.address);
      await token.grantRole(CONTRACT_ROLE, owner.address);

      await token.connect(account1).mint(account1.address, amount3);

      await token.connect(account1).transfer(owner.address, amount1);
      await token.connect(account1).transfer(account2.address, amount2);

      expect(await token.balanceOf(owner.address)).to.equal(amount1);
      expect(await token.balanceOf(account2.address)).to.equal(amount2);
      expect(await token.balanceOf(account1.address)).to.equal(
        amount3 - amount1 - amount2
      );
    });

    it("Should be NOT transfer tokens if sender and recipient with NOT CONTRACT_ROLE ", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 10n * 10n ** decimals;
      const amount2 = 1000n * 10n ** decimals;
      const amount3 = 100000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);

      await token.connect(account1).mint(account2.address, amount3);
      await token.connect(account1).mint(owner.address, amount3);

      await expect(
        token.connect(account2).transfer(owner.address, amount1)
      ).to.revertedWith("Token: Forbidden transfer");
      await expect(
        token.connect(owner).transfer(account1.address, amount2)
      ).to.revertedWith("Token: Forbidden transfer");
    });
  });

  describe("TransferFrom", function () {
    it("Should be transfer tokens from other address if tokens owner with CONTRACT_ROLE ", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 10n * 10n ** decimals;
      const amount2 = 1000n * 10n ** decimals;
      const amount3 = 100000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);
      await token.grantRole(CONTRACT_ROLE, account2.address);

      await token.connect(account1).mint(account2.address, amount3);

      await token.connect(account2).approve(account1.address, amount1);
      await token.connect(account2).approve(owner.address, amount2);

      await token
        .connect(account1)
        .transferFrom(account2.address, owner.address, amount1);
      await token
        .connect(owner)
        .transferFrom(account2.address, account1.address, amount2);

      expect(await token.balanceOf(owner.address)).to.equal(amount1);
      expect(await token.balanceOf(account1.address)).to.equal(amount2);
      expect(await token.balanceOf(account2.address)).to.equal(
        amount3 - amount1 - amount2
      );
    });

    it("Should be transfer tokens from other address if reciever with CONTRACT_ROLE ", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 10n * 10n ** decimals;
      const amount2 = 1000n * 10n ** decimals;
      const amount3 = 100000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);
      await token.grantRole(CONTRACT_ROLE, account2.address);

      await token.connect(account1).mint(account1.address, amount3);
      await token.connect(account1).mint(owner.address, amount3);

      await token.connect(account1).approve(owner.address, amount1);
      await token.connect(owner).approve(account1.address, amount2);

      await token
        .connect(account1)
        .transferFrom(owner.address, account2.address, amount2);
      await token
        .connect(owner)
        .transferFrom(account1.address, account2.address, amount1);

      expect(await token.balanceOf(owner.address)).to.equal(amount3 - amount2);
      expect(await token.balanceOf(account1.address)).to.equal(
        amount3 - amount1
      );
      expect(await token.balanceOf(account2.address)).to.equal(
        amount1 + amount2
      );
    });

    it("Should be NOT transfer tokens from other address if tokens owner and reciever with NOT CONTRACT_ROLE ", async function () {
      const { token, owner, account1, account2, ADMIN_ROLE, CONTRACT_ROLE } =
        await loadFixture(deployTokenFixture);

      const amount1 = 10n * 10n ** decimals;
      const amount2 = 1000n * 10n ** decimals;
      const amount3 = 100000n * 10n ** decimals;

      await token.grantRole(ADMIN_ROLE, account1.address);

      await token.connect(account1).mint(account1.address, amount3);
      await token.connect(account1).mint(owner.address, amount3);

      await token.connect(account1).approve(owner.address, amount1);
      await token.connect(owner).approve(account1.address, amount2);

      await expect(
        token
          .connect(account1)
          .transferFrom(owner.address, account2.address, amount1)
      ).to.revertedWith("Token: Forbidden transfer");
      await expect(
        token
          .connect(owner)
          .transferFrom(account1.address, account2.address, amount2)
      ).to.revertedWith("Token: Forbidden transfer");
    });
  });
});
