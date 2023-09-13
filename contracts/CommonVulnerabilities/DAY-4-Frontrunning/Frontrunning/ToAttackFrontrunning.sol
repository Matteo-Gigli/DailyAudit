//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.19;

contract ToAttackFrontrunning {

    bytes32 public rightHash = 0x50617373776f7264000000000000000000000000000000000000000000000000;
    bool alreadyFund = false;

    constructor()payable{

    }

    function setResponse(string memory _yourAnswer)public{
        require(rightHash == bytes32(abi.encodePacked(_yourAnswer)), "Wrong Answer!");
        require(!alreadyFund, "Already Fund");
        alreadyFund = true;
        (bool result,) = msg.sender.call{value: address(this).balance}("");
        require(result, "Tx Failed!");
    }


    receive()external payable{}
}
