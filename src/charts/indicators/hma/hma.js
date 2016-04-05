﻿/**
Created By Mahboob.M on 12/22/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/hma/hma.css']);

        require(['text!charts/indicators/hma/hma.html'], function ($html) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);

            $html.appendTo("body");

            $html.find("#hma_stroke_color").each(function () {
                $(this).colorpicker({
                    part: {
                        map: { size: 128 },
                        bar: { size: 128 }
                    },
                    select: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        defaultStrokeColor = '#' + color.formatted;
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        defaultStrokeColor = '#' + color.formatted;
                    }
                });
            });

            var selectedDashStyle = "Solid";
            $('#hma_dash_style').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#hma_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#hma_dash_style .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'hma-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					         var $elem = $(".hma_input_width_for_period");
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
                                period: parseInt($("#hma_period").val()),
                                maType: $("#hma_ma_type").val(),
                                stroke : defaultStrokeColor,
                                strokeWidth: parseInt($("#hma_stroke_width").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#hma_appliedTo").val())
                            }

                            //Add HMA to the main series
                            $($(".hma").data('refererChartID')).highcharts().series[0].addIndicator('hma', options);

					        closeDialog.call($html);
					    }
					},
					{
					    text: "Cancel",
					    click: function () {
					        closeDialog.call(this);
					    }
					}
                ]
            });
            $html.find('select').selectmenu({
                width : 150
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash) {
            if ($(".hma").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".hma").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});