function isFinancialAccout() {
  if (local_storage.get('authorize')) {
     return /^(MF)/i.test(local_storage.get('authorize').loginid);
  }
  return false
}

function isTick(ohlc) {
    return ohlc.indexOf("t") !== -1;
}

function isDotType(type) {
    return type === "dot";
}

function isLineDotType(type) {
    return type === "linedot";
}

function convertToTimeperiodObject(timePeriodInStringFormat) {
    return {
        intValue : function() {
            return parseInt(timePeriodInStringFormat.toLowerCase().replace("t", "").replace("h", "").replace("d", "").trim());
        },
        suffix : function() {
            return timePeriodInStringFormat.toLowerCase().replace("" + this.intValue(), "").trim().charAt(0);
        },
        timeInMillis : function() {
            var that = this;
            var getTime = {
                t: function() {
                    return 0;
                },
                m: function() {
                    return that.intValue() * 60 * 1000;
                },
                h: function() {
                    return that.intValue() * 60 * 60 * 1000;
                },
                d: function() {
                    return that.intValue() * 24 * 60 * 60 * 1000;
                }
            };

            return getTime[this.suffix()]() || 0;
        },
        timeInSeconds : function() {
            return this.timeInMillis() / 1000;
        },
        humanReadableString : function() {
            var str = {
                "t": "tick",
                "m": "minute(s)",
                "h": "hour(s)",
                "d": "day(s)"
            };

            return this.intValue() + " " + str[this.suffix()];
        }
    };
}

function isDataTypeClosePriceOnly( type ) {
    return !(type === "candlestick" || type === "ohlc");
}

function isSmallView() {
  var ret = false;
  if(window.Modernizr) {
    if (window.Modernizr.mq("all and (max-width: 600px)") || window.Modernizr.mq("all and (max-device-width: 600px)")) {
      ret = true;
    }
  }
  return ret;
}

/* convert epoch to stirng yyyy-mm-dd hh:mm:ss format
   options: { utc: true/false } */
function epochToString(epoch, options) {
    var prefix = (options && options.utc) ? "getUTC" : "get"; // Local or UTC time
    var d = new Date(epoch * 1000); /* since unixEpoch is simply epoch / 1000, we  multiply the argument by 1000 */
     return d[prefix + "FullYear"]() + "-" +
            ("00" + (d[prefix+ "Month"]() + 1)).slice(-2) + "-" +
            ("00" + d[prefix+ "Date"]()).slice(-2) + " " +
            ("00" + d[prefix+ "Hours"]()).slice(-2) + ":" +
            ("00" + d[prefix+ "Minutes"]()).slice(-2) + ":" +
            ("00" + d[prefix+ "Seconds"]()).slice(-2);
}

/* convert string in "2015-11-9" format to epoch
   options: { utc: true/false } */
function yearMonthDayToEpoch(yyyy_mm_dd, options) {
    var ymd = yyyy_mm_dd.split("-"),
        y = ymd[0] * 1,
        m = ymd[1] * 1,
        d = ymd[2] * 1;
    if (options && options.utc)
        return Date.UTC(y, m - 1, d) / 1000;
    return new Date(y, m - 1, d).getTime() / 1000;
}

/* format the number (1,234,567.89), source: http://stackoverflow.com/questions/2254185 */
function formatPrice(float, currency) {
    currency = (currency || '').toLowerCase().trim();

    if (!!Number(float) === false && Number(float) !== 0) {
        return currency ? "<span class='symbols " +  currency + "'>" + float + "</span>" : float;
    }
    var sign = float < 0 ? '-': '';
    float = float && Math.abs(float);
    var currencies_config = (local_storage.get('currencies_config') || {});
    var minimumFractionDigits = (currencies_config[(currency|| '').toUpperCase()] || {}).fractional_digits || 2;
    var i18n_name = (window.local_storage.get("i18n") || { value: "en" }).value;
	float = new Intl.NumberFormat(i18n_name.replace("_","-"), {
						style: "decimal",
						minimumFractionDigits: minimumFractionDigits,
                    }).format(float);
	if (currency) {
		float = sign + $('<span>', {
            class: 'symbols ' + currency,
            text: float
        })[0].outerHTML;
    }
	return float;
}

function addComma(num, decimal_points, is_crypto) {
    var number = String(num || 0).replace(/,/g, '');
    if (typeof decimal_points !== 'undefined') {
        number = (+number).toFixed(decimal_points);
    }
    if (is_crypto) {
        number = parseFloat(+number);
    }

    return number.toString().replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, '$&,')
    });
};

function getSymbolPipValue(symbol) {
  var active_symbols = local_storage.get('active_symbols');
  var pip_value = 4;
  var selected_symbol = active_symbols.find(function(item) {
    return item.symbol === symbol;
  });

  if (selected_symbol) {
    var symbol_pip = selected_symbol.pip.toString();
    pip_value = symbol_pip.substring(symbol_pip.indexOf(".") + 1).length;
  }

  return pip_value;
};

