/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'loadCSS'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        loadCSS('charts/indicators/ema/ema.css');

        $.get("charts/indicators/ema/ema.html" , function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#ema_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#ema_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#ema_stroke").css({
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
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                if (!validation.validateNumericBetween($html.find(".ema_input_width_for_period").val(),
                                                parseInt($html.find(".ema_input_width_for_period").attr("min")),
                                                parseInt($html.find(".ema_input_width_for_period").attr("max"))))
                                {
                                    require(["jquery", "jquery-growl"], function($) {
                                        $.growl.error({ message: "Only numbers between " + $html.find(".ema_input_width_for_period").attr("min")
                                                + " to " + $html.find(".ema_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".ema_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                    });
                                    return;
                                }

                                require(['charts/indicators/highcharts_custom/ema'], function ( ema ) {
                                    ema.init();
                                    var options = {
                                        period : parseInt($html.find(".ema_input_width_for_period").val()),
                                        stroke : defaultStrokeColor,
                                        strokeWidth : parseInt($html.find("#ema_strokeWidth").val()),
                                        dashStyle : $html.find("#ema_dashStyle").val(),
                                        appliedTo: parseInt($html.find("#ema_appliedTo").val())
                                    }
                                    //Add EMA for the main series
                                    $($(".ema").data('refererChartID')).highcharts().series[0].addEMA(options);
                                });

                                closeDialog.call($html);

                            });
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

            if ($(".ema").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".ema").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
