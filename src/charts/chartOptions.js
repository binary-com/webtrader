/**
 * Created by arnab on 2/16/15.
 */

define(['jquery', 'common/rivetsExtra', "charts/chartWindow", "charts/charts", 'moment', 'charts/chartingRequestMap', "common/util"], function($, rv, chartWindow, charts, moment, chartingRequestMap) {

    var state = [], view = [], template_manager = {}, stringWidth= {};

    var timeperiod_arr = [{value: "1t", name: "1 Tick", digit: 1, type: "ticks"}, 
        {value: "1m", name: "1 Minute", digit: 1, type: "minutes"}, 
        {value: "2m", name: "2 Minutes", digit: 2, type: "minutes"},
        {value: "3m", name: "3 Minutes", digit: 3, type: "minutes"}, 
        {value: "5m", name: "5 Minutes", digit: 5, type: "minutes"},
        {value: "10m", name: "10 Minutes", digit: 10, type: "minutes"}, 
        {value: "15m", name: "15 Minutes", digit: 15, type: "minutes"},
        {value: "30m", name: "30 Minutes", digit: 30, type: "minutes"},
        {value: "1h", name: "1 Hour", digit: 1, type: "hours"}, 
        {value: "2h", name: "2 Hours", digit: 2, type: "hours"}, 
        {value: "4h", name: "4 Hours", digit: 4, type: "hours"}, 
        {value: "8h", name: "8 Hours", digit: 8, type: "hours"},
        {value: "1d", name: "1 Day", digit: 1, type: "days"}];

    var chartType_arr = [{value:'candlestick', name:'Candles'}, {value:'ohlc', name:'OHLC'}, 
        {value:'line', name:'Line'}, {value:'dot', name:'Dot'}, {value:'linedot', name:'Line Dot'}, 
        {value:'spline', name:'Spline'}, {value:'table', name:'Table'}];
        i18n_name = (local_storage.get('i18n') || { value: 'en' }).value,
        appURL = getAppURL(); // Get current apps url.
        urlShareTemplate = appURL + '?affiliates=true&instrument={0}&timePeriod={1}&lang=' + i18n_name,
        iframeShareTemplate = '<iframe src="' + urlShareTemplate + '" width="350" height="400" style="overflow-y : hidden;" scrolling="no" />',
        twitterShareTemplate = 'https://twitter.com/share?url={0}&text={1}',
        fbShareTemplate = 'https://facebook.com/sharer/sharer.php?u={0}',
        gPlusShareTemplate = 'https://plus.google.com/share?url={0}',
        bloggerShareTemplate = 'https://www.blogger.com/blog-this.g?u={0}&n={1}',
        vkShareTemplate = 'http://vk.com/share.php?url={0}&title={1}';

    function hideOverlays(scope) {
        scope.showTimePeriodSelector = false;
        scope.toggleLoadSaveSelector(null, scope);
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
        if(!show){
            state[newTabId].chartTypes = chartType_arr.filter(
                function(chartType){
                    return  chartType.value !== "candlestick" && chartType.value !== "ohlc";
            });
        } else {
            state[newTabId].chartTypes = chartType_arr;
            state[newTabId].chartTypes[1].showBorder = true;
        }
        
    }

    function responsiveButtons(scope, ele) {
        var loadSaveOverlay = ele.find(".loadSaveOverlay");
        var exportOverlay = ele.find(".exportOverlay");
        var timePeriodButton = ele.find(".timeperiod");
        var chartTypeButton = ele.find(".chart_type");
        ele.find(".chartTypeOverlay").css("width",stringWidth.ct+53+"px");

        // This is needed for calculating relative position.
        var shareButton = ele.find('.shareButton'),
            minWidth = 420 + ((stringWidth.tp.max + stringWidth.ct +65) - (97+87));
        if(ele.width() > minWidth){
            scope.showChartTypeLabel = true;
            scope.timePeriod_name = scope.timePeriod.name;
            timePeriodButton.css("width",stringWidth.tp.max+25+"px");
            chartTypeButton.css("width",stringWidth.ct+55+"px");
        } else {
            scope.showChartTypeLabel = false;
            scope.timePeriod_name = i18n_name =="en" ? scope.timePeriod.value.toUpperCase() : scope.timePeriod.value.i18n();
            timePeriodButton.css("width",stringWidth.tp.min+27+"px");
            chartTypeButton.css("width","45px");
        }

        var positionRight = ele.width() - (shareButton.offset().left + shareButton.outerWidth() - ele.offset().left);

        if(ele.width() <=730 ) {
            positionRight = positionRight > 0 ? positionRight : 25;
            exportOverlay.css("right", positionRight+"px");
            loadSaveOverlay.css("right", positionRight+35+"px");
        } else {
            loadSaveOverlay.css("right", "auto");
            exportOverlay.css("right", "auto");
        }
    }

    function calculateStringWidth() {
        var longTp1 = timeperiod_arr.reduce(function(a,b){return a.value.i18n().length > b.value.i18n().length? a :b}),
            longTp2 = timeperiod_arr.reduce(function(a,b){return a.name.i18n().length > b.name.i18n().length? a :b}),
            longCt = chartType_arr.reduce(function(a,b){return a.name.i18n().length > b.name.i18n().length? a : b});
        var getWidth = function(string) {
            var font = '0.8em roboto,sans-serif',
                obj = $('<div>' + string.i18n() + '</div>')
                    .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font})
                    .appendTo($('body')),
                width = obj.width();
                obj.remove();
            return width;
        }
        stringWidth.tp = {};
        stringWidth.tp.min = getWidth(longTp1.value);
        stringWidth.tp.max = getWidth(longTp2.name);
        stringWidth.ct = getWidth(longCt.name);
    }

    function preLoadImages(){
        chartType_arr.forEach(function(chartType){
            if(chartType.value !== "table")
                new Image().src="images/" + chartType.value + "-w.svg";
        });
        new Image().src="images/share-w.svg";
        new Image().src="images/drawing-w.svg";
        new Image().src="images/chart_template-w.svg";
    }

    return {

        init : function (m_newTabId, m_timePeriod, m_chartType, m_tableViewCb, m_instrumentName, m_instrumentCode, m_showShare, m_showOverlay) {
            
            require(['text!charts/chartOptions.html','css!charts/chartOptions.css'], function(html) {
                calculateStringWidth();
                if (view[m_newTabId]) view[m_newTabId].unbind();
                state[m_newTabId] = {
                    //Input parameters
                    newTabId : m_newTabId,
                    timePeriod : timeperiod_arr.filter(function(obj){return m_timePeriod==obj.value})[0],
                    timeperiod_arr : timeperiod_arr,
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
                    showLoadSaveSelector: false,
                    showShare: typeof m_showShare == 'undefined' ? true : m_showShare,
                    showOverlay: typeof m_showOverlay == 'undefined' ? true : m_showOverlay,

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
                        scope = state[scope.newTabId];
                        //Unregister previous subscription
                        chartingRequestMap.unregister(chartingRequestMap.keyFor(scope.instrumentCode, scope.timePeriod.value), '#' + scope.newTabId + '_chart');
                        scope.timePeriod = timeperiod_arr.filter(function(obj){return timePeriod==obj.value})[0];
                        responsiveButtons(scope, $("#" + scope.newTabId).find(".chart-view"));
                        var tick = isTick(timePeriod);
                        if(tick && (scope.chartType.value === 'candlestick' || scope.chartType.value === 'ohlc'))
                            changeChartType(scope,'line');
                        showCandlestickAndOHLC(scope.newTabId, !tick && !isOverlaidView('#' + m_newTabId + '_chart'));
                        charts.refresh('#' + scope.newTabId + '_chart', timePeriod, scope.chartType.value);
                        hideOverlays(scope);
                        scope.exportChartURLShare = urlShareTemplate.format(scope.instrumentCode, timePeriod);
                        scope.exportChartIframeShare = iframeShareTemplate.format(scope.instrumentCode, timePeriod);
                        scope.fbShareLink = fbShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)));
                        scope.twitterShareLink = twitterShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')');
                        scope.gPlusShareLink = gPlusShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)));
                        scope.bloggerShareLink = bloggerShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')');
                        scope.vkShareLink = vkShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')');
                        $('#' + scope.newTabId).trigger('chart-time-period-changed', timePeriod);
                    }
                };

                //Disable candlestick and OHLC if it is a tick chart or overlaid view
                showCandlestickAndOHLC(m_newTabId, !isTick(m_timePeriod) && !isOverlaidView('#' + m_newTabId + '_chart'));

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
                    var ele = $("#" + scope.newTabId + ' .drawButton .img img')[0];
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
                    var ele = $("#" + scope.newTabId + ' .shareButton .img img')[0];
                    if(temp==true && event){
                        hideOverlays(scope);
                        scope.showExportSelector = temp;
                        ele.src = ele.src.replace(".svg","-w.svg");
                    } else{
                        scope.showExportSelector = false;
                        ele.src = ele.src.replace("-w","");
                    }
                };

                state[m_newTabId].toggleLoadSaveSelector = function(event, scope) {
                    var temp = !scope.showLoadSaveSelector;
                    var ele = $("#" + scope.newTabId + ' .templateButton .img img')[0];
                    if(temp==true && event){
                        hideOverlays(scope);
                        scope.showLoadSaveSelector = temp;
                        ele.src = ele.src.replace(".svg","-w.svg");
                    } else{
                        scope.showLoadSaveSelector = false;
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

                // Listen for resize event
                if(getParameterByName('affiliates')=='true'){
                    $(window).resize(function(){
                        responsiveButtons(state[m_newTabId], $("#" + m_newTabId).find(".chart-view"));
                    });
                } else {
                    $("#" + m_newTabId).on('resize-event', function(e){
                        responsiveButtons(state[m_newTabId], $(this).find(".chart-view"));
                    });
                }

                // Preload images for better UI
                preLoadImages();

                var $html = $(html).i18n();

                $("#" + m_newTabId + "_header").prepend($html);

                responsiveButtons(state[m_newTabId], $("#" + m_newTabId).find(".chart-view"));

                // Used to filter timeperiod array.
                rv.formatters['filter'] = function(arr, type) {
                    return arr.filter(function(item){return item.type == type});
                }
                               
                view[m_newTabId] = rv.bind($html[0], state[m_newTabId]);
                require(['charts/chartTemplateManager'], function(templateManager) {
                  var root = $html.find('.chart-template-manager-root');
                  template_manager[m_newTabId] = templateManager.init(root, m_newTabId);
                })

            });

        },

        /* allow settings to be updated when a new chart template is applied */
        updateOptions: function(newTabId, chartType, timePeriod, indicatorsCount, overlayCount) {
          var s = state[newTabId];
          var margin;
          if(!s) return;
          s.chartType = chartType_arr.filter(function(chart){return chart.value==chartType})[0];
          s.timePeriod = timeperiod_arr.filter(function(tp){return timePeriod==tp.value})[0];
          s.indicatorsCount = indicatorsCount;
          s.overlayCount = overlayCount;
          //Disable candlestick and OHLC if it is a tick chart or overlaid view
          showCandlestickAndOHLC(newTabId, !isTick(timePeriod) && overlayCount > 0);
          responsiveButtons(s,$("#" + newTabId).find(".chart-view"));
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
