/**
Created By Mahboob.M on 12/22/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/hma/hma.css']);

        require(['text!charts/indicators/hma/hma.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.hma;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.hma-description').html(current_indicator_data.description);

            $html.find("#hma_stroke_color").each(function () {
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
                        defaultStrokeColor = '#' + color.formatted;
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        defaultStrokeColor = '#' + color.formatted;
                    }
                });
            });

            var selectedDashStyle = "Solid";
            $('#hma_dash_style').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#hma_dash_style .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#hma_dash_style .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'hma-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					         var $elem = $(".hma_input_width_for_period");
					         if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(),
                                             parseInt($elem.attr("min")),
                                             parseInt($elem.attr("max")) + 1)) {
					             require(["jquery", "jquery-growl"], function ($) {
					                 $.growl.error({
					                     message: "Only numbers between " + $elem.attr("min")
                                                 + " to " + $elem.attr("max")
                                                 + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
					                 });
					             });
                                 $elem.val($elem.prop("defaultValue"));
					             return;
					         };

                            var options = {
                                period: parseInt($("#hma_period").val()),
                                maType: $("#hma_ma_type").val(),
                                stroke : defaultStrokeColor,
                                strokeWidth: parseInt($("#hma_stroke_width").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#hma_appliedTo").val())
                            }

                            before_add_callback && before_add_callback();
                            //Add HMA to the main series
                            $($(".hma").data('refererChartID')).highcharts().series[0].addIndicator('hma', options);

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
                $(".hma").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".hma").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }
    };
});
