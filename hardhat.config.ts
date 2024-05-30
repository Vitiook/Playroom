import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";

const testMnemonic = "test test test test test test test test test test test test";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: { mnemonic: process.env.MNEMONIC_LOCAL || testMnemonic },
      gasPrice: 20000000000,
      allowUnlimitedContractSize: true,
    },
    hardhat: {
      chainId: 31337,
      accounts: { mnemonic: process.env.MNEMONIC_LOCAL || testMnemonic },
      gasPrice: 20000000000,
      allowUnlimitedContractSize: true,
    },
    mainnet: {
      url: "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
    testnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      gasPrice: 20000000000,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
    mumbai: {
      chainId: 80001,
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
};

export default config;
