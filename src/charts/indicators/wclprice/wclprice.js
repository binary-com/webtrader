/**
Created By Mahboob.M on 12/16/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/wclprice/wclprice.css']);

        require(['text!charts/indicators/wclprice/wclprice.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#wclprice_line_stroke").each(function () {
                $(this).colorpicker({
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
                    $('#wclprice_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#wclprice_dash_style .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                buttons: [
					{
					    text: "OK",
					    click: function () {
					       
					        require(['charts/indicators/highcharts_custom/wclprice'], function (wclprice) {
					            wclprice.init();
					            var options = {
					                strokeColor: $("#wclprice_line_stroke").css("background-color"),
					                strokeWidth: parseInt($("#wclprice_stroke_width").val()),
					                dashStyle: selectedDashStyle
					            }
					            //Add WCLPRICE to the main series
					            $($(".wclprice").data('refererChartID')).highcharts().series[0].addWCLPRICE(options);
					        });

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

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash) {
            if ($(".wclprice").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".wclprice").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});
