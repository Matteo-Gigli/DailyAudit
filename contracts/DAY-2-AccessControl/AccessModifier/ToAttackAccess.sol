//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

contract ToAttackAccess {

    address public owner;

    modifier onlyOwner(){
        msg.sender == owner;
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
    //  1) modifier onlyOwner() isn't good.
    //      Giving the owner "access" to everyone is sending a transaction.
    //      Instead we should write:
    //        modifier onlyOwner(){
    //            require(msg.sender == owner, "Caller is not the owner");
    //            _;
    //        }


    function withdraw()public onlyOwner{
        (bool result,) = msg.sender.call{value: address(this).balance}("");
        require(result, "Tx Failed!");
    }



    receive()external payable{}
}
