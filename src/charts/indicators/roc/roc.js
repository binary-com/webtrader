/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/roc/roc.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [];

        require(['text!charts/indicators/roc/roc.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#roc_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#roc_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#roc_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#roc_dashStyle').ddslick({
                imagePosition: "left",
                width: 118,
                background: "white",
                onSelected: function (data) {
                    $('#roc_dashStyle .dd-selected-image').css('max-width', '85px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#roc_dashStyle .dd-option-image').css('max-width', '85px');

            var table = $html.find('#roc_levels').DataTable({
                paging: false,
                scrollY: 100,
                autoWidth: true,
                searching: false,
                info: false
            });
            $.each(defaultLevels, function (index, value) {
                $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                    '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                    .data("level", value)
                    .on('click', function () {
                        $(this).toggleClass('selected');
                    } );
            });
            $html.find('#roc_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select levels to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#roc_level_add').click(function () {
                require(["charts/indicators/roc/roc_level"], function(roc_level) {
                    roc_level.open(containerIDWithHash, function (levels) {
                        $.each(levels, function (ind, value) {
                            $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                                '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                                .data("level", value)
                                .on('click', function () {
                                    $(this).toggleClass('selected');
                                } );
                        });
                    });
                });
            });


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'roc-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            if (!isNumericBetween($html.find(".roc_input_width_for_period").val(),
                                            parseInt($html.find(".roc_input_width_for_period").attr("min")),
                                            parseInt($html.find(".roc_input_width_for_period").attr("max"))))
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({ message: "Only numbers between " + $html.find(".roc_input_width_for_period").attr("min")
                                            + " to " + $html.find(".roc_input_width_for_period").attr("max")
                                            + " is allowed for " + $html.find(".roc_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                });
                                return;
                            }

                            require(['charts/indicators/highcharts_custom/roc'], function ( roc ) {
                                roc.init();
                                var levels = [];
                                $.each(table.rows().nodes(), function () {
                                    var data = $(this).data('level');
                                    if (data) {
                                        levels.push({
                                            color: data.stroke,
                                            dashStyle: data.dashStyle,
                                            width: data.strokeWidth,
                                            value: data.level,
                                            label: {
                                                text: data.level
                                            }
                                        });
                                    }
                                });
                                var options = {
                                    period : parseInt($html.find(".roc_input_width_for_period").val()),
                                    stroke : defaultStrokeColor,
                                    strokeWidth : parseInt($html.find("#roc_strokeWidth").val()),
                                    dashStyle: selectedDashStyle,
                                    levels : levels
                                };
                                //Add ROC for the main series
                                $($(".roc").data('refererChartID')).highcharts().series[0].addROC(options);
                            });

                            closeDialog.call($html);
                        }
                    },
                    {
                        text: "Cancel",
                        click: function() {
                            closeDialog.call(this);
                        }
                    }
                ]
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".roc").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".roc").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
