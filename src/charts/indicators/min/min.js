/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'common/loadCSS'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        loadCSS('charts/indicators/min/min.css');

        $.get("charts/indicators/min/min.html" , function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#min_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#min_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#min_stroke").css({
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
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                if (!validation.validateNumericBetween($html.find(".min_input_width_for_period").val(),
                                                parseInt($html.find(".min_input_width_for_period").attr("min")),
                                                parseInt($html.find(".min_input_width_for_period").attr("max"))))
                                {
                                    require(["jquery", "jquery-growl"], function($) {
                                        $.growl.error({ message: "Only numbers between " + $html.find(".min_input_width_for_period").attr("min")
                                                + " to " + $html.find(".min_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".min_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                    });
                                    return;
                                }

                                require(['charts/indicators/highcharts_custom/min'], function ( min ) {
                                    min.init();
                                    var options = {
                                        period : parseInt($html.find(".min_input_width_for_period").val()),
                                        stroke : defaultStrokeColor,
                                        strokeWidth : parseInt($html.find("#min_strokeWidth").val()),
                                        dashStyle : $html.find("#min_dashStyle").val(),
                                        appliedTo: parseInt($html.find("#min_appliedTo").val())
                                    }
                                    //Add MIN for the main series
                                    $($(".min").data('refererChartID')).highcharts().series[0].addMIN(options);
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

            if ($(".min").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".min").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
