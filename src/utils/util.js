/**
 * Created by arnab on 2/12/15.
 */

function isTick(ohlc) {
    return ohlc == '1t';
}

function isMinute(ohlc) {
    return ohlc.indexOf('m') != -1;
}

function isHourly(ohlc) {
    return ohlc.indexOf('h') != -1;
}
