/**
 * Created by Mahboob.M on 2/8/16.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/dc/dc.css']);

        require(['text!charts/indicators/dc/dc.html'], function ( $html ) {

            $html = $($html);
            $html.appendTo("body");
            $html.find("input[type='button']").button();

             $html.find("#dc_high_stroke,#dc_low_stroke").each(function () {
                $(this).colorpicker({
                    part: {
                        map: { size: 128 },
                        bar: { size: 128 }
                    },
                    select: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    }
                });
             });
            $("#dc_high_stroke").css("background", '#2a277a');
            $("#dc_low_stroke").css("background", 'red');

            var selectedDashStyle = "Solid";
            $('#dc_dashStyle').ddslick({
                imagePosition: "left",
                width: 138,
                background: "white",
                onSelected: function (data) {
                    $('#dc_dashStyle .dd-selected-image').css('max-width', '105px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#dc_dashStyle .dd-option-image').css('max-width', '105px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 350,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'dc-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            if (!_.inRange($html.find(".dc_input_width_for_period").val(),
                                            parseInt($html.find(".dc_input_width_for_period").attr("min")),
                                            parseInt($html.find(".dc_input_width_for_period").attr("max"))))
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({ message: "Only numbers between " + $html.find(".dc_input_width_for_period").attr("min")
                                            + " to " + $html.find(".dc_input_width_for_period").attr("max")
                                            + " is allowed for " + $html.find(".dc_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                });
                                return;
                            }

                            var options = {
                                period : parseInt($html.find(".dc_input_width_for_period").val()),
                                highStroke: $("#dc_high_stroke").css("background-color"),
                                lowStroke : $("#dc_low_stroke").css("background-color"),
                                strokeWidth : parseInt($html.find("#dc_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#dc_appliedTo").val())
                            }
                            //Add DC for the main series
                            $($(".dc").data('refererChartID')).highcharts().series[0].addIndicator('dc', options);

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
            $html.find('select').selectmenu({
                width : 140
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".dc").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".dc").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
