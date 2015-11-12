/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", "websockets/binary_websockets", "common/menu", "jquery-growl","common/util"],
    function ($, $ui, liveapi, menu) {

    "use strict";

    function openNewChart(timePeriodInStringFormat) { //in 1m, 2m, 1d etc format

        require(["validation/validation","charts/chartWindow"], function(validation,chartWindow) {
            if (!validation.validateIfNoOfChartsCrossingThreshold(chartWindow.totalWindows())) {
                $.growl.error({ message: "No more charts allowed!" });
                return;
            }

            //validate the selection
            var displaySymbol = $("#instrumentsDialog").dialog('option', 'title');
            var internalSymbol = $("#instrumentsDialog").data("symbol");
            var delayAmount = $("#instrumentsDialog").data("delay_amount"); //this is in minutes

            var timeperiodObject = convertToTimeperiodObject(timePeriodInStringFormat);
            var error_msg = null;
            if (timeperiodObject) {
                if (validation.validateNumericBetween(timeperiodObject.intValue(), parseInt($("#timePeriod").attr("min")), parseInt($("#timePeriod").attr("max")))) {
                    if (delayAmount <= (timeperiodObject.timeInSeconds() / 60)) {

                        chartWindow.addNewWindow(internalSymbol, displaySymbol, timePeriodInStringFormat,
                                    isTick(timePeriodInStringFormat) ? 'line' : 'candlestick');
                        closeDialog.call($("#instrumentsDialog"));
                    }
                    else
                        error_msg = "Charts of less than "
                                   + convertToTimeperiodObject(delayAmount + 'm').humanReadableString() //Convert to human readable (in minutes) format
                                   + " are not available for the " + displaySymbol + ".";
                }
                else
                    error_msg = "Only numbers between " + $("#timePeriod").attr("min") + " to " + $("#timePeriod").attr("max") + " is allowed for " + $("#units option:selected").text() + "!";
            }
            else
                error_msg = "Only numbers between 1 to 100 is allowed!";

            if (error_msg) {
                $("#timePeriod").addClass('ui-state-error');
                $.growl.error({ message: error_msg});
            }
        });

    }

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
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
            })

            $("#instrumentSelectionMenuDIV").hide();
        };

        if($("#instrumentsDialog").length == 0)
            require(['text!instruments/instruments.html'], function ($html) {
                $($html).css("display", "none").appendTo("body");
                $("#standardPeriodsButtonContainer").find("button")
                    .click(function() {
                        openNewChart($(this).attr('id'));
                    })
                    .button();


                //attach unit change listener
                $("#units").change(function () {
                    if ($(this).val() == 't') {
                        $("#timePeriod").val('1').attr('disabled', 'disabled')
                            .attr("min", 1).attr("max", 1);
                    }
                    else {
                        $("#timePeriod").removeAttr('disabled');
                        var val = $("#units").val();
                        var max = { m: 59, h: 23, d: 3 }[val] || 120; /* restric range for minute,hour,day*/
                        $("#timePeriod").attr("max", max);
                    }
                });
                $("#units").trigger("change");

                $("#instrumentsDialog").dialog({
                    autoOpen: false,
                    resizable: false,
                    width: 260,
                    my: 'center',
                    at: 'center',
                    of: window,
                    buttons: [
                        {
                            text: "Ok",
                            click: function () {
                                //console.log('Ok button is clicked!');
                                openNewChart($("#timePeriod").val() + $("#units").val());
                            }
                        },
                        {
                            text: "Cancel",
                            click: function () {
                                closeDialog.call(this);
                            }
                        }
                    ]
                });

                update();
            });
        else
            update();

        $(document).click();
    }

    var markets = [];

    return {
        init: function( _callback ) {
            if ($.isEmptyObject(markets)) {
                require(["css!instruments/instruments.css"]);
                /* cache the result of trading_times call, because assetIndex needs the same data */
                liveapi
                    .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                    .then(function (data) {
                            markets = menu.extractChartableMarkets(data);
                            var rootUL = $("<ul>").appendTo($("#nav-menu").find(".instruments")); /* add to instruments menu */
                            menu.sortMenu(markets);
                            menu.refreshMenu(rootUL,markets,onMenuItemClick);
                        }
                    ).catch(console.error.bind(console));
            }

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
