/**
Created By Mahboob.M on 12/16/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/wclprice/wclprice.css']);

        require(['text!charts/indicators/wclprice/wclprice.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.wclprice;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.wclprice-description').html(current_indicator_data.description);

            $html.find("#wclprice_line_stroke").each(function () {
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
            $('#wclprice_dash_style').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#wclprice_dash_style .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#wclprice_dash_style .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'wclprice-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var options = {
                                stroke: $("#wclprice_line_stroke").css("background-color"),
                                strokeWidth: parseInt($("#wclprice_stroke_width").val()),
                                dashStyle: selectedDashStyle
                            }
                            before_add_callback && before_add_callback();
                            //Add WCLPRICE to the main series
                            $($(".wclprice").data('refererChartID')).highcharts().series[0].addIndicator('wclprice', options);

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
                $(".wclprice").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".wclprice").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }
    };
});
