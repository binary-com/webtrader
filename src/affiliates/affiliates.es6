/**
 * URL parameters
	 affiliates - true/false
	 instrument - e.g, frxUSDJPY
	 timePeriod - 1t, 1m, 2m, 3m, 5m, 10, 15m, 30m, 1h, 2h, 4h, 8h, 1d
	 lang - en, de, etc - Any supported lang code
	 hideOverlay - true/false
	 hideShare - true/false
	 hideFooter - true/false
	 timezone
 	 chartContainerID - chart container ID which will have chart header and highchart chart
 */
import $ from 'jquery';
import liveapi from '../websockets/binary_websockets';
import menu from '../navigation/menu';
import _ from 'lodash';
import '../common/util';
import chartOptions from '../charts/chartOptions';
import tableView from "../charts/tableView";
import html from 'text!../charts/chartWindow.html';
import charts from '../charts/charts';
import instruments from '../instruments/instruments';
import 'jquery-growl';
import chartWindow from '../charts/chartWindow';

const init_chart_options = (dialog, timePeriod, type, instrumentName, instrumentCode, hideShare, hideOverlay) => {
    const id = dialog.attr('id');
    /* initialize chartOptions & table-view once chart is rendered */
    const table_view = tableView.init(dialog, offset);
    chartOptions.init(id, timePeriod, type, table_view.show, instrumentName, instrumentCode, !hideShare, !hideOverlay);
};

//Check for format of timezone eg: (GMT+5.30)
const formatCheck = new RegExp(/^(GMT[\+|-])\d{1,2}(\.\d{1,2})*$/),
    tzString = getParameterByName("timezone").toUpperCase().replace(" ", "+"); //Browsers change '+' in url to " "
let offset = 0;

if (formatCheck.test(tzString)) {
    const tzValue = tzString.split("GMT")[1],
        hours = parseInt(tzValue.split(".")[0]),
        minutes = tzValue.split(".")[1] ? hours > 0 ? parseInt(tzValue.split(".")[1]) : parseInt(tzValue.split(".")[1]) * -1 : 0;
    offset = (-1) * (hours * 60 + minutes);
}

Highcharts.setOptions({
    global: {
        timezoneOffset: offset // Changing time zone.
    },
    plotOptions: {
        candlestick: {
            lineColor: 'rgba(0,0,0,1)',
            color: 'rgba(215,24,24,1)',
            upColor: 'rgba(2,146,14,1)',
            upLineColor: 'rgba(0,0,0,1)'
        }
    }
});

export const init = () => {
    /* when we are on affiliates route we need to disable overflow-x */
    $('body').addClass('affiliates');

    // get chart window html.
    const newTabId = getParameterByName('chartContainerID') || "webtrader-dialog-1",
        timePeriod = getParameterByName('timePeriod') || '1d',
        type = timePeriod == '1t' ? 'line' : 'candlestick';

    //if chart was already initialized, then first destroy them
    const $html = $(html).i18n();
    $html.attr("id", newTabId)
        .find('div.chartSubContainerHeader').attr('id', newTabId + "_header").end()
        .find('div.chartSubContainer').attr('id', newTabId + "_chart").end();

    // load market information (instruments) from API.
    //Trigger async loading of instruments and trade menu and refresh
    instruments
        .init()
        .then((_instrumentJSON) => {
            if (!$.isEmptyObject(_instrumentJSON)) {
                const instrumentCode = getParameterByName('instrument');
                const instrumentObject = getObjects(_instrumentJSON, 'symbol', instrumentCode);
                if (instrumentObject && instrumentObject.length > 0 && instrumentObject[0].symbol && instrumentObject[0].display_name) {
                    // validate the parameters here.
                    if (validateParameters()) {
                        const instrumentCode = instrumentObject[0].symbol;
                        const instrumentName = instrumentObject[0].display_name;
                        const delayAmount = instrumentObject[0].delay_amount || 0;
                        /* @@url-param
                         * hideOverlay(boolean) - used for hiding comparison in chart options
                         * hideShare(boolean) - used for hidinig share in chart options.
                         * hideFooter(boolean) - used for hiding link in the footer
                         * timezone(GMT+5.30) - get timezone.
                         */
                        const hideOverlay = isHideOverlay(),
                            hideShare = isHideShare();
                        //Render in normal way
                        const options = {
                            instrumentCode: instrumentCode,
                            instrumentName: instrumentName,
                            timePeriod: timePeriod,
                            type: type,
                            delayAmount: delayAmount,
                            name: newTabId
                        };
                        chartWindow.add_chart_options(newTabId, options);
                        charts.drawChart("#" + newTabId + "_chart", {
                            instrumentCode: instrumentCode,
                            instrumentName: instrumentName,
                            timePeriod: timePeriod,
                            type: type,
                            delayAmount: delayAmount
                        });
                        init_chart_options($html, timePeriod, type, instrumentName, instrumentCode, hideShare, hideOverlay);
                        _.defer(() => {
                            charts.triggerReflow("#" + newTabId + "_chart");
                            //This is used to notify any affiliate who might want to listen for timePeriod change 
                            $('#' + newTabId).on('chart-time-period-changed', (e, timePeriod) => {
                                window['timePeriodChangeListener'] && window['timePeriodChangeListener'](timePeriod);
                            });
                        });
                    } else {
                        $.growl.error({
                            message: "Invalid parameter(s)!".i18n()
                        });
                        $html.find('div.chartSubContainerHeader').hide();
                    }
                } else {
                    $.growl.error({
                        message: "Instrument Code Unknown/Unavailable!".i18n()
                    });
                    $html.find('div.chartSubContainerHeader').hide();
                }
            }
        })
        .catch((e) => {
            console.log(e);
            $.growl.error({
                message: "Error getting market information!".i18n()
            });
            $html.find('div.chartSubContainerHeader').hide();
        });

    $(".mainContainer").append($html);
    $('#' + newTabId + " .chartSubContainer").height($(window).height() - 50).width($(window).width());
    $('#' + newTabId + " .table-view").width($(window).width());
    $(window).resize(() => {
        $('#' + newTabId + " .chartSubContainer").height($(window).height() - 50).width($(window).width());
        $('#' + newTabId + " .table-view").width($(window).width());
    });
}

export default {
	init
}
