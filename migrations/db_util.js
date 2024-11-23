// db_util.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));


// Create the document after contract deployment
async function createDocument(contract, ContractName, network) {
    console.log("\x1b[35m%s\x1b[m", "-> After Deployment");
    const instance = await contract.deployed();
    const address = instance.address;
    console.log("\x1b[33m%s\x1b[0m", `-> Contract deployed at: ${address}`);
    console.log("\x1b[35m%s\x1b[m", "-> Preparing MongoDB update.");

    // Load the contract artifact to get ABI and bytecode
    const contractPath = path.join(__dirname, `../build/contracts/${ContractName}.json`);
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Extract necessary contract data
    const { contractName, abi, bytecode, sourcePath } = contractData;

    // Create and return the contract document
    return {
        address: address,
        timestamp: new Date(),
        contractName: contractName,
        abi: abi,
        bytecode: bytecode,
        sourcePath: sourcePath,
        network: network,
    };
}

// MongoDB update function
async function updateContractToMongoDB(contractDocument) {
    const dbName = "contract_db";
    const collectionName = "deployment"; // MongoDB collection name

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
            { address: contractDocument.address },
            { $set: contractDocument },
            { upsert: true }
        );
        console.log(`Contract data for ${contractDocument.contractName} updated in MongoDB`);

        // Close MongoDB connection
        await client.close();
        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Error updating contract in MongoDB:", error);
    }
}

// Export the functions for use in other files
module.exports = { createDocument, updateContractToMongoDB };
