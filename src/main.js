/**
 * Created by arnab on 2/11/15.
 */
requirejs.config({
    baseUrl: './',
    paths: {
        'jquery': "lib/jquery/dist/jquery.min",
        'jquery-ui': "lib/jquery-ui-dist/jquery-ui.min",
        'jquery.dialogextend': "lib/binary-com-jquery-dialogextended/jquery.dialogextend.min",
        'jquery-growl': "lib/growl/javascripts/jquery.growl",
        'jquery-validation': "lib/jquery-validation/dist/jquery.validate.min",
        'modernizr': 'lib/modernizr/modernizr',
        'color-picker': "lib/colorpicker/jquery.colorpicker",
        'datatables': "lib/datatables/media/js/jquery.dataTables.min",
        'datatables-jquery-ui': 'lib/datatables/media/js/dataTables.jqueryui.min',
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
        'es6-promise': 'lib/es6-promise/promise.min',
        'rivets': 'lib/rivets/dist/rivets.min',
        'sightglass': 'lib/sightglass/index',
        'timepicker': 'lib/binary-com-jquery-ui-timepicker/jquery.ui.timepicker',
        'lodash': 'lib/lodash/dist/lodash.min',
        'jquery-sparkline': 'lib/jquery-sparkline/dist/jquery.sparkline.min',
        'moment': 'lib/moment/min/moment.min',
        'moment-locale':'lib/moment/locale',
        'clipboard': 'lib/clipboard/dist/clipboard.min',
        "indicator_levels": 'charts/indicators/level',
        'binary-style': '<style-url>/binary',
        'babel-runtime/regenerator': 'lib/regenerator-runtime/runtime',
        'webtrader-charts' : 'lib/webtrader-charts/dist/webtrader-charts',
        'chosen': 'lib/chosen-js/chosen.jquery',
        'highstock-release': 'lib/highstock-release',
    },
    map: {
        '*': {
            'css': 'lib/require-css/css.min',
            'text': 'lib/text/text.js'
        }
    },

    waitSeconds: 0,
    /* fix for requriejs timeout on slow internet connectins */
    "shim": {
        "babel-runtime/regenerator": {
            exports: 'regeneratorRuntime'
        },
        "timepicker": {
            deps: ['jquery-ui', 'jquery']
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
        "currentPriceIndicator": {
            deps: ["highstock-release/highstock"]
        },
        sightglass: { //fix for rivets not playing nice with requriejs (https://github.com/mikeric/rivets/issues/427)
            exports: 'sightglass'
        },
        rivets: {
            deps: ['sightglass'],
            exports: 'rivets'
        },
        "highstock-release/highcharts-more": {
            deps: ["highstock-release/highstock"]
        },
        "color-picker": {
            deps: ["jquery", "jquery-ui"] //This should fix the widget not found error
        }
    }
});

requirejs.onError = function(err) {
    //Avoiding script errors on timeout. Showing a warning so that developers can track wrong path errors on local servers.
    if (err.requireType === 'scripterror') {
        console.warn(err);
        return;
    }
    console.error(err); // For more descriptive errors locally.
    throw err;
};

require(['modernizr'], function() {
    if (!Modernizr.svg || !Modernizr.websockets || (Modernizr.touch && isSmallView()) || !Modernizr.localstorage || !Modernizr.webworkers || !Object.defineProperty) {
        window.location.href = 'unsupported_browsers/unsupported_browsers.html';
        return;
    }
})

/* Initialize the websocket as soon as possible */
require(['websockets/binary_websockets', 'text!./oauth/app_id.json']);

var i18n_name = (local_storage.get('i18n') || { value: 'en' }).value;
require(["jquery", 'text!i18n/' + i18n_name + '.json'], function($, lang_json) {
    "use strict";
    /* setup translating string literals */
    setup_i18n_translation(JSON.parse(lang_json));
    if (i18n_name == 'ar') {
        $('body').addClass('rtl-direction');
    }

    /* Trigger *Parallel* loading of big .js files,
       Suppose moudle X depends on lib A and module Y depends on lib B,
       When X loads it will trigger loading Y, which results in loading A and B Sequentially,

       We know that A and B should eventually be loaded, so trigger loading them ahead of time. */
    require(['jquery-ui', 'highstock-release/highstock']);

    /* main.css overrides some classes in jquery-ui.css, make sure to load it after jquery-ui.css file */
    require(['css!lib/jquery-ui-dist/jquery-ui.min.css',
        'css!lib/jquery-ui-iconfont/jquery-ui.icon-font.css',
        "css!lib/chosen-js/chosen.css",
        'css!lib/growl/stylesheets/jquery.growl.css',
        'css!lib/datatables/media/css/jquery.dataTables.min.css',
        'css!lib/datatables/media/css/dataTables.jqueryui.min.css',
        'css!lib/colorpicker/jquery.colorpicker.css',]);
        // 'css!charts/charts.css']);

    function handle_normal_route() {

        /* We do not allow entire webtrader.binary.com to be included in IFRAME */
        if (self !== top) {
            top.location = self.location;
            return;
        }

        /* this callback is executed right after the navigation module
           has been loaded & initialized. register your menu click handlers here */
        var registerMenusCallback = function($navMenu) {

            //Register async loading of tradingTimes sub-menu
            load_ondemand($navMenu.find("a.tradingTimes"), 'click', 'Loading Trading Times ...'.i18n(), 'tradingtimes/tradingTimes', function(tradingTimes) {
                var elem = $navMenu.find("a.tradingTimes");
                tradingTimes.init(elem);
                elem.click();
            });

            //Register async loading of token-management sub-menu
            load_ondemand($navMenu.find("a.token-management"), 'click', 'Loading Token management ...'.i18n(), 'token/token', function(tokenMangement) {
                var elem = $navMenu.find("a.token-management");
                tokenMangement.init(elem);
                elem.click();
            });

            //Register async loading of change-password sub-menu
            load_ondemand($navMenu.find("a.change-password"), 'click', 'Loading Password dialog ...'.i18n(), 'password/password', function(password) {
                var elem = $navMenu.find("a.change-password");
                password.init(elem);
                elem.click();
            });

            //Register async loading of window asset-index
            load_ondemand($navMenu.find("a.assetIndex"), 'click', 'Loading Asset Index ...'.i18n(), 'assetindex/assetIndex',
                function(assetIndex) {
                    var elem = $navMenu.find("a.assetIndex");
                    assetIndex.init(elem);
                    elem.click();
                });

            //Register async loading of portfolio window
            load_ondemand($navMenu.find("a.portfolio"), 'click', 'Loading portfolio ...'.i18n(), 'portfolio/portfolio',
                function(portfolio) {
                    var elem = $navMenu.find("a.portfolio");
                    portfolio.init(elem);
                    elem.click();
                });

            //Register async loading of real account opening window
            load_ondemand($navMenu.find("a.real-account"), 'click', 'Loading Real account opening ...'.i18n(), 'realaccount/realaccount',
                function(real) {
                    var elem = $navMenu.find("a.real-account");
                    real.init(elem);
                    elem.click();
                });

            //Register async loading of real account opening window
            load_ondemand($navMenu.find("a.deposit"), 'click', 'Loading Deposit funds ...', 'cashier/deposit',
                function(deposit) {
                    var elem = $navMenu.find("a.deposit");
                    deposit.init(elem);
                    elem.click();
                });

            //Register async loading of real account opening window
            load_ondemand($navMenu.find("a.withdraw"), 'click', 'Loading Withdraw funds ...', 'cashier/withdraw',
                function(withdraw) {
                    withdraw = withdraw.default || withdraw;
                    var elem = $navMenu.find("a.withdraw");
                    withdraw.init(elem);
                    elem.click();
                });

            //Register async loading of window profit-table
            load_ondemand($navMenu.find("a.profitTable"), 'click', 'Loading Profit Table ...'.i18n(), 'profittable/profitTable',
                function(profitTable) {
                    var elem = $navMenu.find("a.profitTable");
                    profitTable.init(elem);
                    elem.click();
                });

            //Register async loading of statement dialog
            load_ondemand($navMenu.find("a.statement"), 'click', 'Loading Statement Table ...'.i18n(), 'statement/statement',
                function(statement) {
                    var elem = $navMenu.find("a.statement");
                    statement.init(elem);
                    elem.click();
                });

            //Register async loading of historical-data dialog
            load_ondemand($navMenu.find("a.historical-data"), 'click', 'Loading Download/View Data ...'.i18n(), 'historical-data/historical-data',
                function(historicalData) {
                    var elem = $navMenu.find("a.historical-data");
                    historicalData.init(elem);
                    elem.click();
                });

            //Register async loading of self-exclusion dialog
            load_ondemand($navMenu.find("a.selfexclusion"), 'click', 'Loading Self-Exclusion ...'.i18n(), 'selfexclusion/selfexclusion',
                function(selfexclusion) {
                    var elem = $navMenu.find("a.selfexclusion");
                    selfexclusion.init(elem);
                    elem.click();
                });

            //Register async loading of config dialog
            load_ondemand($navMenu.find("a.config"), 'click', 'Loading Configurations ...'.i18n(), 'config/config',
                function(config) {
                    var elem = $navMenu.find("a.config");
                    config.init(elem);
                    elem.click();
                });

            //Register async loading of custom theme dialog
            load_ondemand($navMenu.find("a.theme_custom"), 'click', 'Loading custom theme configuration...'.i18n(), 'themes/custom_theme/custom_theme',
                function(custom_theme) {
                    var elem = $navMenu.find("a.theme_custom");
                    custom_theme.init(elem);
                    elem.click();
                });

            //Register async loading of help dialog
            load_ondemand($navMenu.find("a.help"), 'click', 'Loading help docs...'.i18n(), 'help/help',
                function(help) {
                    var elem = $navMenu.find("a.help");
                    help.init_help(elem);
                    elem.click();
                });


        }
        
        require(["navigation/navigation", "jquery-ui", 'css!main.css','css!binary-style'], function(navigation) {
            navigation.init(registerMenusCallback);

            /* initialize the top menu because other dialogs
             * will assume an initialized top menu */
            $("#menu").menu();

            //Trigger async loading of instruments and trade menu and refresh
            require(["instruments/instruments", "trade/tradeMenu", "jquery-growl"], function(instruments, trade) {
                $.growl.notice({ message: 'Loading chart and trade menus ...'.i18n() });

                instruments.init();
                trade.init();
            });

            //Trigger async loading of window sub-menu
            require(["windows/windows"], function(windows) {
                var $windowsLI = $("#nav-menu .windows");
                windows.init($windowsLI);
                // hide the main loading spinner,
                // after the `last module` has been loaded.
                $(".sk-spinner-container").hide();
                $('body > .footer').show();
            });
        });

        /*Trigger T&C check, self-exclusion, reality check, chrome extension check, csr_tax_information check*/
        require(['selfexclusion/selfexclusion', 'chrome/chrome', 'accountstatus/accountstatus', 'realitycheck/realitycheck', 'websitestatus/websitestatus']);
    }

    //Our chart is accessed directly
    handle_normal_route();

});


/* example: load_ondemand(li,'click','tradingtimes/tradingtimes',callback) */
function load_ondemand(element, event_name, msg, module_name, callback) {
    var func_name = null;
    element.one(event_name, func_name = function() {

        //Ignore click event, if it has disabled class
        if (element.hasClass('disabled')) {
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

/*
 * patch for jquery growl functions.
 * do not to show multiple growls with the same content.
 * add more info to messages realted to websocket 'rate limit'
 */
require(['jquery', 'jquery-growl'], function($) {
    ['error', 'notice', 'warning'].forEach(function(name) {
        var perv = $.growl[name].bind($.growl);
        $.growl[name] = function(options) {
            if (options.message.indexOf('rate limit') > -1) {
                options.message += ' Please try again after 1 minute.'.i18n();
            }
            if (!options.title) options.title = ''; /* remove title */
            /* remove current growl with the same message */
            $('#growls .growl:contains("' + options.message + '")').remove();
            perv(options);
        }
    });
});
