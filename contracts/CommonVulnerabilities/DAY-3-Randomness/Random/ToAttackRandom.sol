//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

contract ToAttackRandom {

    uint numberToGuess = 0;
    address owner;

    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }


    constructor(address _owner){
        owner = _owner;
    }



    //Generation of random number in solidity is impossible.
    function claimReward(uint yourNumber)public{
        numberToGuess = uint(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));

        if(yourNumber == numberToGuess){
            payable(msg.sender).transfer(address(this).balance);
        }else{
            revert("No Right Number!");
        }
    }


    receive()external payable{}
}
