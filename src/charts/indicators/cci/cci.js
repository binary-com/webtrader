/**
Created By Mahboob.M on 12/16/2015
*/

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/cci/cci.css']);

        require(['text!charts/indicators/cci/cci.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#cci_stroke_color").each(function () {
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

					        require(['charts/indicators/highcharts_custom/cci'], function (cci) {
					            cci.init();
					            var options = {
					                period: parseInt($("#cci_period").val()),
					                maType:$("#cci_ma_type").val(),
					                strokeColor: $("#cci_stroke_color").css("background-color"),
					                strokeWidth: parseInt($("#cci_stroke_width").val()),
					                dashStyle: $("#cci_dash_style").val()
					            }
					            //Add CCI to the main series
					            $($(".cci").data('refererChartID')).highcharts().series[0].addCCI(options);
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
            if ($(".cci").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cci").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});