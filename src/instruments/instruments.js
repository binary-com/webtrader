/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", "websockets/eventSourceHandler", "jquery-growl"], function($, $ui, liveapi) {

    "use strict";

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

    function sortMarkets(data) {
        if($.isArray(data)) {
            data.sort(sortAlphaNum('display_name'));

            // iterate array items.
            $.each(data, function (i, item) {
                // iterame item properties.
                $.each(item, function (i, prop) {
                    if($.isArray(prop)) {
                        sortMarkets(prop);
                    }
                });
            });
        }
    }

    function openNewChart(timePeriodInStringFormat) { //in 1m, 2m, 1d etc format

        require(["validation/validation","charts/chartWindow"], function(validation, chartWindow) {
            if (!validation.validateIfNoOfChartsCrossingThreshold(chartWindow.totalWindows())) {
                $.growl.error({ message: "No more charts allowed!" });
                return;
            }

            //validate the selection
            var displaySymbol = $("#instrumentsDialog").dialog('option', 'title');
            var internalSymbol = $("#instrumentsDialog").data("symbol");
            var delayAmount = $("#instrumentsDialog").data("delay_amount"); //this is in minutes
            var timeperiodObject = convertToTimeperiodObject(timePeriodInStringFormat);

            var error_message = null;
            if (timeperiodObject) {
                if (validation.validateNumericBetween(timeperiodObject.intValue(), parseInt($("#timePeriod").attr("min")), parseInt($("#timePeriod").attr("max")))) {

                    if (delayAmount <= (timeperiodObject.timeInSeconds() / 60)) {

                        chartWindow.addNewWindow(internalSymbol, displaySymbol, timePeriodInStringFormat, null,
                                    isTick(timePeriodInStringFormat) ? 'line' : 'candlestick');
                        closeDialog.call($("#instrumentsDialog"));
                    }
                    else
                        error_message = "Charts of less than " + convertToTimeperiodObject(delayAmount + 'm').humanReadableString()
                            + " are not available for the " + displaySymbol + ".";
                }
                else
                    error_message = "Only numbers between " + $("#timePeriod").attr("min") + " to " + $("#timePeriod").attr("max") + " is allowed for " + $("#units option:selected").text() + "!";

            }
            else
                error_message = "Only numbers between 1 to 100 is allowed!";

            if(error_message) {
                $("#timePeriod").addClass('ui-state-error');
                $.growl.error({ message: error_message });
            }
        });

    }

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function _refreshInstrumentMenu( rootElement, data ) {

        $.each(data, function(key, value) {
            var newLI = $("<li>").append(value.display_name)
                                .data("symbol", value.symbol)
                                .data("delay_amount", value.delay_amount)
                                .appendTo( rootElement );

            if (value.submarkets || value.instruments) {
                newLI.click(function(e) {
                  e.preventDefault();
                  return false;
                });
                var newUL = $("<ul>");
                newUL.appendTo(newLI);
                _refreshInstrumentMenu( newUL, value.submarkets || value.instruments );
            } else {

                newLI.click(function() {

                    if ($("#instrumentsDialog").length == 0) {

                        $.get("instruments/instruments.html", function ($html) {
                            $($html).css("display", "none").appendTo("body");
                            $("#standardPeriodsButtonContainer").find("button")
                                .click(function() {
                                    //console.log('Standard button is clicked');
                                    openNewChart($(this).attr('id'));
                                })
                                .button();


                            //attach unit change listener
                            $("#units").change(function () {
                                if ($(this).val() == 't')
                                {
                                    $("#timePeriod").val('1').attr('disabled', 'disabled')
                                        .attr("min", 1).attr("max", 1);
                                }
                                else
                                {
                                    $("#timePeriod").removeAttr('disabled');
                                    var val = $("#units").val();
                                    var max = { m: 59, h: 23, d: 3 }[val] || 120; /* restric range for minute,hour,day*/
                                    $("#timePeriod").attr("max", max);
                                }
                            });
                            $("#units").trigger("change");

                            $( "#instrumentsDialog" ).dialog({
                                autoOpen: false,
                                resizable: false,
                                width: 260,
                                my: 'center',
                                at: 'center',
                                of: window,
                                buttons: [
                                    {
                                        text: "Ok",
                                        click: function() {
                                            //console.log('Ok button is clicked!');
                                            openNewChart($("#timePeriod").val() + $("#units").val());
                                        }
                                    },
                                    {
                                        text: "Cancel",
                                        click: function() {
                                            closeDialog.call(this);
                                        }
                                    }
                                ]
                            });

                            $("#instrumentsDialog").dialog('option', 'title', newLI.text())
                                                        .data("symbol", newLI.data("symbol"))
                                                        .data("delay_amount", newLI.data("delay_amount"));
                            $( "#instrumentsDialog" ).dialog( "open" );
                            $("#instrumentSelectionMenuDIV").hide();

                        });

                    } else {
                        $("#instrumentsDialog").dialog('option', 'title', $(this).text())
                                        .data("symbol", $(this).data("symbol"))
                                        .data("delay_amount", $(this).data("delay_amount"));
                        $( "#instrumentsDialog" ).dialog( "open" );
                        $("#instrumentSelectionMenuDIV").hide();
                    }

                    $(document).click();

                });

            }
        });

    }

    var markets = [];

    function processMarketSubmarkets(in_markets) {
        markets = in_markets.map(function (m) {
            var market = { name: m.name, display_name: m.name };
            market.submarkets = m.submarkets.map(function (sm) {
                var submarket = { name: sm.name, display_name: sm.name };
                submarket.instruments = sm.symbols.map(function (sym) {
                    return {
                        symbol: sym.symbol,
                        display_name: sym.name,
                        delay_amount: 0 //TODO fix this when API provides it
                    };
                });
                return submarket;
            });
            return market;
        });
        sortMarkets(markets);
    }

    return {
        init: function() {
            if ($.isEmptyObject(markets)) {
                loadCSS("instruments/instruments.css");
                liveapi.send({ trading_times: new Date().toISOString().slice(0, 10) })
                    .then(function (data) {
                        processMarketSubmarkets(data.trading_times.markets);

                        var instrumentsMenu = $(".mainContainer").find('.instruments');
                        var rootUL = $("<ul>");
                        rootUL.appendTo(instrumentsMenu);
                        _refreshInstrumentMenu(rootUL, markets);
                        rootUL.menu();
                    })
                    .catch(function (err) {
                        $.growl.error({ message: err.message });
                    });
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
