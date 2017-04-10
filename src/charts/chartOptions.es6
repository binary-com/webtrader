/**
 * Created by arnab on 2/16/15.
 */

import $ from 'jquery';
import rv from 'common/rivetsExtra';
import _ from 'lodash';
import chartWindow from 'charts/chartWindow';
import charts from 'charts/charts';
import moment from 'moment';
import chartingRequestMap from 'charts/chartingRequestMap';
import html from 'text!charts/chartOptions.html';
import indicatorManagement from 'charts/indicators/indicatorManagement';
import overlayManagement from 'charts/overlay/overlayManagement';
import crosshair from 'charts/crosshair';
import 'css!charts/chartOptions.css';
import 'common/util';
import templateManager from 'charts/chartTemplateManager';

const state = [],
    view = [],
    template_manager = {},
    stringWidth = {};
let isListenerAdded = false;

const timeperiod_arr = [{ value: "1t", name: "1 Tick", digit: 1, type: "ticks" },
    { value: "1m", name: "1 Minute", digit: 1, type: "minutes" },
    { value: "2m", name: "2 Minutes", digit: 2, type: "minutes" },
    { value: "3m", name: "3 Minutes", digit: 3, type: "minutes" },
    { value: "5m", name: "5 Minutes", digit: 5, type: "minutes" },
    { value: "10m", name: "10 Minutes", digit: 10, type: "minutes" },
    { value: "15m", name: "15 Minutes", digit: 15, type: "minutes" },
    { value: "30m", name: "30 Minutes", digit: 30, type: "minutes" },
    { value: "1h", name: "1 Hour", digit: 1, type: "hours" },
    { value: "2h", name: "2 Hours", digit: 2, type: "hours" },
    { value: "4h", name: "4 Hours", digit: 4, type: "hours" },
    { value: "8h", name: "8 Hours", digit: 8, type: "hours" },
    { value: "1d", name: "1 Day", digit: 1, type: "days" }
];

const chartType_arr = [{ value: 'candlestick', name: 'Candles' }, { value: 'ohlc', name: 'OHLC' },
        { value: 'line', name: 'Line' }, { value: 'dot', name: 'Dot' }, { value: 'linedot', name: 'Line Dot' },
        { value: 'spline', name: 'Spline' }, { value: 'table', name: 'Table' }
    ],
    i18n_name = (local_storage.get('i18n') || { value: 'en' }).value,
    appURL = getAppURL(), // Get current apps url.
    urlShareTemplate = appURL + '?affiliates=true&instrument={0}&timePeriod={1}&lang=' + i18n_name,
    iframeShareTemplate = '<iframe src="' + urlShareTemplate + '" width="350" height="400" style="overflow-y : hidden;" scrolling="no" />',
    twitterShareTemplate = 'https://twitter.com/share?url={0}&text={1}',
    fbShareTemplate = 'https://facebook.com/sharer/sharer.php?u={0}',
    gPlusShareTemplate = 'https://plus.google.com/share?url={0}',
    bloggerShareTemplate = 'https://www.blogger.com/blog-this.g?u={0}&n={1}',
    vkShareTemplate = 'http://vk.com/share.php?url={0}&title={1}';

const hideOverlays = (scope) => {
    scope.showTimePeriodSelector = false;
    scope.toggleLoadSaveSelector(null, scope);
    scope.toggleChartTypeSelector(null, scope);
    scope.toggleDrawingToolSelector(null, scope);
    scope.toggleExportSelector(null, scope);
}

const changeChartType = (scope, chartType, newTimePeriod = null) => {
    if (chartType == 'table') {
        //Do not change chart type
        state[scope.newTabId].showChartTypeSelector = false;
        scope.tableViewCallback && scope.tableViewCallback();
    } else {
        state[scope.newTabId].chartType = chartType_arr.filter((chart) => {
            return chart.value == chartType
        })[0];
        state[scope.newTabId].showChartTypeSelector = false;
        charts.refresh('#' + scope.newTabId + '_chart', newTimePeriod, chartType);
        /* trigger an event on the chart dialog, so we can listen on type changes,
         * note: this will be use to update chart state for tracker.js */
        $('#' + scope.newTabId).trigger('chart-type-changed', chartType);
    }
    hideOverlays(scope);
}

