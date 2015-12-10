/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/tema/tema.css']);

        require(['text!charts/indicators/tema/tema.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#tema_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#tema_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#tema_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 315,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            if (!isNumericBetween($html.find(".tema_input_width_for_period").val(),
                                            parseInt($html.find(".tema_input_width_for_period").attr("min")),
                                            parseInt($html.find(".tema_input_width_for_period").attr("max"))))
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({ message: "Only numbers between " + $html.find(".tema_input_width_for_period").attr("min")
                                            + " to " + $html.find(".tema_input_width_for_period").attr("max")
                                            + " is allowed for " + $html.find(".tema_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                });
                                return;
                            }

                            require(['charts/indicators/highcharts_custom/tema'], function ( tema ) {
                                tema.init();
                                var options = {
                                    period : parseInt($html.find(".tema_input_width_for_period").val()),
                                    stroke : defaultStrokeColor,
                                    strokeWidth : parseInt($html.find("#tema_strokeWidth").val()),
                                    dashStyle : $html.find("#tema_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#tema_appliedTo").val())
                                }
                                //Add TEMA for the main series
                                $($(".tema").data('refererChartID')).highcharts().series[0].addTEMA(options);
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

            if ($(".tema").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".tema").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
