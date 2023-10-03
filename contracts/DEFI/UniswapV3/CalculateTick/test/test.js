const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");

const uniswapV3FactoryABI = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json").abi
const uniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json").abi


describe("UniswapV3 Tick Calculation", function(){

    let owner, TickCalculation, tickCalc, factoryV3, WETH_WBTC, WETH_DAI;

    let uniswapV3FactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

    let WETHContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    let WBTCContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    let DAIContractAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    let WETH_WBTC_Pool_Address = "0xCBCdF9626bC03E24f779434178A73a0B4bad62eD";
    let WETH_DAI_Pool_Address = "0x60594a405d53811d3BC4766596EFD80fd545A270";


    before(async()=>{

        [owner] = await ethers.getSigners();


        TickCalculation = await ethers.getContractFactory("TickCalculation");
        tickCalc = await TickCalculation.deploy()
        await tickCalc.deployed();

        factoryV3 = await ethers.getContractAt(uniswapV3FactoryABI, uniswapV3FactoryAddress, owner);

        WETH_WBTC_Pool_Address = await factoryV3.getPool(WETHContractAddress, WBTCContractAddress, 500);
        WETH_DAI_Pool_Address = await factoryV3.getPool(WETHContractAddress, DAIContractAddress, 500);

        WETH_WBTC = await ethers.getContractAt(uniswapV3PoolABI, WETH_WBTC_Pool_Address, owner);
        WETH_DAI = await ethers.getContractAt(uniswapV3PoolABI, WETH_DAI_Pool_Address, owner);
        console.log("");
    });



    it("WBTC/WETH Pool ActualTick, minTick, maxTick and Prices range",async()=>{

        let [sqrtPriceX96, actualTick] = await WETH_WBTC.slot0();
        console.log(`WBTC/WETH Pool actual sqrtPriceX96: ${sqrtPriceX96}, and actual Tick: ${actualTick}`);
        console.log("");


        let[minTick, maxTick] = await tickCalc.calculateNewTick(sqrtPriceX96);
        console.log("MinTick Modified WBTC/WETH Pool:", minTick);
        console.log("MaxTick Modified WBTC/WETH Pool:", maxTick);
        console.log();


        let minSqrtPriceX96 = await tickCalc.getSqrt(minTick);
        let maxSqrtPriceX96 = await tickCalc.getSqrt(maxTick);
        console.log("Min SqrtPriceX96:", minSqrtPriceX96.toString());
        console.log("Max SqrtPriceX96:", maxSqrtPriceX96.toString());
        console.log("");

        //Now formula to check prices of the ticks, is the following:

        //WBTC/WETH Pool 0.05% fee
        //WBTC = token0
        //WETH = token1


        //Check MinTick Price, Do calc on python


        //Amount of tokens1(WETH 18 decimals) necessary to buy 1 tokens0(WBTC 8 decimals)
        //We need to sub decimals

        //calc = (minSqrtPriceX96**2) / (2**192) / (10**10)


        //Now to know the amount of tokens0(WBTC) necessary to buy 1 Tokens1(WETH)
        //AmountWbtcToBuyWeth = 1 / calc


        //Do the same calc for the maxSqrtPriceX96 to know the maxTick Price

        //Go on https://app.uniswap.org/swap to check result for pair
        //Result might be different from the following calculation explain;
    });




    it("DAI/WETH Pool ActualTick, minTick, maxTick and Prices range",async()=>{

        let [sqrtPriceX96, actualTick] = await WETH_DAI.slot0();
        console.log(`DAI/WETH Pool actual sqrtPriceX96: ${sqrtPriceX96}, and actual Tick: ${actualTick}`);
        console.log("");


        let[minTick, maxTick] = await tickCalc.calculateNewTick(sqrtPriceX96);
        console.log("MinTick Modified DAI/WETH Pool:", minTick);
        console.log("MaxTick Modified DAI/WETH Pool:", maxTick);
        console.log();


        let minSqrtPriceX96 = await tickCalc.getSqrt(minTick);
        let maxSqrtPriceX96 = await tickCalc.getSqrt(maxTick);
        console.log("Min SqrtPriceX96:", minSqrtPriceX96.toString());
        console.log("Max SqrtPriceX96:", maxSqrtPriceX96.toString());


        //Now formula to check prices of the tick, is the following:

        //DAI/WETH Pool 0.05% fee
        //DAI = token0
        //WETH = token1


        //Check MinTick Price


        //Amount of tokens1(WETH 18 decimals) necessary to buy 1 tokens0(DAI 18 decimals)

        //calc = (minSqrtPriceX96**2) / (2**192)


        //Now to know the amount of tokens0(DAI) necessary to buy 1 Tokens1(WETH)
        //AmountWbtcToBuyWeth = 1 / calc


        //Do the same calc for the maxSqrtPriceX96 to know the maxTick Price


        //Go on https://app.uniswap.org/swap to check result for pair
        //Result might be different from the following calculation explain;
    });

})