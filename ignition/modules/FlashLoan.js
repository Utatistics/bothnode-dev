const fs = require('fs');
const path = require('path');
const parameters = JSON.parse(fs.readFileSync(path.join(__dirname, '../parameters.json'), 'utf8'));

const { network } = require("hardhat");
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const { createDocument, updateContractToMongoDB } = require('../util/db_util');


// define parameters
const contractName = 'FlashLoan';
let addressesProvider;
let deployedAddress;

// set addressProvider based on the network
 console.log(parameters[contractName]);
if (network.name === 'mainnet') {
  addressesProvider = parameters.FlashLoan._addressProvider_main;
} else if (network.name === 'hardhat' && network.config.forking.url.includes('mainnet.infura.io')) {
  addressesProvider = parameters.FlashLoan._addressProvider_main;
} else if (network.name === 'sepolia') {
  addressesProvider = parameters.FlashLoan._addressProvider_sepolia;
} else {
  console.error('Unsupported network');
  return;
}
console.log(addressesProvider);

// create contract moddule
const FlashLoanModule = buildModule("FlashLoanModule", (m) => {
  // deployment
  const FlashLoan = m.contract(contractName, [addressesProvider]);
  console.log("FlashLoan Module deployed");
  deployedAddress = FlashLoan.target;
  console.log(FlashLoan)
  
  // post-deployment
  mongoDBOperationExec(deployedAddress);

  return { FlashLoan };
});


async function mongoDBOperationExec(deployedAddress) {
  console.log(deployedAddress)
  // MongoDB update
  try {
    const document = createDocument(contractName, deployedAddress, network);
    updateContractToMongoDB(document)  
  } catch (error) {
    console.error("-> MogoDB update failed:", error);
  }
}

module.exports = FlashLoanModule;