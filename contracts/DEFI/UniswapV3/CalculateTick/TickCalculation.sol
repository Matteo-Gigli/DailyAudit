//SPDX-License-Identifier: MIT

import '@uniswap/v3-core/contracts/libraries/TickMath.sol';

pragma solidity =0.7.6;

contract TickCalculation{


    function calculateNewTick(uint160 sqrty)public pure returns(int24,int24){
        int24 tickOld = TickMath.getTickAtSqrtRatio(sqrty);
        uint160 percentOfSqrty = sqrty * 10 / 1000; // 0.1%


        if(tickOld < 0){
            uint160 minTick = sqrty - percentOfSqrty;
            uint160 maxTick = sqrty + percentOfSqrty;
            int24 tick = TickMath.getTickAtSqrtRatio(minTick);
            int24 tick2 = TickMath.getTickAtSqrtRatio(maxTick);
            return(tick,tick2);
        }
        else{
            uint160 minTick = sqrty - percentOfSqrty;
            uint160 maxTick = sqrty + percentOfSqrty;
            int24 tick = TickMath.getTickAtSqrtRatio(minTick);
            int24 tick2 = TickMath.getTickAtSqrtRatio(maxTick);
            return(tick,tick2);
        }
    }




    function getSqrt(int24 tick)public pure returns(int160){
        int160 newTickAtSqrt = int160(TickMath.getSqrtRatioAtTick(tick));
        return newTickAtSqrt;
    }

}
