/**
 * Created by Mahboob.M on 12/20/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/kama/kama.css']);

        require(['text!charts/indicators/kama/kama.html'], function ($html) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#kama_stroke").colorpicker({
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#kama_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#kama_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#kama_dashStyle').ddslick({
                imagePosition: "left",
                width: 158,
                background: "white",
                onSelected: function (data) {
                    $('#kama_dashStyle .dd-selected-image').css('max-width', '125px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#kama_dashStyle .dd-option-image').css('max-width', '125px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 335,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'kama-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var isValid = true;
                            $(".kama_input_width_for_period").each(function () {
                                if (!_.inRange($(this).val(), parseInt($(this).attr("min")), parseInt($(this).attr("max")))) {
                                    var $elem = $(this);
                                    require(["jquery", "jquery-growl"], function ($) {
                                        $.growl.error({
                                            message: "Only numbers between " + $elem.attr("min")
                                                    + " to " + $elem.attr("max")
                                                    + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                        });
                                    });
                                    isValid = false;
                                    return;
                                }
                            });;

                            if (!isValid) return;

                            var options = {
                                period: parseInt($html.find("#kama_period").val()),
                                fastPeriod: parseInt($html.find("#kama_fast_period").val()),
                                slowPeriod: parseInt($html.find("#kama_slow_period").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#kama_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#kama_appliedTo").val())
                            }
                            //Add KAMA for the main series
                            $($(".kama").data('refererChartID')).highcharts().series[0].addIndicator('kama', options);

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
                width : 160
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }


        });

    }

    return {

        open: function (containerIDWithHash) {

            if ($(".kama").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".kama").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
