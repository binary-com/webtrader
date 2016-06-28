/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", 'common/rivetsExtra', "jquery-ui", 'color-picker', 'ddslick'], function ($, rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/typprice/typprice.css']);

        require(['text!charts/indicators/typprice/typprice.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.typprice;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("input[type='button']").button();

            $html.find("#typprice_stroke").colorpicker({
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
                    $("#typprice_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#typprice_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#typprice_dashStyle').ddslick({
                imagePosition: "left",
                width: 138,
                background: "white",
                onSelected: function (data) {
                    $('#typprice_dashStyle .dd-selected-image').css('max-width', '105px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#typprice_dashStyle .dd-option-image').css('max-width', '105px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 350,
                height: 400,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'typprice-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            //console.log('Ok button is clicked!');
                            var options = {
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#typprice_strokeWidth").val()),
                                dashStyle: selectedDashStyle
                            }
                            //Add TYPPRICE for the main series
                            $($(".typprice").data('refererChartID')).highcharts().series[0].addIndicator('typprice', options);

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

            if (typeof _callback == "function") {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash) {

            if ($(".typprice").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".typprice").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
