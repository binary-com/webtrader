/**
 * Created by Maahboob.M on 2/18/16.
 */

define(["jquery", 'lodash', "jquery-ui", 'color-picker', 'ddslick'], function ($, _) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/fractal/fractal.css']);

        require(['text!charts/indicators/fractal/fractal.html'], function ($html) {

            var defaultColor = '#cd0a0a';

            $html = $($html);
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#fractal_color").colorpicker({
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

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 315,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'fractal-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var $elem = $('#number_of_bars');
                            if (!_.inRange($elem.val(),
                                            parseInt($elem.attr("min")),
                                            parseInt($elem.attr("max")) + 1)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $elem.attr("min")
                                                + " to " + $elem.attr("max")
                                                + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            };

                            if (Math.abs(parseInt($elem.val() % 2)) === 0) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "The number of bars on sides should be an odd number!"
                                    });
                                });
                                return;
                            };

                            var series = $($(".fractal").data('refererChartID')).highcharts().series[0];
                            console.log('Add fractal action');
                            var options = {
                                numberOfBars: parseInt($elem.val()),
                                color: defaultColor,
                                onSeriesID: series.options.id
                            };
                            //Add fractal for the main series
                            series.addIndicator('fractal', options);

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

            if (_.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash) {

            if ($(".fractal").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".fractal").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
