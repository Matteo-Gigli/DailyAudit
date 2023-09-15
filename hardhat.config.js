require("@nomiclabs/hardhat-ethers");
require("dotenv").config();


module.exports = {
  solidity: "0.8.19",
  networks:{
    hardhat:{}
  }
};



// Use this For:
// DamnVulnerableDefi/1_Unstoppable

//module.exports = {
//  solidity: "0.8.19",
//  networks:{
//    hardhat:{
//      mining: {
//        auto: false,
//        interval: 10000,
//      },
//      forking:{
//        url: process.env.ALCHEMY_URL_MAINNETT,
//        blockNumber: 15969633,
//      }
//    }
//  }
//};
