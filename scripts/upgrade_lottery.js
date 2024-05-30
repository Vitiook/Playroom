const { ethers, upgrades } = require("hardhat");

const main = async () => {
  const Lottery = await ethers.getContractFactory("Lottery");

  await upgrades.upgradeProxy('0x42d44acFF552c6e269fA8dEFA6422C9B3D3d46E7', Lottery);

  console.log(`Lottery upgraded`);
};

main();