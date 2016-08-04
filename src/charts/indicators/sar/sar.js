/**
 * Created by arnab on 3/1/15.
 */

define(["jquery",  "jquery-ui", 'color-picker'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/sar/sar.css']);

        require(['text!charts/indicators/sar/sar.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.sar;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.sar-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#sar_stroke").colorpicker({
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
                width: 350,
                height: 400,
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
                            before_add_callback && before_add_callback();
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
                $(".sar").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".sar").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
