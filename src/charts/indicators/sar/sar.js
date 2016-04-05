/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/sar/sar.css']);

        require(['text!charts/indicators/sar/sar.html'], function ($html) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#sar_stroke").colorpicker({
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#sar_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#sar_stroke").css({
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
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function () {

                            var isValid = true;
                            $('.sar_input_width_for_period').each(function () {
                                if (!$.isNumeric($(this).val())) {
                                    require(["jquery", "jquery-growl"], function ($) {
                                        $.growl.error({ message: "Only numeric value allowed!" });
                                    });
                                    $elem.val($elem.prop("defaultValue"));
                                    isValid = false;
                                    return isValid;
                                }
                            });
                            if (!isValid) return;

                            var options = {
                                acceleration: parseFloat($html.find("#sar_acceleration").val()),
                                maximum: parseFloat($html.find("#sar_maximum").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#sar_strokeWidth").val()),
                                dashStyle: 'line'
                            }
                            //Add sar for the main series
                            $($(".sar").data('refererChartID')).highcharts().series[0].addIndicator('sar', options);

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
                width : 140
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash) {

            if ($(".sar").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".sar").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});