/**
 * Created by Maahboob.M on 2/18/16.
 */

define(["jquery", 'lodash', "jquery-ui", 'color-picker', 'ddslick'], function ($, _) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/fractal/fractal.css']);

        require(['text!charts/indicators/fractal/fractal.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultColor = '#cd0a0a';

            $html = $($html);
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.fractal;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.fractal-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#fractal_color").colorpicker({
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
                width: 350,
                height: 260,
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
                            before_add_callback && before_add_callback();
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

        open: function (containerIDWithHash, before_add_cb) {
            var open = function() {
                before_add_callback = before_add_cb;
                $(".fractal").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".fractal").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