function sortAlphaNum(property) {
    "use strict";
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
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === "x" ? r : (r&0x3|0x8);
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
    var handle;
    //if we have to wait more than max time, need to recursively call this function again
    if(timeout_ms > 2147483647)
    {    //now wait until the max wait time passes then call this function again with
        //requested wait - max wait we just did, make sure and pass callback
        handle = setTimeout(function() {
            setLongTimeout(callback, (timeout_ms - 2147483647), _callBackWithHandler);
        }, 2147483647);
        _callBackWithHandler(handle);
    }
    else  //if we are asking to wait less than max, finally just do regular seTimeout and call callback
    {
        handle = setTimeout(callback, timeout_ms);
        if (_callBackWithHandler) {
            _callBackWithHandler(handle);
        }
    }
}

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != "undefined"
            ? args[number]
            : match
            ;
    });
};

/* shim for missing functions in IE */
if (typeof String.prototype.startsWith !== "function") {
    String.prototype.startsWith = function (str) {
      return this.lastIndexOf(str, 0) === 0;
    };
    String.prototype.endsWith = function(str) {
        return this.indexOf(str, this.length - str.length) !== -1;
    };
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    "use strict";
    if (typeof start !== "number") {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/) {
    "use strict";
    if (this == null) {
      throw new TypeError("Array.prototype.includes called on null or undefined");
    }

    var O = Object(this);
    var len = parseInt(O.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}
/* are we in webtrader.binary.com or webtrader.binary.com/beta */
var is_beta = (function() {
  var _is_beta_ = window.location.href.indexOf("/beta") !== -1 || window.location.href.indexOf("localhost") !== -1;
  return function() {
    return _is_beta_;
  };
})();

/* simple localStorage cache to differentiate between live and beta */
var local_storage = {
  get: function(name){
    name = "_webtrader_" + name + (is_beta() ? "_beta" : "_live");
    var ret = localStorage.getItem(name);
    return ret && JSON.parse(ret);
  },
  set: function(name, obj){
    name = "_webtrader_" + name + (is_beta() ? "_beta" : "_live");
    return localStorage.setItem(name, JSON.stringify(obj));
  },
  remove: function(name) {
    name = "_webtrader_" + name + (is_beta() ? "_beta" : "_live");
    return localStorage.removeItem(name);
  }
}

function getSupportedLanguages() {
    var SUPPORTED_LANGUAGES = [
        { value: 'en', name: 'English'},
        { value: 'de', name: 'Deutsch'},
        { value: 'es', name: 'Español'},
        { value: 'fr', name: 'Français'},
        // { value: 'id', name: 'Indonesia'},
        { value: 'it', name: 'Italiano'},
        { value: 'pl', name: 'Polish'},
        { value: 'pt', name: 'Português'},
        { value: 'ru', name: 'Русский'},
        { value: 'th', name: 'Thai'},
        { value: 'vi', name: 'Tiếng Việt'},
        { value: 'zh_cn', name: '简体中文'},
        { value: 'zh_tw', name: '繁體中文'}
    ];
    return SUPPORTED_LANGUAGES;
}

function isLangSupported(lang) {
    if (!lang) return false;

    var supported_languages = getSupportedLanguages();
    var is_supported = false;

    supported_languages.map(function(supported_lang) {
        if (supported_lang.value === lang) is_supported = true;
    });

    // support crowdIn translation view for beta
    if (lang === 'ach' && is_beta()) is_supported = true;

    return is_supported;
}

function setLanguage(lang) {
    if (!lang) return false;

    lang = lang.trim().toLowerCase();
    var DEFAULT_LANGUAGE = 'en';

    if (isLangSupported(lang)) {
        local_storage.set('i18n', { value: lang });
        return;
    }
    local_storage.set('i18n', { value: DEFAULT_LANGUAGE });
}

// without refreshing the page
function clearUrlQuerystring(href) {
    if (href) {
        var window_url = new URL(href);
        window_url.search = '';
        window.history.pushState({ path: window_url.href }, '', window_url.href);
    }
}

/**
 * This includes all loginIds, including the disabled accounts too
*/
function loginids() {
  return local_storage.get('authorize').account_list.map(function(parts){
    return {
      id: parts.loginid,
      is_real: parts.is_virtual == 0,
      is_disabled: parts.is_disabled == 1,
      is_mf: /MF/gi.test(parts.loginid),
      is_mlt: /MLT/gi.test(parts.loginid),
      is_mx: /MX/gi.test(parts.loginid),
      is_cr: /CR/gi.test(parts.loginid),
      is_virtual: /VRTC/gi.test(parts.loginid),
    };
  });
}

function oAuthLoginIds() {
  var currencies_config = local_storage.get("currencies_config") || {};
  return (local_storage.get("oauth") || []).map(function(id){
    return {
      id: id.id,
      is_real: !id.is_virtual,
      is_disabled: false,
      is_mf: /MF/gi.test(id.id),
      is_mlt: /MLT/gi.test(id.id),
      is_mx: /MX/gi.test(id.id),
      is_cr: /CR/gi.test(id.id),
      currency: id.currency,
      type: currencies_config[id.currency] ? currencies_config[id.currency].type : ''
    }
  })
}

/* setup translating string literals */
function setupi18nTranslation(dict) {
      var keys = Object.keys(dict).filter(function(key) { return key !== "" && key !== " "; });
      keys = keys.sort(function(a,b){ return b.length - a.length; }) /* match the longes possible substring */
      /* Escape keys for using them in regex. */
      var escaped = keys.map(function(key) { return key.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&"); });
      escaped[0] = /[\?\.]$/.test(escaped[0]) ? escaped[0] + "|" : escaped[0] +"\\b|";
      var regexp = new RegExp ("\\b(" + escaped.reduce(function(a, b){
        return /[\?\.]$/.test(b) ? a + b + "|" : a + b + "\\b|";
      }) + ")", "g");
      var replacer = function (_, word, index, data) {
        return (dict[word] && dict[word][1]) || word;
      };
      String.prototype.i18n = function() {
        return this.replace(regexp, replacer);
      };

      $.fn.i18n = function(){
        localize(this);
        return this;
      }

      function localize(node) {
          if (node && node.className !== undefined && node.className.includes('no-translation')) return;

          var c = node.childNodes ? node.childNodes : node, l = c.length, i;
          for( i=0; i<l; i++) {
              if( c[i].nodeType == 3) {
                if(c[i].textContent){
                  c[i].textContent = c[i].textContent.i18n();
                }
              }
              if( c[i].nodeType == 1) {
                if(c[i].getAttribute("data-balloon")){
                  c[i].setAttribute("data-balloon",c[i].getAttribute("data-balloon").i18n());
                }
                localize(c[i]);
              }
          }
      }

      // Translate main.html
      localize(document.body);
}

function getAppURL() {
  return window.location.href.split("/v")[0];
}

/* type = "text/csv;charset=utf-8;" */
function downloadFileInBrowser(filename, type, content){
            var blob = new Blob([content], { type: type });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, filename);
            }
            else {
                var link = document.createElement("a");
                if (link.download !== undefined) {  /* Evergreen Browsers :) */
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = "hidden";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
}

function guessDigits(prices) {
    var defaultDigits = 0;
    (prices || []).forEach(function(price) {
        var priceStr = (price + "");
        var priceSplitted = priceStr.split(".") || [];
        if (priceSplitted.length > 1) {
            var len = priceSplitted[1].length;
            if ( len > defaultDigits) defaultDigits = len;
        }
    });
    return defaultDigits || 4;
}

function getCurrencyDetail(prop, curr) {
    var currency = (curr || local_storage.get("currency") || '').toUpperCase();
    var config = (local_storage.get('currencies_config') || {})[currency] || {};
    return config[prop];
}

var currencyFractionalDigits = function () {
    return getCurrencyDetail('fractional_digits');
}

var isCryptoCurrency = function (curr) {
    var is_crypto = getCurrencyDetail('type', curr) === 'crypto';
    return is_crypto;
}

function isVirtual() {
    var is_virtual = (local_storage.get('authorize') || '').is_virtual;
    return !!is_virtual;
}

function getBinaryUrl(page) {
    var hostname = new URL(window.location.href).hostname;
    var lang = (local_storage.get('i18n') || {value: 'en'}).value;
    var domain = hostname.includes('binary.me') ? '.me' : '.com';
    var binary_url = 'https://binary' + domain + '/' + lang + '/' + page;

    return binary_url;
}

function moveToDerivUrl() {
  var hostname = new URL(window.location.href).hostname;
  var domain = hostname.includes('binary.me') ? '.me' : '.com';
  var move_to_deriv_url = 'https://binary' + domain + '/move-to-deriv';

  return move_to_deriv_url;
}

function getDerivUrl(page) {
  var hostname = new URL(window.location.href).hostname;
  var lang = (local_storage.get('i18n') || {value: 'en'}).value;
  var domain = hostname.includes('binary.me') ? '.me' : '.com';
  var deriv_url = 'https://deriv' + domain + '/' + lang + '/' + page;

  return deriv_url;
}

function isEuCountry(clients_country, landing_company) {
  var eu_shortcode_regex = new RegExp("^(maltainvest|malta|iom)$");
  var eu_excluded_regex = new RegExp("^mt$");
  var financial_shortcode =
    (landing_company && landing_company.financial_company)
      ? landing_company.financial_company.shortcode
      : "";
  var gaming_shortcode =
    (landing_company && landing_company.gaming_company)
      ? landing_company.gaming_company.shortcode
      : "";

  return financial_shortcode || gaming_shortcode
    ? eu_shortcode_regex.test(financial_shortcode) ||
        eu_shortcode_regex.test(gaming_shortcode)
    : eu_excluded_regex.test(clients_country);
}

function isEuCountrySelected(selected_country) {
  return eu_countries.includes(selected_country)
}

var eu_countries = [
  'it',
  'de',
  'fr',
  'lu',
  'gr',
  'mf',
  'es',
  'sk',
  'lt',
  'nl',
  'at',
  'bg',
  'si',
  'cy',
  'be',
  'ro',
  'hr',
  'pt',
  'pl',
  'lv',
  'ee',
  'cz',
  'fi',
  'hu',
  'dk',
  'se',
  'ie',
  'im',
  'gb',
  'mt',
];
