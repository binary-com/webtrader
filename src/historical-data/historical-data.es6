import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import moment from 'moment';
import 'highstock-release/modules/offline-exporting';
import 'common/util';
import wtcharts from 'webtrader-charts';
import html from 'text!./historical-data.html';
import 'css!./historical-data.css';
import {getMarketData} from '../instruments/instruments';

let dialog = null;

const buildMenu = (callback) => {
   const markets = getMarketData();
   const menu = `<ul>${
      markets.map(m => `<li><div>${m.display_name}</div><ul>${
         m.submarkets.map(s => `<li><div>${s.display_name}</div><ul>${
            s.instruments.map(i => `<li symbol='${i.symbol}'><div>${i.display_name}</div></li>`).join('')
         }</ul></li>`).join('')
      }</ul></li>`).join('')
   }</ul>`;
   const $menu = $(menu);
   $menu.find('li[symbol]').on('click', (e,a) => {
      const li = $(e.target).closest('li');
      callback(li.attr('symbol'), $(e.target).text());
   });
   return $menu;
};
export const createWindow = function(options) {
    const options_copy = options;
    const $root = $(html);
    options = $.extend({
        title: 'Historical Data For'.i18n(),
        relativePosition: true,
        dialogClass: 'historical-data-dialog',
        close: function() {
            chart.actions.destroy();
            $(this).dialog('destroy').remove(); //completely remove this dialog
            dialog = null;
        },
        width: 700,
        height: 400,
        open: function() {
            const dialog = $(this);
            $(this).parent().promise().done(() => chart.actions.reflow());
        }
    }, options);

    dialog = windows.createBlankWindow($root, options);
    let chart = wtcharts.chartWindow.addNewChart($root, options_copy);
    chart.actions.reflow();

    const menu = buildMenu((symbol, display_name) => {
       titlebar.find('.title').text(display_name);
       options_copy.instrumentName = display_name;
       options_copy.instrumentCode = display_name;
    });
    const titlebar = $(`<div class='titlebar' ><div class='title'>${options_copy.instrumentName}</div>`);
    $root.closest('.ui-dialog').append(titlebar);
    titlebar.append(menu);
    menu.menu();

    dialog.addDateToHeader({
      title: 'From Date: ',
      date: moment.utc().subtract(1, "years").toDate(),
      addDateDropDowns: false,
      changed: yyyy_mm_dd => {
         console.warn(yyyy_mm_dd);
      }
    });

    // const update_track = dialog.track({
    //     module_id: 'historical-data',
    //     is_unique: false,
    //     data: null
    // });

    dialog.dialog('open');

    return dialog;
};

export const init = $menuLink => {
   $menuLink.click(() => {
      dialog && dialog.moveToTop() || createWindow({
         instrumentCode: 'frxAUDJPY',
         instrumentName: 'AUD/JPY',
         timePeriod: '1d',
         type: 'candlestick',
         showInstrumentName: true,
         indicators: [],
         overlays: []
      });
   });
};

export default { init };
