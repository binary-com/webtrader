/**
Created By Mahboob.M on 12/22/2015
*/

define(["jquery", 'common/rivetsExtra', "jquery-ui", 'color-picker', 'ddslick'], function ($, rv) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/smma/smma.css']);

        require(['text!charts/indicators/smma/smma.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.smma;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("#smma_stroke_color").each(function () {
                $(this).colorpicker({
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

            var selectedDashStyle = "Solid";
            $('#smma_dash_style').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#smma_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#smma_dash_style .dd-option-image').css('max-width', '115px');


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'smma-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					       var $elem = $(".smma_input_width_for_period");
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
					            period: parseInt($("#smma_period").val()),
					            stroke: $("#smma_stroke_color").css("background-color"),
					            strokeWidth: parseInt($("#smma_stroke_width").val()),
					            dashStyle: selectedDashStyle,
					            appliedTo: parseInt($html.find("#smma_appliedTo").val())
					        }

					        //Add SMMA to the main series
					        $($(".smma").data('refererChartID')).highcharts().series[0].addIndicator('smma', options);

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
            if ($(".smma").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".smma").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});