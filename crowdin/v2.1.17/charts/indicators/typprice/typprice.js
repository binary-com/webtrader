/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

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
            $html.attr('title', current_indicator_data.long_display_name);

            $html.find("input[type='button']").button();

            $html.find("#typprice_stroke").colorpicker({
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
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#typprice_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#typprice_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 350,
                height: 300,
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
                            before_add_callback && before_add_callback();
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
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if (typeof _callback == "function") {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash, before_add_cb) {
            var open = function() {
                before_add_callback = before_add_cb;
                $(".typprice").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".typprice").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
