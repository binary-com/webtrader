import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import moment from 'moment';
import 'timepicker';
import 'highstock-release/modules/offline-exporting';
import 'common/util';
import 'webtrader-charts';
import html from 'text!./historical-data.html';
import _ from 'lodash';
import 'jquery-ui';
import 'css!./historical-data.css';
import {getMarketData} from '../instruments/instruments';

let dialog = null;

const buildMenu = ($root, instrumentName, callback) => {
   const markets = getMarketData();
   if(!markets || !markets.length){
      _.delay(() => buildMenu($root, instrumentName, callback), 1000);
      return;
   }
   const menu = `<ul>${
      markets.map(m => `<li><div>${m.display_name}</div><ul>${
         m.submarkets.map(s => `<li><div>${s.display_name}</div><ul>${
            s.instruments.map(i => `<li symbol='${i.symbol}'><div>${i.display_name}</div></li>`).join('')
         }</ul></li>`).join('')
      }</ul></li>`).join('')
   }</ul>`;
   const $menu = $(menu);
   $menu.find('li[symbol]').on('click', (e,a) => {
      const display_name = $(e.target).text();
      const symbol = $(e.target).closest('li').attr('symbol');
      titlebar.find('.title').text(display_name);
      callback(symbol, display_name);
   });
   const titlebar = $(`<div class='instrument-dropdown' ><div class='title'>${instrumentName}</div>`);
   $root.closest('.ui-dialog').append(titlebar);
   titlebar.append($menu);
   $menu.menu();
};

const buildDatetime = (dialog, $root, callback) => {
    const datetime = $(`<div class='date-time'>
                    <input type="text" class="date" tab-index="-1" readonly></input>
                    <input type="text" class="time" tab-index="-1" value="00:00" readonly></input>
          </div>`);
    $root.closest('.ui-dialog').append(datetime);
    datetime.find('.date')
       .datepicker({
             changeMonth : true,
             // showAnim: 'drop',
             numberOfMonths: 1,
             changeYear : true,
             dateFormat : 'yy-mm-dd',
             onSelect: function () { $(this).change(); update_time(); },
             beforeShow: (input, inst) => {
                _.delay(() => inst.dpDiv.css({
                   marginLeft: '-60px',
                   top: datetime.find('.date').offset().top + 32,
                   left: datetime.find('.date').offset().left,
                   zIndex: dialog.closest('.ui-dialog').css('z-index')*1 + 100
                }));
             },
             minDate : moment.utc().subtract(1, 'years').toDate(),
             maxDate : moment.utc().toDate(),
         })
         .datepicker('setDate', '0');

     datetime.find('.time')
         .timepicker({
            showCloseButton : false,
            beforeShow: (input, inst) => inst.tpDiv.css({
                marginLeft: '-120px',
                marginTop: '6px',
                zIndex: 101,
            }),
            onSelect: function() { $(this).change(); update_time(); },
         });
    const update_time = () => {
       const date = datetime.find('.date').val();
       const time = datetime.find('.time').val();
       const result = moment(`${date} ${time} +0000`, 'YYYY-MM-DD HH:mm Z').unix()*1;
       callback && callback(result);
    };
};
export const createWindow = function(options) {
    let options_copy = options;
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
        resize: () => chart && chart.actions.reflow(),
        width: 700,
        height: 400,
        open: function() {
            const dialog = $(this);
            $(this).parent().promise().done(() => chart.actions.reflow());
        }
    }, options);

    dialog = windows.createBlankWindow($root, options);

    let chart = null;
    const show_chart = () => {
       chart && chart.actions.destroy(); chart = null;
       chart = WebtraderCharts.chartWindow.addNewChart($root, options_copy);
       chart.actions.reflow();
       chart.events.anyChange = () => {
          options_copy = chart.data();
       };
    };
    show_chart();

    buildMenu($root, options_copy.instrumentName, (symbol, display_name) => {
       options_copy.instrumentName = display_name;
       options_copy.instrumentCode = symbol;
       show_chart();
    });
    buildDatetime(dialog, $root, (start) => {
       options_copy.start = start;
       show_chart();
    });
 
    const update_track = dialog.track({
        module_id: 'historicalData',
        is_unique: true,
        data: null
    });

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
         showOverlays: false,
         indicators: [],
         overlays: [],
         start: moment.utc().subtract(1, "years").startOf('day').unix()*1,
      });
   });
};

export default { init };
