/**
 * Created by arnab on 2/16/15.
 */

define(['jquery', 'common/rivetsExtra', "charts/chartWindow", "charts/charts", 'moment', 'charts/chartingRequestMap', "common/util"], function($, rv, chartWindow, charts, moment, chartingRequestMap) {

    var state = [], view = [];

    var timeperiod_arr = [{value: "1t", name: "1 Tick", type: "ticks"}, 
        {value: "1m", name: "1 Minute", type: "minutes"}, 
        {value: "2m", name: "2 Minutes", type: "minutes"},
        {value: "3m", name: "3 Minutes", type: "minutes"}, 
        {value: "5m", name: "5 Minutes", type: "minutes"},
        {value: "10m", name: "10 Minutes", type: "minutes"}, 
        {value: "15m", name: "15 Minutes", type: "minutes"},
        {value: "30m", name: "30 Minutes", type: "minutes"},
        {value: "1h", name: "1 Hour", type: "hours"}, 
        {value: "2h", name: "2 Hours", type: "hours"}, 
        {value: "4h", name: "4 Hours", type: "hours"}, 
        {value: "8h", name: "8 Hours", type: "hours"},
        {value: "1d", name: "1 Day", type: "days"}];

    var chartType_arr = [{value:'candlestick', name:'Candles'}, {value:'ohlc', name:'OHLC'}, 
        {value:'line', name:'Line'}, {value:'dot', name:'Dot'}, {value:'linedot', name:'Line Dot'}, 
        {value:'spline', name:'Spline'}, {value:'table', name:'Table'}];
        i18n_name = (local_storage.get('i18n') || { value: 'en' }).value,
        urlShareTemplate = 'https://webtrader.binary.com?affiliates=true&instrument={0}&timePeriod={1}&lang=' + i18n_name,
        iframeShareTemplate = '<iframe src="' + urlShareTemplate + '" width="350" height="400" style="overflow-y : hidden;" scrolling="no" />',
        twitterShareTemplate = 'https://twitter.com/share?url={0}&text={1}',
        fbShareTemplate = 'https://facebook.com/sharer/sharer.php?u={0}',
        gPlusShareTemplate = 'https://plus.google.com/share?url={0}',
        bloggerShareTemplate = 'https://www.blogger.com/blog-this.g?u={0}&n={1}',
        vkShareTemplate = 'http://vk.com/share.php?url={0}&title={1}';

    function hideOverlays(scope) {
        scope.showTimePeriodSelector    = false;
        scope.toggleChartTypeSelector(null, scope);
        scope.toggleDrawingToolSelector(null, scope);
        scope.toggleExportSelector(null, scope);
    }

    function changeChartType(scope, chartType) {
        if (chartType == 'table') {
            //Do not change chart type
            state[scope.newTabId].showChartTypeSelector = false;
            scope.tableViewCallback && scope.tableViewCallback();
        } else {
            state[scope.newTabId].chartType = chartType_arr.filter(function(chart){return chart.value==chartType})[0];
            state[scope.newTabId].showChartTypeSelector = false;
            charts.refresh('#' + scope.newTabId + '_chart', null, chartType);
            /* trigger an event on the chart dialog, so we can listen on type changes,
             * note: this will be use to update chart state for tracker.js */
            $('#' + scope.newTabId).trigger('chart-type-changed', chartType);
            showCandlestickAndOHLC(scope.newTabId,!isTick(state[scope.newTabId].timePeriod.value) && !isOverlaidView("#"+state[scope.newTabId].newTabId+"_chart"));
        }
        hideOverlays(scope);
    }

    function isOverlaidView(containerIDWithHash) {
        var isOverlaid = false;
        var existingChart = $(containerIDWithHash).highcharts();
        if (existingChart) {
            existingChart.series.forEach(function(f) {
                if (f.options.compare === 'percent') {
                    isOverlaid = true;
                }
            });
        }
        return isOverlaid;
    }
    function showCandlestickAndOHLC(newTabId, show) {
        state[newTabId].chartTypes = chartType_arr.filter(
            function(chartType){
                if(!show){
                    return chartType.value!==state[newTabId].chartType.value && chartType.value !== "candlestick" && chartType.value !== "ohlc";
                }
                return chartType.value!==state[newTabId].chartType.value;
            });

        if(state[newTabId].chartType.value ==="ohlc" || state[newTabId].chartType.value === "candlestick"){
            state[newTabId].chartTypes[0].showBorder = true;
        } else if(state[newTabId].chartTypes[1].value === "ohlc") {
            state[newTabId].chartTypes[0].showBorder = undefined;
            state[newTabId].chartTypes[1].showBorder = true;
        }
    }

    return {

        init : function (m_newTabId, m_timePeriod, m_chartType, m_tableViewCb, m_instrumentName, m_instrumentCode) {

            require(['text!charts/chartOptions.html','css!charts/chartOptions.css'], function(html) {

                if (view[m_newTabId]) view[m_newTabId].unbind();
                var timePeriod = timeperiod_arr.filter(function(obj){return m_timePeriod==obj.value})[0];
                state[m_newTabId] = {
                    //Input parameters
                    newTabId : m_newTabId,
                    timePeriod : timePeriod,
                    chartType : chartType_arr.filter(function(chart){return chart.value==m_chartType})[0],
                    tableViewCallback: m_tableViewCb, //Callback for table view
                    instrumentName : m_instrumentName,
                    instrumentCode : m_instrumentCode,
                    indicatorsCount : 0,
                    overlayCount: 0,

                    showTimePeriodSelector : false,
                    showChartTypeSelector : false,
                    showTableOption : true,
                    enableCrosshair : true,
                    showDrawingToolSelector : false,
                    showExportSelector : false,

                    exportChartURLShare : urlShareTemplate.format(m_instrumentCode, m_timePeriod),
                    exportChartIframeShare : iframeShareTemplate.format(m_instrumentCode, m_timePeriod),

                    fbShareLink : fbShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod))),
                    twitterShareLink : twitterShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')'),
                    gPlusShareLink : gPlusShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod))),
                    bloggerShareLink : bloggerShareTemplate.format(urlShareTemplate.format(m_instrumentCode, m_timePeriod), m_instrumentName + '(' + m_timePeriod + ')'),
                    vkShareLink : vkShareTemplate.format(urlShareTemplate.format(m_instrumentCode, m_timePeriod), m_instrumentName + '(' + m_timePeriod + ')')

                }, view[m_newTabId] = null;

                state[m_newTabId].toggleTimerPeriodSelector = function(event, scope) {
                    var temp = !scope.showTimePeriodSelector;
                    hideOverlays(scope);
                    scope.showTimePeriodSelector = temp;
                };
                state[m_newTabId].toggleChartTypeSelector = function(event, scope) {
                    var temp = !scope.showChartTypeSelector;
                    var ele = $("#" + scope.newTabId + " .chart_type .img img")[0];
                    if(temp==true && event){
                        hideOverlays(scope);
                        scope.showChartTypeSelector = temp;
                        ele.src = ele.src.replace(".svg","-w.svg");
                    } else{
                        scope.showChartTypeSelector = false;
                        ele.src = ele.src.replace("-w","");
                    }
                };

                state[m_newTabId].addRemoveIndicator = function(event, scope) {
                    require(["charts/indicators/indicatorManagement"], function( indicatorManagement ) {
                        var title = scope.instrumentName + ' (' + scope.timePeriod.value + ')';
                        indicatorManagement.openDialog( '#' + scope.newTabId + '_chart', title);
                    });
                    hideOverlays(scope);
                };

                state[m_newTabId].addRemoveOverlay = function(event, scope) {
                    require(["charts/overlay/overlayManagement"], function(overlayManagement ) {
                        var title = scope.instrumentName + ' (' + scope.timePeriod.value + ')';
                        overlayManagement.openDialog( '#' + scope.newTabId + '_chart', title);
                    });
                    hideOverlays(scope);
                };

                state[m_newTabId].changeChartType = function(event, scope) {
                    var chartType = $(event.target).attr("data-charttype");
                    if (chartType) {
                        changeChartType(scope, chartType);
                    }
                };

                state[m_newTabId].changeTimePeriod = function(event, scope) {
                    var timePeriod = event.target.dataset.timeperiod;
                    if (timePeriod) {

                        //Unregister previous subscription
                        chartingRequestMap.unregister(chartingRequestMap.keyFor(scope.instrumentCode, scope.timePeriod.value), '#' + scope.newTabId + '_chart');

                        scope.timePeriod = timeperiod_arr.filter(function(obj){return timePeriod==obj.value})[0];
                        var tick = isTick(timePeriod);
                        scope.chartType = tick ? chartType_arr[2]: scope.chartType;
                        showCandlestickAndOHLC(scope.newTabId, !tick && !isOverlaidView('#' + scope.newTabId + '_chart'));
                        charts.refresh('#' + scope.newTabId + '_chart', timePeriod, scope.chartType.value);
                        if (getParameterByName('affiliates') === 'true') charts.changeTitle('#' + scope.newTabId + '_chart', scope.instrumentName + " (" + timePeriod + ")")
                        else chartWindow.changeChartWindowTitle(scope.newTabId, scope.instrumentName, timePeriod);
                        hideOverlays(scope);
                        scope.exportChartURLShare = urlShareTemplate.format(scope.instrumentCode, timePeriod);
                        scope.exportChartIframeShare = iframeShareTemplate.format(scope.instrumentCode, timePeriod);
                        scope.fbShareLink = fbShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)));
                        scope.twitterShareLink = twitterShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')');
                        scope.gPlusShareLink = gPlusShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)));
                        scope.bloggerShareLink = bloggerShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')');
                        scope.vkShareLink = vkShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')');
                    }
                };

                //Disable candlestick and OHLC if it is a tick chart or overlaid view
                showCandlestickAndOHLC(m_newTabId, !isTick(m_timePeriod) && !isOverlaidView('#' + m_newTabId + '_chart'))

                if(!m_tableViewCb) {
                    state[m_newTabId].showTableOption = false;
                }

                state[m_newTabId].toggleCrosshair = function(event, scope) {
                    scope.enableCrosshair = !scope.enableCrosshair;
                    require(["charts/crosshair"], function( crosshair ) {
                        crosshair.toggleCrossHair('#' + scope.newTabId + '_chart');
                    });
                    hideOverlays(scope);
                };

                state[m_newTabId].toggleDrawingToolSelector = function(event, scope) {
                    var temp = !scope.showDrawingToolSelector;
                    var ele = $("#" + scope.newTabId + " [data-balloon=Drawings] .img img")[0];
                    if(temp==true && event){
                        hideOverlays(scope);
                        scope.showDrawingToolSelector = temp;
                        ele.src = ele.src.replace(".svg","-w.svg");
                    } else{
                        scope.showDrawingToolSelector = false;
                        ele.src = ele.src.replace("-w","");
                    }
                };

                state[m_newTabId].addDrawingTool = function(event, scope) {
                    var drawingTool = event.target.dataset.drawingtool;
                    if (drawingTool) {
                        require(["charts/draw/highcharts_custom/" + drawingTool], function(draw) {
                            var refererChartID = '#' + scope.newTabId + '_chart';
                            $(refererChartID).highcharts().annotate = true;
                            draw.init(refererChartID);
                        });
                        hideOverlays(scope);
                    }
                };

                state[m_newTabId].toggleExportSelector = function(event, scope) {
                    var temp = !scope.showExportSelector;
                    var ele = $("#" + scope.newTabId + " [data-balloon=Share] .img img")[0];
                    if(temp==true && event){
                        hideOverlays(scope);
                        scope.showExportSelector = temp;
                        ele.src = ele.src.replace(".svg","-w.svg");
                    } else{
                        scope.showExportSelector = false;
                        ele.src = ele.src.replace("-w","");
                    }
                };

                state[m_newTabId].export = function(event, scope) {
                    var exportType = event.target.dataset.exporttype;
                    if (exportType) {
                        var id = '#' + scope.newTabId + '_chart';
                        var chart = $(id).highcharts();
                        switch(exportType) {
                            case 'png': chart.exportChartLocal(); break;
                            case 'pdf': chart.exportChart({
                                type: 'application/pdf'
                            }); break;
                            case 'csv': charts.generate_csv(chart, $(id).data()); break;
                            case 'svg': chart.exportChartLocal({
                                type: 'image/svg+xml'
                            }); break;
                        }
                        hideOverlays(scope);
                    }
                };

                // Listen for indicator changes.
                $("#" + m_newTabId).on('chart-indicators-changed',function(e, chart){
                  state[m_newTabId].indicatorsCount = chart.get_indicators().length;
                });

                state[m_newTabId].overlayCount = $("#" + m_newTabId+"_chart").data('overlayCount');

                // Listen for overlay changes.
                $("#" + m_newTabId).on('chart-overlay-add', function(e, overlay){
                    var chart = $("#" + m_newTabId + "_chart").highcharts();
                    state[m_newTabId].overlayCount = chart.get_overlay_count();
                
                });
                $("#" + m_newTabId).on('chart-overlay-remove', function(e, overlay){
                    var chart = $("#" + m_newTabId + "_chart").highcharts();
                    state[m_newTabId].overlayCount = chart.get_overlay_count();
                });

                // Preload images for better UI
                chartType_arr.forEach(function(chartType){
                    if(chartType.value !== "table")
                        new Image().src="images/" + chartType.value + "-w.svg";
                });
                new Image().src="images/share-w.svg";
                new Image().src="images/drawing-w.svg";

                var $html = $(html);

                $("#" + m_newTabId + "_header").prepend($html);

                // Check if the page is in iframe or not
                var affiliates = getParameterByName('affiliates') || 'false';
                if(affiliates === "false"){
                    console.log("#" + m_newTabId + " .exportOverlay");
                    $("#" + m_newTabId + " .exportOverlay").css("right", "6px");
                }
                
                view[m_newTabId] = rv.bind($html[0], state[m_newTabId]);

            });

        },

        disableEnableCandlestickAndOHLC : function (newTabId, enable) {
            if(state[newTabId]) {
                showCandlestickAndOHLC(newTabId,enable);
            }
        },

        /**
         * Supported chartTypes are - candlestick, dot, line, dotline, ohlc, spline, table
         * @param newTabId
         * @param chartType
         */
        selectChartType: function(newTabId, chartType, generateEvent) {
            if (generateEvent) {
                state[newTabId].changeChartType(state[newTabId], chartType);
            } else {
                state[newTabId].chartType = chartType_arr.filter(function(chart){return chart.value==chartType})[0];
                showCandlestickAndOHLC(newTabId,!isTick(state[newTabId].timePeriod.value) && !isOverlaidView("#" + newTabId + "_chart"));
            }
        },

        cleanBinding: function(newTabId) {
            if (view[newTabId]) {
                view[newTabId].unbind();
                delete view[newTabId];
                delete state[newTabId];
            }
        },

        setIndicatorsCount: function(count, newTabId){
            state[newTabId].indicatorsCount = count;
        },

    };

});
