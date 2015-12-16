/**
Created By Mahboob.M on 12/16/2015
*/

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

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
					    text: "Ok",
					    click: function () {
					       
					        require(['charts/indicators/highcharts_custom/wclprice'], function (wclprice) {
					            wclprice.init();
					            var options = {
					                strokeColor: $("#wclprice_line_stroke").css("background-color"),
					                strokeWidth: parseInt($("#wclprice_stroke_width").val()),
					                dashStyle: $("#wclprice_dash_style").val()
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