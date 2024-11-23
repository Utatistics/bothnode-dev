const { createDocument, updateContractToMongoDB } = require('./db_util')

module.exports = async function(deployer, network, accounts) {
    const ContractName = "FlashLoan"
    const FlashLoan = artifacts.require(ContractName);

    const _poolAddressesProvider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
    
    // Deploy the Displacement contract with constructor arguments: agentAddress and attackerAddress
    try {
        console.log("\x1b[35m%s\x1b[m", "->Before Deployment");
        await deployer.deploy(FlashLoan, _poolAddressesProvider);

        /** Post deployment */
        // Skip MongoDB update if fork network
        if (network.includes("fork")) {
            console.log("\x1b[35m%s\x1b[m", "-> Dry-run simulation: Skipping MongoDB update.");
        }
        else {
            const document = await createDocument(FlashLoan, ContractName, network);
            await updateContractToMongoDB(document);    
        }

} catch (error) {
    console.log("\x1b[35m%s\x1b[m", "->Message at catch block...");
    console.error("-> Deployment failed:", error);
}
 
};

