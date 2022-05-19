/**
 * Created by arnab on 2/11/15.
 */
window.requirejs.config({
    baseUrl: "./",
    paths: {
        "jquery": "lib/jquery/dist/jquery.min",
        "jquery-ui": "lib/jquery-ui-dist/jquery-ui.min",
        "jquery.dialogextend": "lib/binary-com-jquery-dialogextended/jquery.dialogextend.min",
        "jquery-growl": "lib/jquery.growl/javascripts/jquery.growl",
        "modernizr": "lib/npm-modernizr/modernizr",
        "color-picker": "lib/vanderlee-colorpicker/jquery.colorpicker",
        "datatables": "lib/datatables.net/js/jquery.dataTables",
        "datatables-jquery-ui": "lib/datatables.net-jqui/js/dataTables.jqueryui",
        "currentPriceIndicator": "charts/indicators/highcharts_custom/currentprice",
        "es6-promise": "lib/es6-promise/promise.min",
        "rivets": "lib/rivets/dist/rivets.min",
        "sightglass": "lib/sightglass/index",
        "timepicker": "lib/binary-com-jquery-ui-timepicker/jquery.ui.timepicker",
        "lodash": "lib/lodash/lodash.min",
        "jquery-sparkline": "lib/jquery-sparkline/jquery.sparkline.min",
        "moment": "lib/moment/min/moment.min",
        "moment-locale":"lib/moment/locale",
        "clipboard": "lib/clipboard/dist/clipboard.min",
        "indicator_levels": "charts/indicators/level",
        "binary-style": "lib/@binary-com/binary-style/binary",
        "babel-runtime/regenerator": "lib/regenerator-runtime/runtime",
        "webtrader-charts" : "lib/@binary-com/webtrader-charts/dist/webtrader-charts.iife",
        "chosen": "lib/chosen-js/chosen.jquery",
        "highstock-release": "lib/highstock-release",
        "jquery-ui-touch-punch": "lib/jquery-ui-touch-punch/jquery.ui.touch-punch.min",
    },
    map: {
        "*": {
            "css": "lib/require-css/css.min",
            "text": "lib/requirejs-text/text.js"
        }
    },

    waitSeconds: 0,
    /* fix for requriejs timeout on slow internet connectins */
    "shim": {
        "webtrader-charts": {
            exports: "WebtraderCharts",
            deps: [
              'moment',
              'jquery',
              'highstock-release/highstock',
            ]
        },
        "babel-runtime/regenerator": {
            exports: "regeneratorRuntime"
        },
        "timepicker": {
            deps: ["jquery-ui", "jquery"]
        },
        "jquery.dialogextend": {
           deps: ["jquery-ui"]
        },
        "jquery-ui": {
            deps: ["jquery"]
        },
        "highstock-release/highstock": {
            deps: ["jquery"],
            exports: "Highcharts"
        },
        "highstock-release/modules/exporting": {
            deps: ["highstock-release/highstock"]
        },
        "highstock-release/modules/offline-exporting": {
            deps: ["highstock-release/modules/exporting"]
        },
        "jquery-growl": {
            deps: ["jquery"]
        },
        "datatables": {
            deps: ["jquery-ui"]
        },
        "datatables-jquery-ui" : {
            deps: ["datatables"]
        },
        "currentPriceIndicator": {
            deps: ["highstock-release/highstock"]
        },
        sightglass: { //fix for rivets not playing nice with requriejs (https://github.com/mikeric/rivets/issues/427)
            exports: "sightglass"
        },
        rivets: {
            deps: ["sightglass"],
            exports: "rivets"
        },
        "highstock-release/highcharts-more": {
            deps: ["highstock-release/highstock"]
        },
        "color-picker": {
            deps: ["jquery", "jquery-ui"] //This should fix the widget not found error
        },
        "jquery-ui-touch-punch": {
            deps: ["jquery", "jquery-ui"]
        }
    }
});

window.requirejs.onError = function(err) {
    //Avoiding script errors on timeout. Showing a warning so that developers can track wrong path errors on local servers.
    if (err.requireType === "scripterror") {
        throw err;
    }
    throw err;
};

require(["modernizr"], function() {
    var Modernizr = window.Modernizr;
    if (!Modernizr.svg || !Modernizr.websockets || (Modernizr.touch && window.isSmallView()) || 
        !Modernizr.localstorage || !Modernizr.webworkers || !Object.defineProperty) {
        window.location.assign("unsupported_browsers/unsupported_browsers.html");
        return;
    }
});

