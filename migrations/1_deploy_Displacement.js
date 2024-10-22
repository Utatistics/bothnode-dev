const Displacement = artifacts.require("Displacement");

module.exports = async function(deployer, network, accounts) {
  // Here, accounts[0] and accounts[1] are the first and second addresses from the list of accounts provided by the network.
  const agentAddress = accounts[0];
  const attackerAddress = accounts[1]; 

  // Deploy the Displacement contract with constructor arguments: agentAddress and attackerAddress
  await deployer.deploy(Displacement, agentAddress, attackerAddress);
};
