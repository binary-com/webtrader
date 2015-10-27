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
function validateParameters(instrumentObject) {
      var instrumentCode_param = getParameterByName('instrument');
      var timePeriod_param = getParameterByName('timePeriod');

      if (!instrumentCode_param || !timePeriod_param) return false;

      var timePeriod_Obj = null;
      try {
        timePeriod_Obj = convertToTimeperiodObject(timePeriod_param);
      } catch(e) {}
      if (!timePeriod_Obj) return false;

      var isValidTickTF = timePeriod_Obj.suffix() == 't' && timePeriod_Obj.intValue() == 1;
      var isValidMinTF = timePeriod_Obj.suffix().indexOf('m') != -1 && timePeriod_Obj.intValue() >= 1 && timePeriod_Obj.intValue() <= 59;
      var isValidHourTF = timePeriod_Obj.suffix().indexOf('h') != -1 && timePeriod_Obj.intValue() >= 1 && timePeriod_Obj.intValue() <= 23;
      var isValidDayTF = timePeriod_Obj.suffix().indexOf('d') != -1 && timePeriod_Obj.intValue() >= 1 && timePeriod_Obj.intValue() <= 3;
      return isValidTickTF || isValidMinTF || isValidHourTF || isValidDayTF;
};

// adds onload support for asynchronous stylesheets loaded with loadCSS.
function onloadCSS( ss, callback ) {
    ss.onload = function() {
        ss.onload = null;
        if( callback ) {
            callback.call( ss );
        }
    };

    // This code is for browsers that don’t support onload, any browser that
    // supports onload should use that instead.
    // No support for onload:
    //  * Android 4.3 (Samsung Galaxy S4, Browserstack)
    //  * Android 4.2 Browser (Samsung Galaxy SIII Mini GT-I8200L)
    //  * Android 2.3 (Pantech Burst P9070)

    // Weak inference targets Android < 4.4
    if( "isApplicationInstalled" in navigator && "onloadcssdefined" in ss ) {
        ss.onloadcssdefined( callback );
    }
}

/* example: load_ondemand(li,'click','tradingtimes/tradingtimes',callback) */
function load_ondemand(element, event_name,msg, module_name, callback) {
    element.one(event_name, function () {
        require([module_name], function (module) {
            require(["jquery", "jquery-growl"], function($) {
                $.growl.notice({ message: msg });
            });
            
            callback && callback(module);
        });
    });
}

function resizeElement(selector) {
  $(selector).height($(window).height() - 10).width($(window).width() - 10);
};