const isOverlaidView = (containerIDWithHash) => {
    let isOverlaid = false;
    const existingChart = $(containerIDWithHash).highcharts();
    if (existingChart) {
        existingChart.series.forEach((f) => {
            if (f.options.compare === 'percent') {
                isOverlaid = true;
            }
        });
    }
    return isOverlaid;
}

const showCandlestickAndOHLC = (newTabId, show) => {
    if (!show) {
        state[newTabId].chartTypes = chartType_arr.filter(
            (chartType) => {
                return chartType.value !== "candlestick" && chartType.value !== "ohlc";
            });
    } else {
        state[newTabId].chartTypes = chartType_arr;
        state[newTabId].chartTypes[1].showBorder = true;
    }

}

const responsiveButtons = (scope, ele) => {
    const loadSaveOverlay = ele.find(".loadSaveOverlay");
    const exportOverlay = ele.find(".exportOverlay");
    const timePeriodButton = ele.find(".timeperiod");
    const chartTypeButton = ele.find(".chart_type");
    ele.find(".chartTypeOverlay").css("width", stringWidth.ct + 53 + "px");

    // This is needed for calculating relative position.
    const shareButton = ele.find('.shareButton'),
        minWidth = 420 + ((stringWidth.tp.max + stringWidth.ct + 65) - (97 + 87));


    //Place instrument name for affiliates based on frame width
    if (isAffiliates()) {
        if ($(window).width() > minWidth + stringWidth.inst) {
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("margin", "5px 0px");
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("float", "left");
            $("#" + scope.newTabId + " .chartOptions .instrument_name");
            scope.showInstrumentName = true;
            $("#" + scope.newTabId + "_chart").highcharts().setTitle({ text: "" });
        } else {
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("margin", "5px auto");
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("float", "");
            scope.showInstrumentName = false;
            $("#" + scope.newTabId + "_chart").highcharts().setTitle({ text: scope.instrumentName });
        }
    }

    if (ele.width() > minWidth) {
        scope.showChartTypeLabel = true;
        scope.timePeriod_name = scope.timePeriod.name;
        timePeriodButton.css("width", stringWidth.tp.max + 25 + "px");
        chartTypeButton.css("width", stringWidth.ct + 55 + "px");
    } else {
        scope.showChartTypeLabel = false;
        scope.timePeriod_name = i18n_name == "en" ? scope.timePeriod.value.toUpperCase() : scope.timePeriod.value.i18n();
        timePeriodButton.css("width", stringWidth.tp.min + 27 + "px");
        chartTypeButton.css("width", "45px");
    }

    let positionRight = ele.width() - (shareButton.offset().left + shareButton.outerWidth() - ele.offset().left);

    if (ele.width() <= 730) {
        positionRight = positionRight > 0 ? positionRight : 25;
        exportOverlay.css("right", positionRight + "px");
        loadSaveOverlay.css("right", positionRight + 35 + "px");
    } else {
        loadSaveOverlay.css("right", "auto");
        exportOverlay.css("right", "auto");
    }
}

