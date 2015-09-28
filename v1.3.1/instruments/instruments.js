/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", 'websockets/symbol_handler'], function($, $ui, symbol_handler) {

    "use strict";

    function openNewChart(timePeriodInStringFormat) { //in 1m, 2m, 1d etc format

        require(["validation/validation"], function(validation) {

            require(["charts/chartWindow"], function (chartWindow) {

                if (!validation.validateIfNoOfChartsCrossingThreshold(chartWindow.totalWindows()))
                {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "No more charts allowed!" });
                    });
                    return;
                }

                //validate the selection
                var displaySymbol = $("#instrumentsDialog").dialog('option', 'title');
                var internalSymbol = $("#instrumentsDialog").data("symbol");
                var delayAmount = $("#instrumentsDialog").data("delay_amount"); //this is in minutes
                require(["common/util"], function() {
                    var timeperiodObject = convertToTimeperiodObject(timePeriodInStringFormat);
                    if (timeperiodObject) {

                        if (validation.validateNumericBetween(timeperiodObject.intValue(), parseInt($("#timePeriod").attr("min")), parseInt($("#timePeriod").attr("max"))))
                        {

                            if (delayAmount <= (timeperiodObject.timeInSeconds() / 60)) {

                                chartWindow.addNewWindow(internalSymbol, displaySymbol, timePeriodInStringFormat, null,
                                            isTick(timePeriodInStringFormat) ? 'line' : 'candlestick');
                                closeDialog.call($("#instrumentsDialog"));
                            }
                            else
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $("#timePeriod").addClass('ui-state-error');
                                    $.growl.error({ message: "Charts of less than "
                                            //Convert to human readable (in minutes) format
                                        + convertToTimeperiodObject(delayAmount + 'm').humanReadableString()
                                        + " are not available for the " + displaySymbol + "." });
                                });
                            }
                        }
                        else
                        {
                            require(["jquery", "jquery-growl"], function($) {
                                $("#timePeriod").addClass('ui-state-error');
                                $.growl.error({ message: "Only numbers between " + $("#timePeriod").attr("min") + " to " + $("#timePeriod").attr("max") + " is allowed for " + $("#units option:selected").text() + "!" });
                            });
                        }

                    }
                    else
                    {
                        require(["jquery", "jquery-growl"], function($) {
                            $("#timePeriod").addClass('ui-state-error');
                            $.growl.error({ message: "Only numbers between 1 to 100 is allowed!" });
                        });
                    }

                });
            });
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
                var newUL = $("<ul>").addClass('ui-corner-all');
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
                                    if ($("#units").val() == 'm')
                                    {
                                        $("#timePeriod").attr("max", 50);
                                    }
                                    else if ($("#units").val() == 'h')
                                    {
                                        $("#timePeriod").attr("max", 23);
                                    }
                                    else
                                    {
                                        $("#timePeriod").attr("max", 120);
                                    }
                                }
                            });

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

    return {

        init: function( ) {

            if ($.isEmptyObject(markets)) {
                loadCSS("instruments/instruments.css");
                symbol_handler.fetchMarkets(function (_instrumentJSON) {
                    if (!$.isEmptyObject(_instrumentJSON)) {

                        markets = _instrumentJSON;

                        //Enable the instruments menu
                        var instrumentsMenu = $(".mainContainer").find('.instruments');
                        instrumentsMenu.button("enable").button("refresh").button("widget").click(function(e) {
                          var menu = $(this).closest('div').find("ul:first").menu();
                          if (menu.is(":visible")) {
                            menu.hide();
                          } else {
                            menu.show();
                          }
                        }).focusout(function() {
                          $(this).closest('div').find('ul').menu().hide();
                        });

                        var rootUL = $("<ul>").addClass('ui-corner-all');
                        rootUL.appendTo(instrumentsMenu);
                        _refreshInstrumentMenu(rootUL, _instrumentJSON);
                        rootUL.menu();

                    }
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
