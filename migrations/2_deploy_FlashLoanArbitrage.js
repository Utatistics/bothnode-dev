const { MongoClient } = require('mongodb');

const fs = require('fs');  // Import the file system module
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

module.exports = async function(deployer, network, accounts) {
    const ContractName = "FlashLoanArbitrage"
    const FlashLoanArbitrage = artifacts.require(ContractName);

    const _poolAddressesProvider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
    const _comptrollerAddress = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
    const _cEthAddress = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
    const _cWBTCAddress = "0xC11b1268C1A384e55C48c2391d8d480264A3A7F4";
    const _bzxAddress = "0xD8Ee69652E4e4838f2531732a46d1f7F584F0b7f";
    const _swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    const _wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const _wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log("\x1b[35m%s\x1b[m", "->Starting deployment of FlashLoanArbitrage...");
    try {
        console.log("\x1b[35m%s\x1b[m", "->Before Deployment");
        await deployer.deploy(
            FlashLoanArbitrage,
            _poolAddressesProvider,
            _comptrollerAddress,
            _cEthAddress,
            _cWBTCAddress,
            _bzxAddress,
            _swapRouterAddress, 
            _wbtcAddress, 
            _wethAddress
        );

        console.log("\x1b[35m%s\x1b[m", "->After Deployment");

        /** Post deployment */
        const instance = await FlashLoanArbitrage.deployed();
        const address = instance.address
        console.log("\x1b[35m%s\x1b[m", `->Contract deployed at: ${address}`);

        // Call the function to update MongoDB with contract data
        if (network.includes("fork")) {
            console.log("\x1b[35m%s\x1b[m", "->Dry-run simulation: Skipping MongoDB update.");
        } else {
            console.log("\x1b[35m%s\x1b[m", "->Updating MongoDB.");
            // Load the contract artifact (JSON file) to get ABI and bytecode
            const contractPath = path.join(__dirname, `../build/contracts/${ContractName}.json`);        
            const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

            // Extract the ABI, bytecode, and sourcePath
            const { contractName, abi, bytecode, sourcePath } = contractData;

            // Prepare the document to be inserted/updated in MongoDB
            const contractDocument = {
                address: address,
                contractName: contractName,
                abi: abi,
                bytecode: bytecode,
                sourcePath: sourcePath,
                address: instance.address,
                network: network
            };
            await updateContractToMongoDB(contractDocument);
        }

    } catch (error) {
        console.log("\x1b[35m%s\x1b[m", "->Message at catch block...");
        console.error("-> Deployment failed:", error);
    }
};

// MongoDB connection and contract data update function
async function updateContractToMongoDB(contractDocument) {
    const dbName = "contract_db"
    const collectionName = "deployment"; // MongoDB collection to store contract data

    const username = config.DB.init_username;
    const password = config.DB.init_password;
    const connectionString = config.DB.connection_string;
    
    const [protocol, rest] = connectionString.split("://");
    const authPart = `${username}:${password}@`;
    const newConnectionString = `${protocol}://${authPart}${rest}`;

    try {
        // Connect to MongoDB
        const client = new MongoClient(newConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Insert or update the contract data
        await collection.updateOne(
            { address: contractDocument.address }, // Match byh the unique address field
            // { contractName: contractDocument.contractName, network: contractDocument.network }, // Match by contractName and network
            { $set: contractDocument }, // Update the document
            { upsert: true }            // Insert if not exists
        );
        console.log(`Contract data for ${contractDocument.contractName} updated in MongoDB`);

        // Close the MongoDB connection
        await client.close();
        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Error updating contract in MongoDB:", error);
    }
}