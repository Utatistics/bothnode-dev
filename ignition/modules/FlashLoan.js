const fs = require('fs');
const path = require('path');

const { network } = require("hardhat");
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { createDocument, updateContractToMongoDB } = require('../util/db_util');


/** deployment */
// define parameters
const contractName = 'FlashLoan';
const chainId = network.config.chainId;
const parameters = JSON.parse(fs.readFileSync(path.join(__dirname, '../parameters.json'), 'utf8'));

// set addressProvider based on the network
console.log(chainId)
console.log(parameters[contractName]);

let addressesProvider;

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
console.log()

// deploy contract
const FlashLoanModule = buildModule("FlashLoanModule", (m) => {
  const FlashLoan = m.contract(contractName, [addressesProvider]);
  return { FlashLoan };
});

module.exports = FlashLoanModule;
console.log("FlashLoan Module deployed!");
 

/** post-deployment */
const deployedAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, `../deployments/chain-${chainId}/deployed_addresses.json`), 'utf8'));
const deployedAddress = deployedAddresses[`${contractName}Module#${contractName}`];

mongoDBOperationExec(deployedAddress);

async function mongoDBOperationExec(deployedAddress) {
  console.log(deployedAddress)
  // MongoDB update
  try {
    const document = await createDocument(contractName, deployedAddress, network);
    await updateContractToMongoDB(document)  
  } catch (error) {
    console.error("-> MogoDB update failed:", error);
  }
}