/* Initialize the websocket as soon as possible */
require(["websockets/binary_websockets", "text!./oauth/app_id.json"]);

/* example: load_ondemand(li,"click","tradingtimes/tradingtimes",callback) */
function load_ondemand(element, event_name, msg, module_name, callback) {
    var func_name = null;
    element.one(event_name, func_name = function() {

        //Ignore click event, if it has disabled class
        if (element.hasClass("disabled")) {
            element.one(event_name, func_name);
            return;
        }

        require([module_name], function(module) {
            if (msg) {
                require(["jquery", "jquery-growl"], function($) {
                    $.growl.notice({ message: msg });
                });
            }
            callback && callback(module);
        });

    });
}

var i18n_name = (window.local_storage.get("i18n") || { value: "en" }).value;
require(["jquery", "text!i18n/" + i18n_name + ".json"], function($, lang_json) {
    "use strict";
    /* setup translating string literals */
    window.setupi18nTranslation(JSON.parse(lang_json));

    /* Trigger *Parallel* loading of big .js files,
       Suppose moudle X depends on lib A and module Y depends on lib B,
       When X loads it will trigger loading Y, which results in loading A and B Sequentially,

       We know that A and B should eventually be loaded, so trigger loading them ahead of time. */
    require(["jquery-ui", "highstock-release/highstock"]);

    /* main.css overrides some classes in jquery-ui.css, make sure to load it after jquery-ui.css file */
    require(["css!lib/jquery-ui-dist/jquery-ui.min.css",
        "css!lib/jquery-ui-iconfont/jquery-ui.icon-font.css",
        "css!lib/chosen-js/chosen.css",
        "css!lib/jquery.growl/stylesheets/jquery.growl.css",
        "css!lib/datatables.net-dt/css/jquery.dataTables.css",
        "css!lib/datatables.net-jqui/css/dataTables.jqueryui.css",
        "css!lib/vanderlee-colorpicker/jquery.colorpicker.css",]);
        // "css!charts/charts.css"]);

    function handle_normal_route() {

        /* We do not allow entire webtrader.binary.com to be included in IFRAME */
        if (self !== top) {
            top.location = self.location;
            return;
        }

        /* this callback is executed right after the navigation module
           has been loaded & initialized. register your menu click handlers here */
        var registerMenusCallback = function($navMenu) {

            load_ondemand($navMenu.find("a.tradingTimes"), "click", "Loading Trading Times ...".i18n(), "tradingtimes/tradingTimes", function(tradingTimes) {
                var elem = $navMenu.find("a.tradingTimes");
                tradingTimes.init(elem);
                elem.click();
            });

            load_ondemand($navMenu.find("a.token-management"), "click", "Loading Token management ...".i18n(), "token/token", function(tokenMangement) {
                var elem = $navMenu.find("a.token-management");
                tokenMangement.init(elem);
                elem.click();
            });

            load_ondemand($navMenu.find("a.change-password"), "click", "Loading Password dialog ...".i18n(), "password/password", function(password) {
                var elem = $navMenu.find("a.change-password");
                password.init(elem);
                elem.click();
            });

            load_ondemand($navMenu.find("a.assetIndex"), "click", "Loading Asset Index ...".i18n(), "assetindex/assetIndex",
                function(assetIndex) {
                    var elem = $navMenu.find("a.assetIndex");
                    assetIndex.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.portfolio"), "click", "Loading portfolio ...".i18n(), "portfolio/portfolio",
                function(portfolio) {
                    var elem = $navMenu.find("a.portfolio");
                    portfolio.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.deposit"), "click", "Loading Deposit funds ...", "cashier/deposit",
                function(deposit) {
                    var elem = $navMenu.find("a.deposit");
                    deposit.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.withdraw"), "click", "Loading Withdraw funds ...", "cashier/withdraw",
                function(withdraw) {
                    withdraw = withdraw.default || withdraw;
                    var elem = $navMenu.find("a.withdraw");
                    withdraw.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.profitTable"), "click", "Loading Profit Table ...".i18n(), "profittable/profitTable",
                function(profitTable) {
                    var elem = $navMenu.find("a.profitTable");
                    profitTable.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.statement"), "click", "Loading Statement Table ...".i18n(), "statement/statement",
                function(statement) {
                    var elem = $navMenu.find("a.statement");
                    statement.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.historical-data"), 'click', 'Loading Download/View Data ...'.i18n(), 'historical-data/historical-data',
                function(historicalData) {
                    var elem = $navMenu.find("a.historical-data");
                    historicalData.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.selfexclusion"), "click", "Loading Self-Exclusion ...".i18n(), "selfexclusion/selfexclusion",
                function(selfexclusion) {
                    var elem = $navMenu.find("a.selfexclusion");
                    selfexclusion.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.theme_custom"), "click", "Loading custom theme configuration...".i18n(), "themes/custom_theme/custom_theme",
                function(custom_theme) {
                    var elem = $navMenu.find("a.theme_custom");
                    custom_theme.init(elem);
                    elem.click();
                });

            load_ondemand($navMenu.find("a.copytrade"), "click", "Loading Copy Trade...".i18n(), "copytrade/copytrade",
              function(copytrade) {
                  var elem = $navMenu.find("a.copytrade");
                  copytrade.init(elem);
                  elem.click();
              });
        };
        
        require(["navigation/navigation", "websockets/binary_websockets", "jquery-ui", "css!main.css","css!binary-style"], function(navigation, websockets) {
            var shouldRedirectMf = function(client_country, auth) {
                var account_list = auth.account_list;
                var residence_country = auth.country;
                var has_mf_mx_mlt = false;
                account_list.forEach(function(account) {
                    if (account.landing_company_name === 'maltainvest' 
                        || account.landing_company_name === 'malta'
                        || account.landing_company_name === 'iom') 
                    {
                        has_mf_mx_mlt = true;
                        return;
                    }
                });
                return (has_mf_mx_mlt || ((isEuCountrySelected(client_country) || isEuCountrySelected(residence_country)) && account_list.length == 1))
            }
            var showMainContent = function () {
                navigation.init(registerMenusCallback);
        
                /* initialize the top menu because other dialogs
                 * will assume an initialized top menu */
                $("#menu").menu();
    
                //Trigger async loading of instruments and trade menu and refresh
                require(["instruments/instruments", "trade/tradeMenu", "jquery-growl"], function(instruments, trade) {
                    $.growl.notice({ message: "Loading chart and trade menus ...".i18n() });
    
                    instruments.init();
                    trade.init();
                });
    
                //Trigger async loading of window sub-menu
                require(["windows/windows"], function(windows) {
                    var $windowsLI = $("#nav-menu .windows");
                    windows.init($windowsLI);
                    // hide the main loading spinner,
                    // after the `last module` has been loaded.
                    $(".sk-spinner-container").parent().hide();
                    $("body > .footer").show();
                });
    
                require(["banners/banners"], function(banner) {
                    banner.init();
                });
            };

            websockets
            .send({ website_status: 1 })
            .then(function(data) {
                var client_country = data.website_status.clients_country;
                if (!local_storage.get('oauth')) {
                    if (isEuCountrySelected(client_country)) {
                        window.location.href = moveToDerivUrl();
                    } else {
                        showMainContent();
                    }
                } else {
                    var token = local_storage.get('oauth')[0].token;
                    websockets.send({authorize: token}).then(function(auth) {
                        if (shouldRedirectMf(client_country, auth.authorize)) {
                            window.location.href = moveToDerivUrl();
                        } else {
                            showMainContent();
                        }
                    })
                }
                
            })
        });

        /*Trigger T&C check, self-exclusion, reality check, csr_tax_information check*/
        require(["selfexclusion/selfexclusion", "accountstatus/accountstatus", "realitycheck/realitycheck", "websitestatus/websitestatus"]);
        require(["jquery", "jquery-ui-touch-punch"], function($) {
            $('.ui-dialog').draggable();
        });
    }

    //Our chart is accessed directly
    handle_normal_route();

});

/*
 * patch for jquery growl functions.
 * do not to show multiple growls with the same content.
 * add more info to messages realted to websocket "rate limit"
 */
require(["jquery", "jquery-growl"], function($) {
    ["error", "notice", "warning"].forEach(function(name) {
        var perv = $.growl[name].bind($.growl);
        $.growl[name] = function(options) {
            if (options.message && options.message.indexOf("rate limit") > -1) {
                options.message += " Please try again after 1 minute.".i18n();
            }
            if (!options.title) { options.title = ""; /* remove title */ }
            /* remove current growl with the same message */
            $("#growls .growl:contains(\"" + options.message + "\")").remove();
            perv(options);
        };
    });
});
