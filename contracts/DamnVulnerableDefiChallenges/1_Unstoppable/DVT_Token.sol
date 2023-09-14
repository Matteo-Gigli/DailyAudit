//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

pragma solidity ^0.8.19;

contract DVT_Token is ERC20("Damn Vunerable Token", "DTV"){


    constructor(){
        _mint(msg.sender, 1000000e18);
    }

}
