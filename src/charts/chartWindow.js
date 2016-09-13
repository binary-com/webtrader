/**
 * Created by arnab on 2/13/15.
 */

define(["jquery","windows/windows", "text!charts/chartWindow.html", 'lodash', "jquery.dialogextend", 'common/util'], function ($,windows, $chartWindowHtml, _) {

    "use strict";

    function _trigger_Resize_Effects() {
        $(this).find(".chartSubContainer").width($(this).width() - 10);
        //Because of title taking space, we have to reduce height
        $(this).find(".chartSubContainer").height($(this).height() - 55);
        $(this).trigger("resize-event");
        var containerIDWithHash = "#" + $(this).find(".chartSubContainer").attr("id");
        require(["charts/charts"], function(charts) {
            charts.triggerReflow(containerIDWithHash);
        });
    }

    var options_store = {};
    var chart_window_functions = {

        /**
         * @param options
         * @returns {*}
         */
        addNewWindow: function(options) {
            var options_copy = options;
            options = $.extend({
                title: options.instrumentName,
                close: function () {
                    var id = $(this).attr('id');
                    var container = $("#" + id + "_chart");
                    var timePeriod = container.data("timePeriod");
                    var instrumentCode = container.data('instrumentCode');
                    container.highcharts().destroy();
                    $(this).dialog('destroy').remove(); //completely remove this dialog
                    require(["charts/charts"], function (charts) {
                        charts.destroy({
                            containerIDWithHash : "#" + id + "_chart",
                            timePeriod : timePeriod,
                            instrumentCode : instrumentCode
                        });
                    });
                    require(["charts/chartOptions"], function (chartOptions) {
                        chartOptions.cleanBinding( id );
                    });
                },
                resize: _trigger_Resize_Effects,
                refresh: function() {
                    require(["charts/charts"], function( charts ) {
                        charts.refresh( '#' + id + '_chart' );
                    });
                }
            }, options );
            var dialog = windows.createBlankWindow($($chartWindowHtml).i18n(), options),
                id = dialog.attr('id');
            dialog.find('div.chartSubContainerHeader').attr('id', id + "_header").end()
                .find('div.chartSubContainer').attr('id', id + "_chart").end();

            require(["charts/charts"], function (charts) {
                charts.drawChart("#" + id + "_chart", options, options.resize.bind(dialog));

                /* initialize chartOptions & table-view once chart is rendered */
                require(["charts/chartOptions", "charts/tableView"], function (chartOptions, tableView) {
                    var table_view = tableView.init(dialog);
                    chartOptions.init(id, options.timePeriod, options.type, table_view.show, options.instrumentName, options.instrumentCode);
                });
            });

            /* tracking the chart, includion indicators & overlyas */
            options_store[id] = options_copy;
            options_store[id].indicators = options_store[id].indicators || [];
            options_store[id].overlays = options_store[id].overlays || [];
            var update_track = dialog.track({
              module_id: 'chartWindow',
              is_unique: false,
              data: options_store[id]
            });
            dialog.on('chart-type-changed', function(e, type){
              options_store[id].type = type;
              update_track(options_store[id]);
            });
            dialog.on('chart-time-period-changed',function(e, timePeriod){
              options_store[id].timePeriod = timePeriod;
              update_track(options_store[id]);
            });
            dialog.on('chart-indicators-changed',function(e, chart){
              options_store[id].indicators = chart.get_indicators();
              update_track(options_store[id]);
            });
            dialog.on('chart-overlay-add',function(e, overlay){
              options_store[id].overlays.push(overlay);
              update_track(options_store[id]);
            });
            dialog.on('chart-overlay-remove',function(e, displaySymbol){
              _.remove(options_store[id].overlays, displaySymbol);
              update_track(options_store[id]);
            });
            dialog.on('chart-options-changed',function(e){
              update_track(options_store[id]);
            });
            dialog.dialog('open');

            return dialog;
        },

        // This is for affiliates. Hope it works. Fingers crossed.
        add_chart_options: function(id, options) {
          var dialog = $("#"+id);
          options_store[id] = options;
          options_store[id].indicators = options_store[id].indicators || [];
          options_store[id].overlays = options_store[id].overlays || [];
          dialog.on('chart-type-changed', function(e, type){
            options_store[id].type = type;
          });
          dialog.on('chart-time-period-changed',function(e, timePeriod){
            options_store[id].timePeriod = timePeriod;
          });
          dialog.on('chart-indicators-changed',function(e, chart){
            options_store[id].indicators = chart.get_indicators();
          });
          dialog.on('chart-overlay-add',function(e, overlay){
            options_store[id].overlays.push(overlay);
          });
          dialog.on('chart-overlay-remove',function(e, displaySymbol){
            _.remove(options_store[id].overlays, displaySymbol);
          });
        },

        totalWindows : function() {
            return $("div.webtrader-dialog").length;
        },

        /* id of dialog. WITHOUT '#' prefix or '_chart' suffix */
        get_chart_options: function(dialog_id) {
          var options =  _.cloneDeep(options_store[dialog_id]);
          if(!options.name) {
            options.name = '';
          }
          return options;
        },
        set_chart_options: function(dialog_id, options){
          options.instrumentCode = options_store[dialog_id].instrumentCode;
          options.instrumentName = options_store[dialog_id].instrumentName;
          options_store[dialog_id] = options;
          $('#'+ dialog_id).trigger('chart-options-changed');
        },
        apply_chart_options: function(dialog_id, options){
          chart_window_functions.set_chart_options(dialog_id, options);
          require(['charts/charts', 'charts/chartOptions'], function(charts, chartOptions){
            chartOptions.updateOptions( /* update the chart options settings */
              dialog_id, options.type, options.timePeriod, options.indicators.length, options.overlays.length);
            charts.refresh('#'+dialog_id + '_chart', options.timePeriod, options.type, options.indicators, options.overlays);
          });
        },

        /**
         * @param callerContext - Should be the Jquery object for dialog
         */
        triggerResizeEffects : function( callerContext ) {
            _trigger_Resize_Effects.call( callerContext );
        },

        changeChartWindowTitle : function(dialogId, instrumentName, timePeriod) {
            $('#' + dialogId).dialog('option', 'title', instrumentName + " (" + timePeriod + ")");
        }
    };
    return chart_window_functions;
});
