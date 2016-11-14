﻿/**
 * Created by Mahboob.M on 2/8/16.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/dc/dc.css']);

        require(['text!charts/indicators/dc/dc.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            $html = $($html);
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.dc;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.dc-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

             $html.find("#dc_high_stroke,#dc_low_stroke").each(function () {
                $(this).colorpicker({
					showOn: 'click',
                    position: {
                        at: "right+100 bottom",
                        of: "element",
                        collision: "fit"
                    },
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
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#dc_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#dc_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 350,
                height:400,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'dc-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            var $elem = $(".dc_input_width_for_period");
                            if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(),
                                            parseInt($elem.attr("min")),
                                            parseInt($elem.attr("max")) + 1)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $elem.attr("min")
                                                + " to " + $elem.attr("max")
                                                + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                $elem.val($elem.prop("defaultValue"));
                                return;
                            };

                            var options = {
                                period : parseInt($html.find(".dc_input_width_for_period").val()),
                                highStroke: $("#dc_high_stroke").css("background-color"),
                                lowStroke : $("#dc_low_stroke").css("background-color"),
                                strokeWidth : parseInt($html.find("#dc_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#dc_appliedTo").val())
                            }
                            before_add_callback && before_add_callback();
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
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash, before_add_cb ) {
            before_add_callback = before_add_cb || before_add_callback;
            var open = function() {
                $(".dc").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".dc").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
