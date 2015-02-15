/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", "index", "utils/loadCSS"], function($) {

    loadCSS("instruments/instruments.css");

    function openNewChart(timePeriodInStringFormat) { //in 1m, 2m, 1d etc format
        require(["charts/tabs"], function (tabs) {
            tabs.addNewTab($("#instrumentsDialog").data("symbol"),
                $("#instrumentsDialog").dialog('option', 'title'), timePeriodInStringFormat);
        });
        $("#instrumentsDialog").dialog("close");
    }

    function _refreshInstrumentMenu( rootElement, data ) {

        $.each(data, function(key, value) {
            var newLI = $("<li>").append(value.display_name)
                .data("symbol", value.symbol)
                                .data("delay_amount", value.delay_amount)
                                .appendTo( rootElement );


            if (value.submarkets || value.instruments) {
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
                                    openNewChart($(this).attr('id'));
                                })
                                .button();

                            $( "#instrumentsDialog" ).dialog({
                                autoOpen: false,
                                resizable: false,
                                buttons: [
                                    {
                                        text: "Ok",
                                        click: function() {
                                            openNewChart($("#timePeriod").val() + $("#units").val());
                                        }
                                    },
                                    {
                                        text: "Cancel",
                                        click: function() {
                                            $( this ).dialog( "close" );
                                        }
                                    }
                                ]
                            });
                            console.log(newLI.text());

                            $("#instrumentsDialog").dialog('option', 'title', newLI.text()).data("symbol", newLI.data("symbol"));
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

                });

            }
        });

    }

    function _loadInstruments(_callback) {

        $.get("https://chart.binary.com/d/backend/markets.cgi", function( _instrumentJSON ) {
            if ( !$.isEmptyObject( _instrumentJSON )) {
                _callback( _instrumentJSON );
            }
        }, 'json').error(function(e) {
            //TODO remove loading image and show some error message
            console.log('Error getting market information!');
        });

    }

    return {

        open: function() {

            //if the instrument menu is not loaded, then load it first
            if ($("#instrumentSelectionMenuDIV").length == 0)
            {
                //Execution here means, the panel is not shown yet
                $.get("instruments/instrumentsMenu.html", function($html) {
                    $($html).insertAfter("#instruments").hide();
                    _loadInstruments( function( instruments ) {


                        $("#instrumentSelectionMenuDIV").find("img").remove();
                        $("#instrumentSelectionMenu").find("*").remove();

                        _refreshInstrumentMenu( $("#instrumentSelectionMenu"), instruments );
                        $("#instrumentSelectionMenu").menu();

                    } );
                    $("#instrumentSelectionMenuDIV").show();
                });
            }
            else
            {
                //If the menu is already shown, hide it
                if ($("#instrumentSelectionMenuDIV").is(":visible"))
                {
                    $("#instrumentSelectionMenuDIV").hide();
                }
                else
                {
                    //If it is already loaded, then show it
                    $("#instrumentSelectionMenuDIV").show();
                }
            }

        }
    };

});
