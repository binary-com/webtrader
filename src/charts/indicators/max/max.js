/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/max/max.css']);

        require(['text!charts/indicators/max/max.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#max_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#max_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#max_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#max_dashStyle').ddslick({
                imagePosition: "left",
                width: 138,
                background: "white",
                onSelected: function (data) {
                    $('#max_dashStyle .dd-selected-image').css('max-width', '105px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#max_dashStyle .dd-option-image').css('max-width', '105px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 280,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'max-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            if (!isNumericBetween($html.find(".max_input_width_for_period").val(),
                                            parseInt($html.find(".max_input_width_for_period").attr("min")),
                                            parseInt($html.find(".max_input_width_for_period").attr("max"))))
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({ message: "Only numbers between " + $html.find(".max_input_width_for_period").attr("min")
                                            + " to " + $html.find(".max_input_width_for_period").attr("max")
                                            + " is allowed for " + $html.find(".max_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                });
                                return;
                            }

                            require(['charts/indicators/highcharts_custom/max'], function ( max ) {
                                max.init();
                                var options = {
                                    period : parseInt($html.find(".max_input_width_for_period").val()),
                                    stroke : defaultStrokeColor,
                                    strokeWidth : parseInt($html.find("#max_strokeWidth").val()),
                                    dashStyle: selectedDashStyle,
                                    appliedTo: parseInt($html.find("#max_appliedTo").val())
                                }
                                //Add MAX for the main series
                                $($(".max").data('refererChartID')).highcharts().series[0].addMAX(options);
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

            if ($(".max").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".max").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
