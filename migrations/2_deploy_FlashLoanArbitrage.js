const FlashLoanArbitrage = artifacts.require("FlashLoanArbitrage");

module.exports = async function(deployer, network, accounts) {
    const _poolAddressesProvider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
    const _comptrollerAddress = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
    const _cEthAddress = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
    const _cWBTCAddress = "0xC11b1268C1A384e55C48c2391d8d480264A3A7F4";
    const _bzxAddress = "0xD8Ee69652E4e4838f2531732a46d1f7F584F0b7f";
    const _swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    const _wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const _wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    
    console.log("\x1b[35m%s\x1b[m", "->Starting deployment of FlashLoanArbitrage...");

    const FlashLoanArbitrage = artifacts.require("FlashLoanArbitrage");

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
        console.log(`Contract deployed at: ${instance.address}`);

        // Fetch all events emitted during the constructor
        const events = await instance.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        events.forEach(event => {
            console.log(`Event: ${event.event}, Args: ${JSON.stringify(event.returnValues)}`);
        });
    } catch (error) {
        console.log("\x1b[35m%s\x1b[m", "->Message at catch block...");
        console.error("-> Deployment failed:", error);
    }
};
