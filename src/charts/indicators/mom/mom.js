/**
 * Created by Majboob.M on 2/2/16.
 */

define(["jquery",  "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/mom/mom.css']);

        var defaultLevels = [];

        require(['text!charts/indicators/mom/mom.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.mom;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.mom-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#mom_stroke").colorpicker({
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
                    $("#mom_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#mom_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#mom_dashStyle').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#mom_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#mom_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'mom-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                             var $elem = $(".mom_input_width_for_period");
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
                                period: parseInt($html.find(".mom_input_width_for_period").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#mom_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#mom_appliedTo").val()),
                                levels: []
                            };
                            before_add_callback && before_add_callback();
                            //Add MOM for the main series
                            $($(".mom").data('refererChartID')).highcharts().series[0].addIndicator('mom', options);

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
                $(".mom").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".mom").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
