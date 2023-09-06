//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

contract ToAttack {

    address public owner;

    mapping(address=>uint256)public balances;

    constructor(address _owner){
        owner = _owner;
    }



    function deposit()external payable{
        require(msg.value > 0, "0 deposit is not allowed!");
        balances[msg.sender] += msg.value;
        payable(address(this)).transfer(msg.value);
    }



    //Reentrancy on this functions
    //Problems:
    //  1) Doesn't follow CEI patterns(Check-Effects-Interaction)
    //      balances is upgrade after the low-level call
    //  2) Doesn't check the return value of a low level call

    function withdraw()public{
        require(balances[msg.sender] > 0, "Nothing to withdraw");
        msg.sender.call{value: balances[msg.sender]}("");
        balances[msg.sender] = 0;
    }



    receive()external payable{}
}
