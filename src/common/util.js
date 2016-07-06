/**
 * Created by arnab on 2/12/15.
 */

function isTick(ohlc) {
    return ohlc.indexOf('t') != -1;
}

function isMinute(ohlc) {
    return ohlc.indexOf('m') != -1;
}

function isHourly(ohlc) {
    return ohlc.indexOf('h') != -1;
}

function isDaily(ohlc) {
    return ohlc.indexOf('d') != -1;
}

function isDotType(type) {
    return type === 'dot';
}

function isLineDotType(type) {
    return type === 'linedot';
}


function convertToTimeperiodObject(timePeriodInStringFormat) {
    return {
        intValue : function() {
            return parseInt(timePeriodInStringFormat.toLowerCase().replace("t", "").replace("h", "").replace("d", "").trim())
        },
        suffix : function() {
            return timePeriodInStringFormat.toLowerCase().replace("" + this.intValue(), "").trim().charAt(0);
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

function isDataTypeClosePriceOnly( type ) {
    return !(type === 'candlestick' || type === 'ohlc')
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

/**
    This method can be used to retrieve any property of an object by its name. Does not matter how deep
    the property might be in the passed object. This is a recurrsive function to find the target property
**/
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

/**
    Currently this is being used to validate the parameters passed by affilates/external applications
    It will validate instrument and timePeriod passed in URL
**/
function validateParameters() {
      var instrumentCode_param = getParameterByName('instrument');
      var timePeriod_param = getParameterByName('timePeriod');

      if (!instrumentCode_param || !timePeriod_param) return false;

      var timePeriod_Obj = null;
      try {
          timePeriod_Obj = convertToTimeperiodObject(timePeriod_param);
          console.log('timePeriod param : ', timePeriod_param, ", intValue : ", timePeriod_Obj.intValue(), ", suffix : ", timePeriod_Obj.suffix());
      } catch(e) {}
      if (!timePeriod_Obj) return false;

      var isValidTickTF = timePeriod_Obj.suffix() === 't' && timePeriod_Obj.intValue() === 1;
      var isValidMinTF = timePeriod_Obj.suffix().indexOf('m') != -1 &&  [1,2,3,5,10,15,30].indexOf(timePeriod_Obj.intValue()) != -1;
      var isValidHourTF = timePeriod_Obj.suffix().indexOf('h') != -1 && [1,2,4,8].indexOf(timePeriod_Obj.intValue()) != -1;
      var isValidDayTF = timePeriod_Obj.suffix().indexOf('d') != -1 && timePeriod_Obj.intValue() === 1;
      console.log('isValidTickTF : ', isValidTickTF, ', isValidMinTF : ', isValidMinTF, ', isValidHourTF : ', isValidHourTF, ', isValidDayTF : ', isValidDayTF);
      return isValidTickTF || isValidMinTF || isValidHourTF || isValidDayTF;
}

/* convert epoch to stirng yyyy-mm-dd hh:mm:ss format
   options: { utc: true/false } */
function epoch_to_string(epoch, options) {
    var prefix = (options && options.utc) ? "getUTC" : "get"; // Local or UTC time
    var d = new Date(epoch * 1000); /* since unixEpoch is simply epoch / 1000, we  multiply the argument by 1000 */
     return d[prefix + "FullYear"]() + "-" +
            ("00" + (d[prefix+ "Month"]() + 1)).slice(-2) + "-" +
            ("00" + d[prefix+ "Date"]()).slice(-2) + " " +
            ("00" + d[prefix+ "Hours"]()).slice(-2) + ":" +
            ("00" + d[prefix+ "Minutes"]()).slice(-2) + ":" +
            ("00" + d[prefix+ "Seconds"]()).slice(-2);
}

/* convert string in '2015-11-9' format to epoch
   options: { utc: true/false } */
function yyyy_mm_dd_to_epoch(yyyy_mm_dd, options) {
    var ymd = yyyy_mm_dd.split('-'),
        y = ymd[0] * 1,
        m = ymd[1] * 1,
        d = ymd[2] * 1;
    if (options && options.utc)
        return Date.UTC(y, m - 1, d) / 1000;
    return new Date(y, m - 1, d).getTime() / 1000;
}

/* format the number (1,234,567.89), source: http://stackoverflow.com/questions/2254185 */
function formatPrice(float) {
    return (float * 1).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function sortAlphaNum(property) {
    'use strict';
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;

    return function(a, b) {
        var aA = a[property].replace(reA, "");
        var bA = b[property].replace(reA, "");
        if(aA === bA) {
            var aN = parseInt(a[property].replace(reN, ""), 10);
            var bN = parseInt(b[property].replace(reN, ""), 10);
            return aN === bN ? 0 : aN > bN ? 1 : -1;
        } else {
            return aA > bA ? 1 : -1;
        }
    };
}

/**
 * Reduces decimal places
 * @param value
 * @param precision
 * @returns Number
 */
function toFixed(value, precision) {
    if ($.isNumeric(value)) {
        value = Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    }
    return value;
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/**
 * window.setTimeout alternative.
 * window.setTimeout is 32 bit and so large value does not work
 * http://stackoverflow.com/questions/16314750/settimeout-fires-immediately-if-the-delay-more-than-2147483648-milliseconds
 * @param callback
 * @param timeout_ms
 * @param _callBackWithHandler
 */
function setLongTimeout(callback, timeout_ms, _callBackWithHandler) {

    //if we have to wait more than max time, need to recursively call this function again
    if(timeout_ms > 2147483647)
    {    //now wait until the max wait time passes then call this function again with
        //requested wait - max wait we just did, make sure and pass callback
        var handle = setTimeout(function() {
            setLongTimeout(callback, (timeout_ms - 2147483647), _callBackWithHandler);
        }, 2147483647);
        _callBackWithHandler(handle);
    }
    else  //if we are asking to wait less than max, finally just do regular seTimeout and call callback
    {
        var handle = setTimeout(callback, timeout_ms);
        if (_callBackWithHandler) {
            _callBackWithHandler(handle);
        }
    }
}

/* source: http://stackoverflow.com/questions/46155 */
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

/* are we in webtrader.binary.com or webtrader.binary.com/beta */
var is_beta = (function() {
  var _is_beta_ = window.location.href.indexOf('/beta') !== -1;
  return function() {
    return _is_beta_;
  };
})();

/* simple localStorage cache to differentiate between live and beta */
var local_storage = {
  get: function(name){
    name = '_webtrader_' + name + (is_beta() ? '_beta' : '_live');
    var ret = localStorage.getItem(name);
    return ret && JSON.parse(ret);
  },
  set: function(name, obj){
    name = '_webtrader_' + name + (is_beta() ? '_beta' : '_live');
    return localStorage.setItem(name, JSON.stringify(obj));
  },
  remove: function(name) {
    name = '_webtrader_' + name + (is_beta() ? '_beta' : '_live');
    return localStorage.removeItem(name);
  }
}
