const fs = require('fs');
const path = require('path');

const { network } = require("hardhat");
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


/** deployment */
// define parameters
const contractName = 'FlashLoan';
const parameters = JSON.parse(fs.readFileSync(path.join(__dirname, '../parameters.json'), 'utf8'));

console.log(`contractName=${contractName}`)
console.log(parameters[contractName]);

const deployInfo = {
  network,
  contractName,
};
fs.writeFileSync('./deployment-info.json', JSON.stringify(deployInfo, null, 2));


// extract constructor address
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

// deploy contract

const FlashLoanModule = buildModule("FlashLoanModule", (m) => {
  const FlashLoan = m.contract(contractName, [addressesProvider]);
  return { FlashLoan };
});

module.exports = FlashLoanModule;
console.log("FlashLoan Module deployed!");
 

