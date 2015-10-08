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

function isSmallView() {
  var ret = false;
  if(Modernizr) {
    if (Modernizr.mq("all and (max-width: 600px)") || Modernizr.mq("all and (max-device-width: 600px)")) {
      ret = true;
    }
  }
  return ret;
}

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}
