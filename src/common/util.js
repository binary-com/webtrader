/**
 * Created by arnab on 2/12/15.
 */

function isTick(ohlc)
{
    return ohlc.indexOf('t') != -1;
}

function isMinute(ohlc)
{
    return ohlc.indexOf('m') != -1;
}

function isHourly(ohlc)
{
    return ohlc.indexOf('h') != -1;
}

function isDaily(ohlc)
{
    return ohlc.indexOf('d') != -1;
}

function convertToTimeperiodObject(timeperiodInStringFormat)
{
    return {
        intValue : function() {
            return parseInt(timeperiodInStringFormat.replace("t", "").replace("h", "").replace("d", "").trim())
        },
        suffix : function() {
            return timeperiodInStringFormat.replace("" + this.intValue(), "").trim().charAt(0);
        },
        timeInMillis : function() {
            var val = 0;
            switch (this.suffix())
            {
                case 't' : val = 0; break;//There is no time in millis for ticks
                case 'm' : val = this.intValue() * 60 * 1000; break;
                case 'h' : val = this.intValue() * 60 * 60 * 1000; break;
                case 'd' : val = this.intValue() * 24 * 60 * 60 * 1000; break;
            }
            return val;
        },
        timeInSeconds : function() {
            return this.timeInMillis() / 1000;
        },
        humanReadableString : function() {
            var val = '';
            switch (this.suffix())
            {
                case 't' : val = 'tick'; break;
                case 'm' : val = 'minute(s)'; break;
                case 'h' : val = 'hour(s)'; break;
                case 'd' : val = 'day(s)'; break;
            }
            return this.intValue() + " " + val;
        }
    }
}

function isDataTypeClosePriceOnly( type )
{
    return !(type == 'candlestick' || type == 'ohlc')
}
