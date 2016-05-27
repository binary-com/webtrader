/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", "websockets/binary_websockets", "navigation/menu", "jquery-growl","common/util"],
    function ($, $ui, liveapi, menu) {

    "use strict";

    function openNewChart(timePeriodInStringFormat) { //in 1m, 2m, 1d etc format

        require(["charts/chartWindow"], function(chartWindow) {
            //validate the selection
            var displaySymbol = $("#instrumentsDialog").dialog('option', 'title');
            var internalSymbol = $("#instrumentsDialog").data("symbol");
            var delayAmount = $("#instrumentsDialog").data("delay_amount"); //this is in minutes
            var type = isTick(timePeriodInStringFormat) ? 'line' : 'candlestick';

            chartWindow.addNewWindow({
                instrumentCode : internalSymbol,
                instrumentName : displaySymbol,
                timePeriod : timePeriodInStringFormat,
                type : type,
                delayAmount : delayAmount
              });
            $("#instrumentsDialog").dialog("close");
        });

    }

    function onMenuItemClick(li) {
        var update = function () {
            var delay_amount = li.data('delay_amount');
            $("#instrumentsDialog").dialog('option', 'title', li.find('a').text())
                                        .data("symbol", li.data('symbol'))
                                        .data("delay_amount", delay_amount)
                                        .dialog("open");
            /* disable or enable the buttons based on delay_amount */
            $("#instrumentsDialog").find('button').each(function () {
                var btn = $(this); // button ids are    1m, 5m, 15m, 1h, 4h, 8h, 1d, 2d, ...
                var act = convertToTimeperiodObject(btn.attr('id')).timeInSeconds() < delay_amount * 60 ? 'disable' : 'enable';
                btn.button(act);
            });

        };

        if($("#instrumentsDialog").length == 0) {
            require(['text!instruments/instruments.html'], function ($html) {
                $($html).css("display", "none").appendTo("body");
                $("#standardPeriodsButtonContainer").find("button")
                    .click(function () {
                        openNewChart($(this).attr('id'));
                    })
                    .button();

                $("#instrumentsDialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    width: 270,
                    height: 250,
                    my: 'center',
                    at: 'center',
                    of: window,
                    buttons: []
                });

                update();
            });
        }
        else {
            update();
        }

        $(document).click();
    }

    var markets = [];

    return {
        init: function() {
            require(["css!instruments/instruments.css"]);
            /* cache the result of trading_times call, because assetIndex needs the same data */
            return liveapi
                    .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                    .then(function (data) {
                        markets = menu.extractChartableMarkets(data);
                        if ($("#nav-menu").length > 0) {
                            var rootUL = $("<ul>").appendTo($("#nav-menu").find(".instruments"));
                            /* add to instruments menu */
                            markets = menu.sortMenu(markets);
                            menu.refreshMenu(rootUL, markets, onMenuItemClick);
                        }
                        return markets;
                    });
        },

        getMarketData : function() {
            return markets;
        },

        isMarketDataPresent : function( marketDataDisplayName, marketData ) {
            var present = false;
            if (!marketData) {
                marketData = markets;
            }

            var instrumentObj = this;
            $.each(marketData, function (key, value) {
                if (value.submarkets || value.instruments) {
                    present = instrumentObj.isMarketDataPresent(marketDataDisplayName, value.submarkets || value.instruments);
                } else {
                    if ($.trim(value.display_name) == $.trim(marketDataDisplayName)) {
                        present = true;
                    }
                }
                return !present;
            });
            return present;
        },

        getSpecificMarketData : function( marketDataDisplayName, marketData ) {
            var present = {};
            if (!marketData) {
                marketData = markets;
            }

            var instrumentObj = this;
            $.each(marketData, function (key, value) {
                if (value.submarkets || value.instruments) {
                    present = instrumentObj.getSpecificMarketData(marketDataDisplayName, value.submarkets || value.instruments);
                } else {
                    if ($.trim(value.display_name) == $.trim(marketDataDisplayName)) {
                        present = value;
                    }
                }
                return $.isEmptyObject(present);
            });
            return present;
        }
    };

});
