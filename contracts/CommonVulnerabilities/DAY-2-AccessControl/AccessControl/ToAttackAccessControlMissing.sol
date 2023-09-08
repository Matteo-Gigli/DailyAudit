//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

contract ToAttackAccessControlMissing {

    address public owner;

    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the Owner");
        _;
    }


    constructor(address _owner){
        owner = _owner;
    }



    function donate()external payable{
        require(msg.value > 0, "0 deposit is not allowed!");
    }



    //Access-Control Problem here.
    //Problem:
    //  1) missing modifier to this function can permit to everyone drain the contract

    function withdraw()public{
        (bool result,) = msg.sender.call{value: address(this).balance}("");
        require(result, "Tx Failed!");
    }



    receive()external payable{}
}
