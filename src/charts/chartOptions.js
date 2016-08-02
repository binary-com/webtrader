/**
 * Created by arnab on 2/16/15.
 */

define(['jquery', 'common/rivetsExtra', "charts/chartWindow", "charts/charts", 'moment', 'charts/chartingRequestMap', "common/util"], function($, rv, chartWindow, charts, moment, chartingRequestMap) {

    var state = {}, view = {}, template_manager = {};
    var CANDLE_TYPE = 'candlestick',
        OHLC_TYPE = 'ohlc',
        LINE_TYPE = 'line',
        DOT_TYPE = 'dot',
        LINEDOT_TYPE = 'linedot',
        SPLINE_TYPE = 'spline',
        TABLE_TYPE = 'table',
        i18n_name = (local_storage.get('i18n') || { value: 'en' }).value,
        urlShareTemplate = 'https://webtrader.binary.com?affiliates=true&instrument={0}&timePeriod={1}&gtm=true&lang=' + i18n_name,
        iframeShareTemplate = '<iframe src="' + urlShareTemplate + '" width="350" height="400" style="overflow-y : hidden;" scrolling="no" />',
        twitterShareTemplate = 'https://twitter.com/share?url={0}&text={1}',
        fbShareTemplate = 'https://facebook.com/sharer/sharer.php?u={0}',
        gPlusShareTemplate = 'https://plus.google.com/share?url={0}',
        bloggerShareTemplate = 'https://www.blogger.com/blog-this.g?u={0}&n={1}',
        vkShareTemplate = 'http://vk.com/share.php?url={0}&title={1}';

    function hideOverlays(scope) {
        scope.showTimePeriodSelector    = false;
        scope.showChartTypeSelector     = false;
        scope.showDrawingToolSelector   = false;
        scope.showExportSelector        = false;
        scope.showLoadSaveSelector      = false;
    }

    //This is ugly, but doing it for now
    function setTopHeaderPosAndWith_chartType(chartType, newTabId) {
        switch (chartType) {
            case CANDLE_TYPE:
                $('#' + newTabId + ' .chartOptions .chartTypeOverlay > .chartoptions-horizontal-line:first-child').css({ width: '60px', left: '34px' }); break;
            case OHLC_TYPE:
                $('#' + newTabId + ' .chartOptions .chartTypeOverlay > .chartoptions-horizontal-line:first-child').css({ width: '58px', left: '36px' }); break;
            case LINE_TYPE:
                $('#' + newTabId + ' .chartOptions .chartTypeOverlay > .chartoptions-horizontal-line:first-child').css({ width: '52px', left: '41px' }); break;
            case DOT_TYPE:
            case LINEDOT_TYPE:
                $('#' + newTabId + ' .chartOptions .chartTypeOverlay > .chartoptions-horizontal-line:first-child').css({ width: '53px', left: '40px' }); break;
            case SPLINE_TYPE:
                $('#' + newTabId + ' .chartOptions .chartTypeOverlay > .chartoptions-horizontal-line:first-child').css({ width: '53px', left: '41px' }); break;
        }
    }

    function changeChartType(scope, chartType) {
        if (chartType == TABLE_TYPE) {
            //Do not change chart type
            scope.tableViewCallback && scope.tableViewCallback();
        } else {
            scope.chartType = chartType;
            charts.refresh('#' + scope.newTabId + '_chart', null, scope.chartType);
            /* trigger an event on the chart dialog, so we can listen on type changes,
             * note: this will be use to update chart state for tracker.js */
            $('#' + scope.newTabId).trigger('chart-type-changed', scope.chartType);
            setTopHeaderPosAndWith_chartType(chartType, scope.newTabId);
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

    //This is ugly, but doing it for now
    function setTopHeaderPosAndWidth_timePeriodOvl(timePeriod) {
        switch (timePeriod) {
            case '1t': $('.chartOptions .timePeriodOverlay > .chartoptions-horizontal-line:first-child').css({ width : '85%', left : '40px'}); break;
            case '1m':
            case '2m':
            case '3m':
            case '5m': $('.chartOptions .timePeriodOverlay > .chartoptions-horizontal-line:first-child').css({ width : '82%', left : '47px'}); break;
            case '10m':
            case '15m':
            case '30m': $('.chartOptions .timePeriodOverlay > .chartoptions-horizontal-line:first-child').css({ width : '80%', left : '54px'}); break;
            case '1h':
            case '2h':
            case '4h':
            case '8h':
            case '1d': $('.chartOptions .timePeriodOverlay > .chartoptions-horizontal-line:first-child').css({ width : '84%', left : '43px'}); break;
        }
    }

    return {

        init : function (m_newTabId, m_timePeriod, m_chartType, m_tableViewCb, m_instrumentName, m_instrumentCode) {

            require(['text!charts/chartOptions.html','css!charts/chartOptions.css'], function(html) {

                if (view[m_newTabId]) view[m_newTabId].unbind();

                state[m_newTabId] = {
                    //Input parameters
                    newTabId : m_newTabId,
                    timePeriod : m_timePeriod, //Its in format like 1m, 2m, 3m etc
                    chartType : m_chartType,
                    tableViewCallback: m_tableViewCb, //Callback for table view
                    instrumentName : m_instrumentName,
                    instrumentCode : m_instrumentCode,
                    indicatorsCount : 0,
                    overlayCount: 0,

                    showTimePeriodSelector : false,
                    showChartTypeSelector : false,
                    showCandlestickAndOHLC : !isOverlaidView('#' + m_newTabId + '_chart'), //This is used to restrict showing candlestick and OHLC options when charts have overlays
                    showTableOption : true,
                    enableCrosshair : true,
                    showDrawingToolSelector : false,
                    showExportSelector : false,
                    showLoadSaveSelector: false,

                    exportChartURLShare : urlShareTemplate.format(m_instrumentCode, m_timePeriod),
                    exportChartIframeShare : iframeShareTemplate.format(m_instrumentCode, m_timePeriod),

                    fbShareLink : fbShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod))),
                    twitterShareLink : twitterShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')'),
                    gPlusShareLink : gPlusShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod))),
                    bloggerShareLink : bloggerShareTemplate.format(urlShareTemplate.format(m_instrumentCode, m_timePeriod), m_instrumentName + '(' + m_timePeriod + ')'),
                    vkShareLink : vkShareTemplate.format(urlShareTemplate.format(m_instrumentCode, m_timePeriod), m_instrumentName + '(' + m_timePeriod + ')')

                };
                view[m_newTabId] = null;

                state[m_newTabId].toggleTimerPeriodSelector = function(event, scope) {
                    var temp = !scope.showTimePeriodSelector;
                    hideOverlays(scope);
                    scope.showTimePeriodSelector = temp;
                };
                state[m_newTabId].toggleChartTypeSelector = function(event, scope) {
                    var temp = !scope.showChartTypeSelector;
                    hideOverlays(scope);
                    scope.showChartTypeSelector = temp;
                };

                state[m_newTabId].addRemoveIndicator = function(event, scope) {
                    require(["charts/indicators/indicatorManagement"], function( indicatorManagement ) {
                        var title = scope.instrumentName + ' (' + scope.timePeriod + ')';
                        indicatorManagement.openDialog( '#' + scope.newTabId + '_chart', title);
                    });
                    hideOverlays(scope);
                };

                state[m_newTabId].addRemoveOverlay = function(event, scope) {
                    require(["charts/overlay/overlayManagement"], function(overlayManagement ) {
                        var title = scope.instrumentName + ' (' + scope.timePeriod + ')';
                        overlayManagement.openDialog( '#' + scope.newTabId + '_chart', title);
                    });
                    hideOverlays(scope);
                };

                state[m_newTabId].changeChartType = function(event, scope) {
                    var chartType = event.target.dataset.charttype;
                    if (chartType) {
                        changeChartType(scope, chartType);
                    }
                };

                state[m_newTabId].changeTimePeriod = function(event, scope) {
                    var timePeriod = event.target.dataset.timeperiod;
                    $("#"+m_newTabId+" .timePeriodOverlay [data-timeperiod="+scope.timePeriod+"]").removeAttr("disabled");
                    $("#"+m_newTabId+" .timePeriodOverlay [data-timeperiod="+timePeriod+"]").attr("disabled","");
                    if (timePeriod) {

                        //Unregister previous subscription
                        chartingRequestMap.unregister(chartingRequestMap.keyFor(scope.instrumentCode, scope.timePeriod), '#' + scope.newTabId + '_chart');

                        scope.timePeriod = timePeriod;
                        var tick = isTick(timePeriod);
                        if (tick) scope.showCandlestickAndOHLC = false;
                        else scope.showCandlestickAndOHLC = !isOverlaidView('#' + scope.newTabId + '_chart');
                        scope.chartType = tick ? 'line': scope.chartType;
                        charts.refresh('#' + scope.newTabId + '_chart', timePeriod, scope.chartType);
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
                        setTopHeaderPosAndWidth_timePeriodOvl(timePeriod);

                    }
                };

                //Disable candlestick and OHLC if it is a tick chart
                if (isTick(m_timePeriod)) {
                    state[m_newTabId].showCandlestickAndOHLC = false;
                }
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
                    hideOverlays(scope);
                    scope.showDrawingToolSelector = temp;
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
                    hideOverlays(scope);
                    scope.showExportSelector = temp;
                };

                state[m_newTabId].toggleLoadSaveSelector = function(event, scope) {
                    var temp = !scope.showLoadSaveSelector;
                    hideOverlays(scope);
                    scope.showLoadSaveSelector = temp;
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

                var $html = $(html);

                $("#" + m_newTabId + "_header").prepend($html);
                // Disable selected timeperiod.
                $("#"+m_newTabId+" .timePeriodOverlay [data-timeperiod="+m_timePeriod+"]").attr("disabled","");
                setTopHeaderPosAndWidth_timePeriodOvl(m_timePeriod);
                setTopHeaderPosAndWith_chartType(m_chartType, m_newTabId);

                view[m_newTabId] = rv.bind($html[0], state[m_newTabId]);
                require(['charts/chartTemplateManager'], function(templateManager) {
                  var root = $html.find('.chart-template-manager-root');
                  template_manager[m_newTabId] = templateManager.init(root, m_newTabId);
                })

            });

        },

        disableEnableCandlestickAndOHLC : function (newTabId, enable) {
            if(state[newTabId]) {
                state[newTabId].showCandlestickAndOHLC = enable;
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
                state[newTabId].chartType = chartType;
            }
        },

        cleanBinding: function(newTabId) {
            if (view[newTabId]) {
                view[newTabId].unbind();
                template_manager[newTabId] && template_manager[newTabId].unbind();
                delete template_manager[newTabId];
                delete view[newTabId];
                delete state[newTabId];
            }
        },

        setIndicatorsCount: function(count, newTabId){
            state[newTabId].indicatorsCount = count;
        },

    };

});
