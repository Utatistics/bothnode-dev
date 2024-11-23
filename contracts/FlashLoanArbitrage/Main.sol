// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

//import "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // Import Ownable for access control

import "./CompoundInterface.sol";
import "./OokiDAO.sol";
import "./UniswapInterface.sol";

contract FlashLoanArbitrage {
    event LogPoolAddress(address poolAddress);
    address payable owner;

    IPool public POOL;
    CompoundInteraction public compound;
    OokiDAOInteraction public ookidao;
    UniswapInteraction public uniswap;
    
    constructor(
        /* Smart contract address */
        // Aave (i.e flashloan provider)
        address _poolAddressesProvider,
        
        // Compund (i.e. lending and burrowing)
        address _comptrollerAddress,
        address payable _cEthAddress,
        address _cWBTCAddress,
 
        // OokiDAO (i.e. leveraged short position) 
        address _bzxAddress,
        
        // Uniswap (i.e. currency swap)
        address _swapRouterAddress,  // multiple versions 
        
        // ERC20 token address
        address _wbtcAddress,
        address _wethAddress // WETH9

    )
    {
        owner = payable(msg.sender); // who called this constructor?

        IPoolAddressesProvider provider = IPoolAddressesProvider(_poolAddressesProvider);
        POOL = IPool(provider.getPool());  // Initialize the POOL contract

        compound = new CompoundInteraction(_comptrollerAddress, _cEthAddress, _cWBTCAddress);
        ookidao = new OokiDAOInteraction(_bzxAddress, _cEthAddress, _wbtcAddress);
        uniswap = new UniswapInteraction(_swapRouterAddress, _wbtcAddress, _wethAddress);
    }
    
    event FlashLoanStatus(
        string status
    );

    event FlashLoanExecuted(
        address indexed initiator,
        uint256 wbtcBurrowAmount,
        uint256 repayAmount
    );

     // New function to retrieve the POOL address
    function getPoolAddress() public view returns (address) {
        return address(POOL);
    }

    // Emdpoint function to execute flash loan
    function executeFlashLoan(
        address[] calldata assets,
        uint256[] calldata flashLoanAmounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params
    ) external {

        // Initiate the flash loan
        emit FlashLoanStatus("Initiating flashloan...");
        POOL.flashLoan(address(this), assets, flashLoanAmounts, modes, onBehalfOf, params, 0);
        emit FlashLoanStatus("Initiatiated flashloan.");
    }

    // Internal function to repay flash loan
    function _repayFlashLoan(address asset, uint256 repayAmount) internal {
        // Approve the lending pool to pull the repayment
        IERC20(asset).approve(address(POOL), repayAmount);

        // POOL will automatically pull the repayment from the contract once approved
    }

    // This function will be called by Aave once the flash loan is granted    
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        // Step 1: Decode the parameters
        uint256 repayAmount = amounts[0] + premiums[0];  // Loan amount + fees
        /*
        (uint256 etAsCollateralAmount, uint256 ethAmShortAmount, uint256 leverage) = abi.decode(params, (uint256, uint256, uint256));
        etAsCollateralAmount = etAsCollateralAmount * 1 ether;
        ethAmShortAmount = ethAmShortAmount * 1 ether;

        // Step 2: Supply ETH as collateral and borrow WBTC from Compound
        uint256 wbtcBurrowAmount = compound.supplyETHAndBorrowWBTC(etAsCollateralAmount);

        // Step 3: Open short position on OokiDAO
        ookidao.openShortPosition(ethAmShortAmount, leverage);

        // Step 4: Swap WBTC for ETH via Uniswap
        uniswap.swapWbtcForEth(wbtcBurrowAmount);
        */

        // Step 5: Repay flash loan
        _repayFlashLoan(assets[0], repayAmount);

        // Emit the event for tracking
        // emit FlashLoanExecuted(initiator, wbtcBurrowAmount, repayAmount);

        return true;
    }
    
    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this funciton");
        _;
    }

    receive () external payable {}
}