const calculateStringWidth = (instrument_name) => {
    const longTp1 = timeperiod_arr.reduce((a, b) => {
            return a.value.i18n().length > b.value.i18n().length ? a : b
        }),
        longTp2 = timeperiod_arr.reduce((a, b) => {
            return a.name.i18n().length > b.name.i18n().length ? a : b
        }),
        longCt = chartType_arr.reduce((a, b) => {
            return a.name.i18n().length > b.name.i18n().length ? a : b
        });
    const getWidth = (string) => {
        const font = '0.8em roboto,sans-serif',
            obj = $('<div>' + string.i18n() + '</div>')
            .css({ 'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font })
            .appendTo($('body')),
            width = obj.width();
        obj.remove();
        return width;
    }
    stringWidth.tp = {};
    stringWidth.tp.min = getWidth(longTp1.value);
    stringWidth.tp.max = getWidth(longTp2.name);
    stringWidth.ct = getWidth(longCt.name);
    stringWidth.inst = getWidth(instrument_name) + 20;
}

const toggleIcon = (ele, active) => {
    ele = $(ele);
    let cls = ele.attr("class");
    ele.toggleClass(cls);
    const type = cls.split("-")[0];
    cls = active === true ? type + "-w-icon" : type + "-icon";
    ele.toggleClass(cls);
}

export const init = (m_newTabId, m_timePeriod, m_chartType, m_tableViewCb, m_instrumentName, m_instrumentCode, m_showShare, m_showOverlay) => {

    calculateStringWidth(m_instrumentName);
    if (view[m_newTabId]) view[m_newTabId].unbind();
    state[m_newTabId] = {
        //Input parameters
        newTabId: m_newTabId,
        timePeriod: timeperiod_arr.filter((obj) => {
            return m_timePeriod == obj.value
        })[0],
        timeperiod_arr: timeperiod_arr,
        chartType: chartType_arr.filter((chart) => {
            return chart.value == m_chartType
        })[0],
        tableViewCallback: m_tableViewCb, //Callback for table view
        instrumentName: m_instrumentName,
        instrumentCode: m_instrumentCode,
        indicatorsCount: 0,
        overlayCount: 0,

        showTimePeriodSelector: false,
        showChartTypeSelector: false,
        showTableOption: true,
        enableCrosshair: true,
        showDrawingToolSelector: false,
        showExportSelector: false,
        showLoadSaveSelector: false,
        showShare: typeof m_showShare == 'undefined' ? true : m_showShare,
        showOverlay: typeof m_showOverlay == 'undefined' ? true : m_showOverlay,
        showInstrumentName: false,

        exportChartURLShare: urlShareTemplate.format(m_instrumentCode, m_timePeriod),
        exportChartIframeShare: iframeShareTemplate.format(m_instrumentCode, m_timePeriod),

        fbShareLink: fbShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod))),
        twitterShareLink: twitterShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod)), m_instrumentName + '(' + m_timePeriod + ')'),
        gPlusShareLink: gPlusShareTemplate.format(encodeURIComponent(urlShareTemplate.format(m_instrumentCode, m_timePeriod))),
        bloggerShareLink: bloggerShareTemplate.format(urlShareTemplate.format(m_instrumentCode, m_timePeriod), m_instrumentName + '(' + m_timePeriod + ')'),
        vkShareLink: vkShareTemplate.format(urlShareTemplate.format(m_instrumentCode, m_timePeriod), m_instrumentName + '(' + m_timePeriod + ')')

    };
    view[m_newTabId] = null;

    state[m_newTabId].toggleTimerPeriodSelector = (event, scope) => {
        const temp = !scope.showTimePeriodSelector;
        hideOverlays(scope);
        scope.showTimePeriodSelector = temp;
        event.originalEvent.scope = scope.newTabId;
    };
    state[m_newTabId].toggleChartTypeSelector = (event, scope) => {
        const temp = !scope.showChartTypeSelector;
        const ele = $("#" + scope.newTabId + " .chart_type .img span")[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showChartTypeSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showChartTypeSelector = false;
            toggleIcon(ele, false);
        }

    };

    state[m_newTabId].addRemoveIndicator = (event, scope) => {
        const title = scope.instrumentName + ' (' + scope.timePeriod.value + ')';
        indicatorManagement.openDialog('#' + scope.newTabId + '_chart', title);
    };

    state[m_newTabId].addRemoveOverlay = (event, scope) => {
        const title = scope.instrumentName + ' (' + scope.timePeriod.value + ')';
        overlayManagement.openDialog('#' + scope.newTabId + '_chart', title);
    };

    state[m_newTabId].changeChartType = (event, scope) => {
        const chartType = $(event.target).attr("data-charttype");
        if (chartType) {
            changeChartType(scope, chartType);
        }
    };

    state[m_newTabId].changeTimePeriod = (event, scope) => {
        const timePeriod = event.target.dataset.timeperiod;
        if (timePeriod) {
            scope = state[scope.newTabId];
            scope.timePeriod = timeperiod_arr.filter((obj) => {
                return timePeriod == obj.value
            })[0];
            responsiveButtons(scope, $("#" + scope.newTabId).find(".chart-view"));
            const tick = isTick(timePeriod);
            if (tick && (scope.chartType.value === 'candlestick' || scope.chartType.value === 'ohlc')) {
                changeChartType(scope, 'line', timePeriod);
            }
            else {
               charts.refresh('#' + scope.newTabId + '_chart', timePeriod, scope.chartType.value);
            }
            showCandlestickAndOHLC(scope.newTabId, !tick && !isOverlaidView('#' + m_newTabId + '_chart'));
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

    if (!m_tableViewCb) {
        state[m_newTabId].showTableOption = false;
    }

    state[m_newTabId].toggleCrosshair = (event, scope) => {
        scope.enableCrosshair = !scope.enableCrosshair;
        crosshair.toggleCrossHair('#' + scope.newTabId + '_chart');
    };

    state[m_newTabId].toggleDrawingToolSelector = (event, scope) => {
        const temp = !scope.showDrawingToolSelector;
        const ele = $("#" + scope.newTabId + ' .drawButton .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showDrawingToolSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showDrawingToolSelector = false;
            toggleIcon(ele, false);
        }
    };
    /* Convert this to support es-6 import */
    state[m_newTabId].addDrawingTool = (event, scope) => {
        const drawingTool = event.target.dataset.drawingtool;
        if (drawingTool) {
            require(["charts/draw/highcharts_custom/" + drawingTool], (draw) => {
                const refererChartID = '#' + scope.newTabId + '_chart';
                $(refererChartID).highcharts().annotate = true;
                draw.init(refererChartID);
            });
        }
    };

    state[m_newTabId].toggleExportSelector = (event, scope) => {
        const temp = !scope.showExportSelector;
        const ele = $("#" + scope.newTabId + ' .shareButton .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showExportSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showExportSelector = false;
            toggleIcon(ele, false);
        }
    };

    state[m_newTabId].toggleLoadSaveSelector = (event, scope) => {
        const temp = !scope.showLoadSaveSelector;
        const ele = $("#" + scope.newTabId + ' .templateButton .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showLoadSaveSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showLoadSaveSelector = false;
            toggleIcon(ele, false);
        }
    };

    state[m_newTabId].export = (event, scope) => {
        const exportType = event.target.dataset.exporttype;
        if (exportType) {
            const id = '#' + scope.newTabId + '_chart';
            const chart = $(id).highcharts();
            switch (exportType) {
                case 'png':
                    chart.exportChartLocal();
                    break;
                case 'pdf':
                    chart.exportChart({
                        type: 'application/pdf'
                    });
                    break;
                case 'csv':
                    charts.generate_csv(chart, $(id).data());
                    break;
                case 'svg':
                    chart.exportChartLocal({
                        type: 'image/svg+xml'
                    });
                    break;
            }
        }
    };

    // Listen for indicator changes.
    $("#" + m_newTabId).on('chart-indicators-changed', (e, chart) => {
        state[m_newTabId].indicatorsCount = chart.get_indicators().length;
    });

    state[m_newTabId].overlayCount = $("#" + m_newTabId + "_chart").data('overlayCount');

    // Listen for overlay changes.
    $("#" + m_newTabId).on('chart-overlay-add', (e, overlay) => {
        const chart = $("#" + m_newTabId + "_chart").highcharts();
        state[m_newTabId].overlayCount = chart.get_overlay_count();

    });
    $("#" + m_newTabId).on('chart-overlay-remove', (e, overlay) => {
        const chart = $("#" + m_newTabId + "_chart").highcharts();
        state[m_newTabId].overlayCount = chart.get_overlay_count();
    });

    // Listen for resize event
    if (isAffiliates()) {
        $(window).resize(() => {
            responsiveButtons(state[m_newTabId], $("#" + m_newTabId).find(".chart-view"));
        });
    } else {
        $("#" + m_newTabId).on('resize-event', function(e) {
            responsiveButtons(state[m_newTabId], $(this).find(".chart-view"));
        });
    }

    // Add event only once.
    !isListenerAdded && $('body').on('click', (event) => {
        _.forEach(Object.keys(state), (tab) => {
            if (event.originalEvent && tab != event.originalEvent.scope)
                hideOverlays(state[tab]);
        });
    });

    isListenerAdded = true;

    const $html = $(html).i18n();

    $("#" + m_newTabId + "_header").prepend($html);

    // Used to filter timeperiod array.
    rv.formatters['filter'] = (arr, type) => {
        return arr.filter((item) => {
            return item.type == type
        });
    }

    view[m_newTabId] = rv.bind($html[0], state[m_newTabId]);

    const root = $html.find('.chart-template-manager-root');
    template_manager[m_newTabId] = templateManager.init(root, m_newTabId);

    // Stop event propagation for these overlays.
    $html.find(".loadSaveOverlay").on("click", (e) => { e.stopPropagation() });
    $html.find(".exportOverlay").on("click", (e) => { e.stopPropagation() });
    responsiveButtons(state[m_newTabId], $("#" + m_newTabId).find(".chart-view"));

}

/* allow settings to be updated when a new chart template is applied */
export const updateOptions = (newTabId, chartType, timePeriod, indicatorsCount, overlayCount) => {
    const s = state[newTabId];
    if (!s) return;
    s.chartType = chartType_arr.filter((chart) => {
        return chart.value == chartType
    })[0];
    s.timePeriod = timeperiod_arr.filter((tp) => {
        return timePeriod == tp.value
    })[0];
    s.indicatorsCount = indicatorsCount;
    s.overlayCount = overlayCount;
    //Disable candlestick and OHLC if it is a tick chart or overlaid view
    showCandlestickAndOHLC(newTabId, !isTick(timePeriod) && overlayCount > 0);
    responsiveButtons(s, $("#" + newTabId).find(".chart-view"));
}

export const disableEnableCandlestickAndOHLC = (newTabId, enable) => {
    if (state[newTabId]) {
        showCandlestickAndOHLC(newTabId, enable);
    }
}

/**
 * Supported chartTypes are - candlestick, dot, line, dotline, ohlc, spline, table
 * @param newTabId
 * @param chartType
 */
export const selectChartType = (newTabId, chartType, generateEvent) => {
    if (generateEvent) {
        state[newTabId].changeChartType(state[newTabId], chartType);
    } else {
        state[newTabId].chartType = chartType_arr.filter((chart) => {
            return chart.value == chartType
        })[0];
    }
}

export const cleanBinding = (newTabId) => {
    if (view[newTabId]) {
        view[newTabId].unbind();
        template_manager[newTabId] && template_manager[newTabId].unbind();
        delete template_manager[newTabId];
        delete view[newTabId];
        delete state[newTabId];
    }
}

export const setIndicatorsCount = (count, newTabId) => {
    state[newTabId].indicatorsCount = count;
}

export const getAllChartsWithTheirTypes = () => {
    return _.keys(state).map((id) => {
        return { id: id, chartType: state[id].chartType.value };
    });
}

export default {
    init,
    updateOptions,
    disableEnableCandlestickAndOHLC,
    selectChartType,
    cleanBinding,
    setIndicatorsCount,
    getAllChartsWithTheirTypes
}
