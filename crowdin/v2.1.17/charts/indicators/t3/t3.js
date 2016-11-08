/**
Created By Mahboob.M on 12/20/2015
*/
define(["jquery",  "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/t3/t3.css']);

        require(['text!charts/indicators/t3/t3.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.t3;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.t3-description').html(current_indicator_data.description);

            $html.find("#t3_stroke").each(function () {
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

            var selectedDashStyle = "Solid";
            $('#t3_dash_style').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#t3_dash_style .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#t3_dash_style .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 't3-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var $periodElem = $("#t3_period");
                            if (!_.isInteger(_.toNumber($periodElem.val())) || !_.inRange($periodElem.val(),
                                            parseInt($periodElem.attr("min")),
                                            parseInt($periodElem.attr("max")) + 1)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $periodElem.attr("min")
                                                + " to " + $periodElem.attr("max")
                                                + " is allowed for " + $periodElem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                $periodElem.val($periodElem.prop("defaultValue"));
                                return;
                            };
                             var $vFactorElem = $("#t3_volume_factor");
                            if (!_.inRange($vFactorElem.val(),
                                            parseInt($vFactorElem.attr("min")),
                                            parseInt($vFactorElem.attr("max")) + 0.01)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $vFactorElem.attr("min")
                                                + " to " + $vFactorElem.attr("max")
                                                + " is allowed for " + $vFactorElem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                $vFactorElem.val($vFactorElem.prop("defaultValue"));
                                return;
                            };

                            var options = {
                                period: parseInt($("#t3_period").val()),
                                vFactor: parseFloat($("#t3_volume_factor").val()),
                                stroke: $("#t3_stroke").css("background-color"),
                                strokeWidth: parseInt($("#t3_stroke_width").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($("#t3_applied_to").val())
                            }
                            before_add_callback && before_add_callback();
                            //Add Bollinger for the main series
                            $($(".t3").data('refererChartID')).highcharts().series[0].addIndicator('t3', options);

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
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash, before_add_cb) {
            var open = function() {
                before_add_callback = before_add_cb;
                $(".t3").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".t3").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }
    };
});
