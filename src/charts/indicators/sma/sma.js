/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/sma/sma.css']);

        require(['text!charts/indicators/sma/sma.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#sma_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#sma_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#sma_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 280,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {

                            if (!isNumericBetween($html.find(".sma_input_width_for_period").val(),
                                            parseInt($html.find(".sma_input_width_for_period").attr("min")),
                                            parseInt($html.find(".sma_input_width_for_period").attr("max"))))
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({ message: "Only numbers between " + $html.find(".sma_input_width_for_period").attr("min")
                                            + " to " + $html.find(".sma_input_width_for_period").attr("max")
                                            + " is allowed for " + $html.find(".sma_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                });
                                return;
                            }

                            require(['charts/indicators/highcharts_custom/sma'], function ( sma ) {
                                sma.init();
                                var options = {
                                    period : parseInt($html.find(".sma_input_width_for_period").val()),
                                    stroke : defaultStrokeColor,
                                    strokeWidth : parseInt($html.find("#sma_strokeWidth").val()),
                                    dashStyle : $html.find("#sma_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#sma_appliedTo").val())
                                }
                                //Add SMA for the main series
                                $($(".sma").data('refererChartID')).highcharts().series[0].addSMA(options);
                            });

                            closeDialog.call($html);
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

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".sma").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".sma").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
