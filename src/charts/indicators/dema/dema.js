/**
 * Created by Mahboob.M on 12/20/15.
 */

define(["jquery", "common/rivetsExtra", "jquery-ui", 'color-picker', 'ddslick'], function ($,rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/dema/dema.css']);

        require(['text!charts/indicators/dema/dema.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.dema;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("input[type='button']").button();

            $html.find("#dema_stroke").colorpicker({
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
                    $("#dema_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#dema_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#dema_dashStyle').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#dema_dashStyle .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#dema_dashStyle .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'dema-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var $elem = $(".dema_input_width_for_period");
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
                                period: parseInt($html.find(".dema_input_width_for_period").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#dema_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#dema_appliedTo").val())
                            }
                            //Add DEMA for the main series
                            $($(".dema").data('refererChartID')).highcharts().series[0].addIndicator('dema', options);

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

        open: function (containerIDWithHash) {

            if ($(".dema").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".dema").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
