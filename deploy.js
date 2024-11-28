const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createDocument, updateContractToMongoDB } = require('./ignition/util/db_util');

/** deployment */
const [,, pathToFile, network] = process.argv;  // Skip the first two arguments (node and script path)
if (!pathToFile || !network) {
  console.log('Usage: node deploy.js <path_to_file> <network>');
  process.exit(1);
}

// Your shell command, using the passed arguments
const shellCommand = `npx hardhat ignition deploy ${pathToFile} --network ${network}`;
const child = exec(shellCommand);

// Send input (e.g., 'y' to confirm the deployment)
child.stdin.write('y\n');  // 'y' for confirmation

// Log the output from the process
child.stdout.on('data', (data) => {
  console.log(data.toString());
});

// Log any errors
child.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Handle process exit
child.on('exit', (code) => {
  if (code !== 0) {
    console.log(`Process exited with code ${code}`);
    return;
  }

  console.log('Deployment successful!');

  // Now that the deployment is finished, continue with the post-deployment tasks
  postDeploymentExec();
});

async function postDeploymentExec() {
  try {
    const deployInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
    const network = deployInfo.network
    const chainId = network.config.chainId;
    const contractName = deployInfo.contractName;

    // Read the deployed addresses
    const deployedAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, `./ignition/deployments/chain-${chainId}/deployed_addresses.json`), 'utf8'));
    const deployedAddress = deployedAddresses[`${contractName}Module#${contractName}`];

    // Execute the MongoDB operation
    await mongoDBOperationExec(deployedAddress, contractName, network);
  } catch (error) {
    console.error("Error during post-deployment tasks:", error);
  }
}

async function mongoDBOperationExec(deployedAddress, contractName, network) {
  console.log(deployedAddress)
  // MongoDB update
  try {
    const document = await createDocument(contractName, deployedAddress, network);
    //console.log(`>>> document: \n${JSON.stringify(document, null, 2)}`);
    console.log(document)
    console.log(document.contractName)
    await updateContractToMongoDB(document);
  } catch (error) {
    console.error("-> MongoDB update failed:", error);
  }
}
