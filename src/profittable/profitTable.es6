/**
 * Created by amin on October 29, 2015.
 */
import $ from  "jquery";
import _ from "lodash";
import windows from "../windows/windows";
import liveapi from "../websockets/binary_websockets";
import viewTransaction from '../viewtransaction/viewTransaction';
import "datatables";
import "jquery-growl";
import '../common/util';
import "css!./profitTable.css";
import html from 'text!./profitTable.html';

let profitWin = null,
   table = null,
   datepicker = null;

export const init = ($menuLink) => {
   $menuLink.click(() => {
      if (!profitWin)
         liveapi.cached.authorize()
            .then(initProfitWin)
            .catch((err) => {
               console.error(err);
               $.growl.error({ message: err.message });
            });
      else{       
         profitWin.moveToTop();
      }
   });
}

let loading = false;
const options = { offset : 0, limit: 200 };
let is_specific_date_shown = false; /* is data for a specific date is shown */

const refreshTable = (yyyy_mm_dd) => {
   const processing_msg = $('#' + table.attr('id') + '_processing').css('top','200px').show();
   loading = true;

   const request = {
      profit_table: 1,
      description: 1,
      sort: 'DESC'
   };

   /* if a date is specified get the transactions for that date */
   if (typeof yyyy_mm_dd === 'string') {
      request.date_from = yearMonthDayToEpoch(yyyy_mm_dd, { utc: true });
      const one_day_utc = Date.UTC(1970, 0, 1, 23, 59, 59) / 1000;
      request.date_to = request.date_from + one_day_utc;
      table.api().rows().remove();
      is_specific_date_shown = true;
   }
   else  { /* request the next 50 items for live scroll */
      request.limit = 250;
      if(is_specific_date_shown || yyyy_mm_dd.clear) {
         table.api().rows().remove();
         is_specific_date_shown = false;
      }
      request.offset = table.api().column(0).data().length;
   }

   /* refresh the table with result of { profit_table:1 } from WS */
   const refresh = (data) => {
      const transactions = (data.profit_table && data.profit_table.transactions) || [];
      const rows = transactions.map((trans) => {
         const profit = (parseFloat(trans.sell_price) - parseFloat(trans.buy_price)).toFixed(currencyFractionalDigits()); //= parseFloat(trans.sell_price) - parseFloat(trans.buy_price)
         const view_button = '<button>View</button>'.i18n();
         try{
            trans.longcode;            
         }catch(err){
            console.log(trans);
         }
         return [
            epochToString(trans.purchase_time, { utc: true }),
            trans.transaction_id,
            trans.longcode,
            formatPrice(trans.buy_price,local_storage.get("currency")),
            epochToString(trans.sell_time, { utc: true }),
            formatPrice(trans.sell_price,local_storage.get("currency")),
            profit,
            view_button,
            trans, /* we will use it when handling arrow clicks to show view transaction dialog */
         ];
      });
      table.api().rows.add(rows);
      table.api().draw();
      loading = false;
      processing_msg.hide();
   };

   liveapi.send(request)
      .then(refresh)
      .catch((err) => {
         refresh({});
         $.growl.error({ message: err.message });
         console.error(err);
      });
}

const on_arrow_click = (e) =>{
   const target = e.target;
   const $target = $(target);
   if(target.tagName !== 'BUTTON' || $target.hasClass('button-disabled')) return;
   const tr = target.parentElement.parentElement;
   let transaction = table.api().row(tr).data();
   transaction = _.last(transaction);
   $target.addClass('button-disabled');
   viewTransaction.init(transaction.contract_id, transaction.transaction_id)
      .then(() => $target.removeClass('button-disabled'))
      .catch(err => {
         $target.removeClass('button-disabled');
         $.growl.error({ message: err.message });
      });
}

const initProfitWin = () => {
   profitWin = windows.createBlankWindow($('<div/>'), {
      title: 'Profit Table'.i18n(),
      dialogClass: 'profitTable',
      width: 800 ,
      height: 400,
      destroy: () => {
         table && table.DataTable().destroy(true);
         profitWin = null;
      },
      refresh: () => {
         datepicker.clear();
         refreshTable({clear:true});
      },
      'data-authorized': 'true'
   });
   profitWin.track({
      module_id: 'profitTable',
      is_unique: true,
      data: null
   });

   table = $(html).i18n();
   table.appendTo(profitWin);
   const footer = $('<div/>').addClass('profit-table-info');

   table = table.dataTable({
      data: [],
      columnDefs: [ {
         targets: 6,
         createdCell: (td, cellData) => {
            const css_class = (cellData < 0) ? 'red' : (cellData > 0) ? 'green' : 'bold';
            if (css_class)
               $(td).addClass(css_class);
            $(td).attr("data-src", cellData);
            td.innerHTML = formatPrice(cellData,local_storage.get("currency"));
         }
      }],
      info: false,
      footerCallback: function ( row, data, start, end, display ) {
         const api = this.api();

         const total = api.column(6).data()
            .reduce((a, b) => (a*1 + b*1), 0);

         const css = 'total ' + (total >= 0 ? 'green' : 'red');
         footer.html(
            '<span class="title">Total Profit/Loss<span>' +
            '<span class="' + css + '">'+ formatPrice(total,local_storage.get("currency")) +'</span>'
         );
      },
      paging: false,
      ordering: false,
      searching: true,
      processing: true
   });
   footer.i18n().appendTo(table.parent());
   table.parent().addClass('hide-search-input');

   // Apply the a search on each column input change
   table.api().columns().every(function () {
      const column = this;
      $('input', this.header()).on('keyup change', function () {
         if (column.search() !== this.value)
            column.search(this.value) .draw();
      });
   });

   refreshTable({clear: true});
   datepicker = profitWin.addDateToHeader({
      title: 'Jump to: '.i18n(),
      date: null, /* set date to null */
      changed: refreshTable,
      cleared: refreshTable
   });

   profitWin.dialog('open');
   profitWin.on('click', on_arrow_click);

   /**************** infinite scroll implementation *******************/
   profitWin.scroll(() => {
      const scrollTop = profitWin.scrollTop(),
         innerHeight = profitWin.innerHeight(),
         scrollHeight = profitWin[0].scrollHeight,
         postion = (scrollTop + innerHeight) / scrollHeight;
      if(postion > 0.75 && !loading && !is_specific_date_shown){
         refreshTable({clear:false});
      }
   });
}

export default { init }
