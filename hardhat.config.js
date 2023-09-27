require("@nomiclabs/hardhat-ethers");
require("dotenv").config();


//module.exports = {
//  solidity: {
//     compilers: [
//         {version: "0.8.18"},{version: "0.8.10"}, {version: "0.8.4"}, {version: "0.4.24"},
//         {version: "0.8.7"}, {version: "0.8.13"}, {version: "0.7.0"}, {version: "0.8.19"},
//         {version: "0.6.0"}, {version: "0.6.12"}, {version: "0.5.12"}, {version: "0.7.6"}
//     ],
//   },
//  networks:{
//    hardhat:{}
//  }
//};



// Use this For:
// DamnVulnerableDefi/1_Unstoppable
// DamnVulnerableDefi/6_Puppet

module.exports = {
  solidity: {
    compilers: [
        {version: "0.8.18"},{version: "0.8.10"}, {version: "0.8.4"}, {version: "0.4.24"},
        {version: "0.8.7"}, {version: "0.8.13"}, {version: "0.7.0"}, {version: "0.8.19"},
        {version: "0.6.0"}, {version: "0.6.12"}, {version: "0.5.12"}, {version: "0.7.6"},
        {version: "0.6.6"}, {version: "0.8.0"},
    ],
  },
  networks:{
    hardhat:{
      //mining: {
      //  auto: false,
      //  interval: 10000,
      //},
      forking:{
        url: process.env.ALCHEMY_URL_MAINNETT,
        //blockNumber: 15969633,
      }
    }
  }
};
