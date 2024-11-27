require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",  // Default to Hardhat network
  networks: {
    hardhat: {
      forking: process.env.FORK_MAINNET === "true" ? {
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,  // Fork from Ethereum Mainnet
        blockNumber: 15000000,  // Optional: set a block number to fork from
      } : undefined,  // If FORK_MAINNET is not "true", don't enable forking
      chainId: 1,  // Mainnet chain ID
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,  // Sepolia testnet URL
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111 // Sepolia chain ID
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,  // Ethereum Mainnet URL
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1,  // Mainnet chain ID
    },
  },
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};