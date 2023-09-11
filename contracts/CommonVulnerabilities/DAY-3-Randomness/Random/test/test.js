const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Random Attack", function(){

    let owner, account1, account2, account3, hacker,
        ToAttackRandom, toAttackRandom, AttackerRandom, attackerRandom;


    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();

        ToAttackRandom = await ethers.getContractFactory("ToAttackRandom");
        toAttackRandom = await ToAttackRandom.deploy(owner.address);
        await toAttackRandom.deployed();


        AttackerRandom = await ethers.getContractFactory("AttackerRandom");
        attackerRandom = await AttackerRandom.connect(hacker).deploy(toAttackRandom.address);
        await attackerRandom.deployed();


        await owner.sendTransaction({to:toAttackRandom.address, value:ethers.utils.parseEther("150")});


        let toAttackRandomBalance = await ethers.provider.getBalance(toAttackRandom.address);

        console.log("To Attack Random Balance", (toAttackRandomBalance/10**18).toString(), "ether");
        console.log("");
    });


    it("Exploit", async()=>{

        let hackerBalanceBeforeAttack = await ethers.provider.getBalance(hacker.address);

        console.log("Hacker Balance Before Attack", (hackerBalanceBeforeAttack/10**18).toString(), "ether");
        console.log("");

        await attackerRandom.connect(hacker).getNumberAndCall();

        let hackerBalanceAfterAttack = await ethers.provider.getBalance(hacker.address);

        console.log("Hacker Balance After Attack", (hackerBalanceAfterAttack/10**18).toString(), "ether");
        console.log("");
    });
})