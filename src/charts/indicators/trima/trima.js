/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'loadCSS'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        loadCSS('charts/indicators/trima/trima.css');

        $.get("charts/indicators/trima/trima.html" , function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#trima_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#trima_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#trima_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 320,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                if (!validation.validateNumericBetween($html.find(".trima_input_width_for_period").val(),
                                                parseInt($html.find(".trima_input_width_for_period").attr("min")),
                                                parseInt($html.find(".trima_input_width_for_period").attr("max"))))
                                {
                                    require(["jquery", "jquery-growl"], function($) {
                                        $.growl.error({ message: "Only numbers between " + $html.find(".trima_input_width_for_period").attr("min")
                                                + " to " + $html.find(".trima_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".trima_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                    });
                                    return;
                                }

                                require(['charts/indicators/highcharts_custom/trima'], function ( trima ) {
                                    trima.init();
                                    var options = {
                                        period : parseInt($html.find(".trima_input_width_for_period").val()),
                                        stroke : defaultStrokeColor,
                                        strokeWidth : parseInt($html.find("#trima_strokeWidth").val()),
                                        dashStyle : $html.find("#trima_dashStyle").val(),
                                        appliedTo: parseInt($html.find("#trima_appliedTo").val())
                                    }
                                    //Add TRIMA for the main series
                                    $($(".trima").data('refererChartID')).highcharts().series[0].addTRIMA(options);
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

            if ($(".trima").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".trima").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
