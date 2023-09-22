const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");
const factoryUniswapABI = require("../UniswapABI/UniswapV1Factory.json");
const exchangeUniswapABI = require("../UniswapABI/UniswapV1Exchange.json");


describe("Puppet Damn Vulnerable DEFI", function(){


    const DVTAmountInUniswapV1Exchange = 10n * (10n**18n);
    const EtherAmountInUniswapV1Exchange = 10n * (10n**18n);

    const amountDVTHacker = 1000n * (10n**18n);

    const amountDVTPuppetPool = 100000n * (10n**18n);


    let owner, account1, account2, account3, hacker,
        PuppetPool, puppetPool, DVT, dvt, uniswapExchange, AttackPuppet, attackPuppet;

    let FactoryV1;
    let ExchangeV1;

    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();

        //Deploy DamnValuableToken
        DVT = await ethers.getContractFactory("DamnValuableToken");
        dvt = await DVT.deploy();
        await dvt.deployed();

        //Create 2 uniswapV1 base contract for exchange and factory, from the abi and bytecode
        const ExchangeV1Contract = new ethers.ContractFactory(exchangeUniswapABI.abi, exchangeUniswapABI.evm.bytecode, owner);
        const FactoryV1Contract = new ethers.ContractFactory(factoryUniswapABI.abi, factoryUniswapABI.evm.bytecode, owner);

        //Deploy exchange and factory contracts
        FactoryV1 = await FactoryV1Contract.deploy();
        ExchangeV1 = await ExchangeV1Contract.deploy();

        //Initialize the Factory with the Exchange Address
        await FactoryV1.initializeFactory(ExchangeV1.address);

        //Create Pair on UniswapV1
        let pair = await FactoryV1.createExchange(dvt.address, {gasLimit:350000});
        const { events } = await pair.wait();


        //Pair Contract on UniswapV1
        uniswapExchange = await ExchangeV1Contract.attach(events[0].args.exchange);
        console.log("Uniswap V1 Exchange Address:", uniswapExchange.address);


        //Approve and send ether to the exchangeAddress
        await dvt.approve(uniswapExchange.address, DVTAmountInUniswapV1Exchange);

        //Add Liquidity To the UniswapV1 Pool
        await uniswapExchange.addLiquidity(
            0,
            DVTAmountInUniswapV1Exchange,
            (await ethers.provider.getBlock('latest')).timestamp * 5,
            {value: EtherAmountInUniswapV1Exchange, gasLimit: 1e6}
        );


        let DVTBalanceInUniswapV1Exchange = await dvt.balanceOf(uniswapExchange.address);
        let EtherBalanceInUniswapV1Exchange = await ethers.provider.getBalance(uniswapExchange.address);

        console.log("DVT Liquidity in UniswapV1 Exchange:", (DVTBalanceInUniswapV1Exchange/10**18).toString(), "DVT");
        console.log("Ether Liquidity in UniswapV1 Exchange:", (EtherBalanceInUniswapV1Exchange/10**18).toString(), "ETH");
        console.log("");


        //Send 1000 DVT to Hacker Address
        await dvt.transfer(hacker.address, amountDVTHacker);
        let hackerDVTBalance = await dvt.balanceOf(hacker.address);
        console.log("Hacker DVT Balance:", (hackerDVTBalance/10**18).toString(), "DVT");
        console.log("");


        //Deploy Puppet Pool
        PuppetPool = await ethers.getContractFactory("PuppetPool");
        puppetPool = await PuppetPool.deploy(dvt.address, uniswapExchange.address);
        await puppetPool.deployed();


        await dvt.transfer(puppetPool.address, amountDVTPuppetPool);



        //Deploy Hacker Contract
        AttackPuppet = await ethers.getContractFactory("AttackPuppet");

        attackPuppet = await AttackPuppet.connect(hacker).deploy(
            puppetPool.address,
            dvt.address,
            uniswapExchange.address
        );
        await attackPuppet.deployed();

    });




    // Hacker start with 25 ethers
    it("Exploit",async()=>{

        //Send 25 Ether and 1000 DVT Tokens to the Attacker Contract
        await hacker.sendTransaction({to:attackPuppet.address, value: ethers.utils.parseEther("25")});
        await dvt.connect(hacker).transfer(attackPuppet.address, amountDVTHacker);

        let hackerDVTBalanceBeforeExploit = await dvt.balanceOf(hacker.address);
        console.log("Hacker DVT Balance Before Exploit:", (hackerDVTBalanceBeforeExploit/10**18).toString(), "DVT");

        //Exploit
        await attackPuppet.connect(hacker).callSwap();

        let hackerDVTBalanceAfterExploit = await dvt.balanceOf(hacker.address);
        console.log("Hacker DVT Balance After Exploit:", (hackerDVTBalanceAfterExploit/10**18).toString(), "DVT");

    });
})