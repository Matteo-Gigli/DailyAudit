//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

pragma solidity ^0.8.19;

contract DamnValuableToken is ERC20("DamnVulnerableToken", "DTV"){


    constructor(){
        _mint(msg.sender, 10000000e18);
    }

}
